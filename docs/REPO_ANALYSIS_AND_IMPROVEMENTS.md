# CMIS Engagement Platform – Repo Analysis & Improvements

## Current Faults & What Is Failing

### 1. **API response shape vs frontend**
- **SAM backend** returns `{ events, count }` from `GET /events`.
- **Frontend** does `allEvents = await response.json()` then `allEvents.filter(...)`. If the backend returns an object, `allEvents.filter` throws (objects don’t have `.filter`).
- **Fix:** Normalize in frontend: use `data.events ?? data` (or treat as array when applicable).

### 2. **Attribute naming (SAM vs frontend)**
- SAM uses **PascalCase**: `EventID`, `Date`, `Title`, `CurrentRSVPs`, `Status`.
- Frontend expects **camelCase**: `eventId`, `dateTime`, `title`, `rsvpCount`, `capacity`.
- **Fix:** Backend should return a normalized shape (camelCase) for the API, or frontend must map both shapes.

### 3. **getEventById includes cancelled RSVPs in count**
- RSVPs are queried without filtering by `Status`. `rsvpCount` is `rsvps.length` (all RSVPs).
- **Fix:** Count only `Status === 'Confirmed'` so count matches `CurrentRSVPs` and UI is correct.

### 4. **Full table Scan for listing events**
- `getEvents.js` uses `ScanCommand` with filter, then in-memory date filter and sort. Cost and latency grow with table size.
- **Fix:** Add GSI (e.g. Status + Date) and use Query for “upcoming” and optionally a PastEvents table for “past” with partition key.

### 5. **No pagination**
- Neither backend uses `LastEvaluatedKey`; all items are returned. Can break with large datasets.
- **Fix:** Support limit + pagination token and document in API.

### 6. **deleteEvent hard-deletes RSVPs**
- Event is soft-deleted (Status = Cancelled), but all RSVPs are **hard-deleted** via BatchWriteItem. History is lost and behaviour differs from cancel-RSVP (which soft-deletes).
- **Fix:** Never delete RSVPs; only update event Status. Optionally mark RSVPs as Cancelled in bulk; do not delete.

### 7. **BatchWriteItem UnprocessedItems not retried**
- In `deleteEvent.js`, RSVP deletes (when we had them) don’t retry `UnprocessedItems`. Under throttling, some deletes could be skipped.
- **Fix:** With “never delete”, this path goes away; for any remaining batch writes, add retry for UnprocessedItems.

### 8. **Optimistic locking on RSVP**
- `rsvpEvent.js` and `cancelRsvp.js` update `Version` on the event. Any RSVP/cancel changes the version, so admin edits often get 409 (version changed) even when only RSVPs changed.
- **Fix:** Use `Version` only for admin PUT (updateEvent). Do not bump Version in rsvpEvent or cancelRsvp.

### 9. **No waitlist**
- When event is full, API returns 409 “at full capacity”; users cannot join a waitlist.
- **Fix:** Add Waitlist table and “join waitlist” endpoint; on cancel or capacity increase, process waitlist (FIFO) and optionally use SQS FIFO for ordering.

### 10. **Two backends, two schemas**
- Terraform uses `eventId`/`userId`; SAM uses `EventID`/`UserID`. Mixing stacks causes key mismatches. This doc and implementation focus on the **SAM** backend as the primary.

---

## Implemented Improvements

### A. Waitlist
- **Waitlist table:** PK `EventID`, SK `JoinedAt#UserID` for FIFO order per event.
- **POST /events/:id/waitlist:** Join waitlist when event is full (409 from RSVP). Idempotent by user.
- **Processing:** On cancel RSVP (or capacity increase), one slot opens; a **FIFO SQS queue** is used so a processor Lambda promotes one waitlist entry (FIFO) to confirmed RSVP and notifies.

### B. Robust scan/search and past events
- **Events table GSI:** `StatusDateIndex` – PK `Status`, SK `Date`. List upcoming = Query `Status = 'Active' AND Date >= now` (and optionally paginate).
- **PastEvents table:** PK `YearMonth` (e.g. `2025-02`), SK `Date#EventID`. Events whose date has passed are **copied** here (or written by a scheduled job) and event Status set to `Archived`. No delete; “past” list comes from Query on PastEvents by partition.
- **Never delete:** Events and RSVPs are only hidden/filtered (Status = Cancelled / Archived).

### C. Never delete – hide, filter
- **deleteEvent:** Only updates event `Status` to `Cancelled`. No RSVP deletes; RSVP records kept for history.
- **List/get:** Filter by Status (Active/Archived); cancelled events excluded from default listing.

### D. High-frequency traffic – optimistic locking and queue
- **Optimistic locking:** `Version` is updated only in `updateEvent.js` (admin). `rsvpEvent` and `cancelRsvp` no longer modify `Version`.
- **FIFO queue:** SQS FIFO queue for “process waitlist for event X”. On RSVP cancel, enqueue message; processor Lambda promotes one waitlist user (FIFO) to RSVP. Optionally, RSVP requests can be enqueued (API returns 202) and processed by the same or another FIFO queue for serialized capacity updates.

---

## File and table reference

| Area            | Files / resources |
|----------------|-------------------|
| Backend (SAM)  | `backend/src/lambdas/*.js`, `backend/template.yaml` |
| Frontend       | `src/routes/events/+page.svelte`, `EventCard.svelte`, `src/lib/config.js` |
| Infra          | `infra/dynamodb.tf` (Terraform; separate from SAM) |

## Deployment notes (SAM)

- **Events table:** A new GSI `StatusDateIndex` (Status, Date) was added. If the table already exists without it, `sam deploy` will update the table to add the GSI.
- **New resources:** Waitlist table, PastEvents table, SQS FIFO queue, and Lambdas: `joinWaitlist`, `processWaitlist`, `getPastEvents`, `archivePastEvents`. The archive Lambda runs daily (2 AM UTC) to move past events into the PastEvents table and set their status to `Archived`.
- **FIFO queue:** The waitlist processor is triggered by the SQS FIFO queue; when a user cancels an RSVP, a message is enqueued (MessageGroupId = eventId) so promotions are processed in order per event.
