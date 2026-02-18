# Integration Guide: Frontend <-> Backend

This guide outlines the steps to connect the SvelteKit frontend to the AWS Serverless backend once the infrastructure is deployed.

## Prerequisites

1.  **Backend Deployed**: You must have successfully run `terraform apply` (or `sam deploy`).
2.  **API Gateway URL**: You need the invoke URL from the deployment output (e.g., `https://<api-id>.execute-api.us-east-1.amazonaws.com/prod`).
3.  **AWS Credentials**: Your environment should have valid permissions if accessing restricted resources (Phase 1 is generally public/open for demo).

## Step-by-Step Integration

### Step 1: Get the API URL
If you deployed via Terraform, the output `api_gateway_url` will be printed in your terminal. Copy this value.

### Step 2: Configure the Frontend
1.  Navigate to the project root.
2.  Create or edit the `.env` file.
3.  Add the URL to the `VITE_API_GATEWAY_URL` variable:
    ```env
    VITE_API_GATEWAY_URL=https://your-unique-id.execute-api.us-east-1.amazonaws.com/prod
    ```

### Step 3: Restart Development Server
Vite loads environment variables at startup. You must restart the server for changes to take effect:
```bash
# Stop the server (Ctrl+C)
npm run dev
```

### Step 4: Seed Test Data
Since the database starts empty, run the seeder script to populate it with initial data so the frontend isn't blank.
```bash
# From the backend/scripts directory
node seedTestData.js
```
*Note: You may need to update the API URL inside `seedTestData.js` if it's hardcoded there.*

### Step 5: Verify in Browser
1.  Open `http://localhost:5173/events`.
2.  **Check the Console**: Open DevTools (F12) -> Console.
    -   If connected: You should NOT see the "⚠️ Could not connect to AWS" message.
    -   If failed: The app will fall back to mock data, and the console will show the Fetch Error.

## Testing Checklist

Verify the following actions to confirm full integration:

- [ ] **Data Loading**: `GET /events`
    -   Main page loads cards from DynamoDB.
- [ ] **Creation**: `POST /events`
    -   Go to Admin -> Create Event.
    -   Submit form.
    -   Verify the new event appears on the main list.
- [ ] **Updates**: `PUT /events/{id}`
    -   Go to Admin -> Edit Event.
    -   Change a title or date.
    -   Verify change is reflected on the main list.
- [ ] **Deletion**: `DELETE /events/{id}`
    -   Go to Admin -> Edit Event -> Delete.
    -   Verify event is removed.
- [ ] **RSVP**: `POST /events/{id}/rsvp`
    -   Click "RSVP" on a card.
    -   Verify the counter increments.
    -   Refresh page to ensure the count persists (proof it saved to DB).
- [ ] **Full Capacity**:
    -   Manually set an event's capacity to 1 in the DB (or create one with cap=1).
    -   RSVP once.
    -   Verify button changes to "Full" and is disabled.

## Troubleshooting

### 1. CORS Errors
**Symptom**: Console error `Access to fetch at ... has been blocked by CORS policy`.
**Fix**:
-   Ensure your Lambda functions return the `Access-Control-Allow-Origin: '*'` header.
-   Ensure API Gateway OPTIONS methods are configured to return 200 OK with CORS headers.

### 2. 404 Not Found
**Symptom**: `404` status on fetch requests.
**Fix**:
-   Check the path in `.env`. It should likely end with `/prod` (or your stage name), but **not** have a trailing slash if the code appends `/events`.
-   Verify your `API_ENDPOINTS` in `src/lib/config.js` construct the correct full URL.

### 3. Data Doesn't Show (But 200 OK)
**Symptom**: API returns success, but list is empty.
**Fix**:
-   DynamoDB might be empty. Run the seeder script.
-   Check JSON capitalization. The frontend expects `camelCase` (e.g., `eventId`, `title`). If backend returns `PascalCase` (`EventID`, `Title`), the frontend won't render it correctly.

## Curl Test Commands

Use these to test the API independently of the frontend. Replace `YOUR_API_URL` with your actual URL.

**List Events:**
```bash
curl -X GET YOUR_API_URL/events
```

**Create Event:**
```bash
curl -X POST YOUR_API_URL/events \
  -H "Content-Type: application/json" \
  -d '{"eventId": "test-1", "title": "Test Event", "date": "2026-05-20", "category": "Social", "capacity": 10}'
```

**RSVP:**
```bash
curl -X POST YOUR_API_URL/events/test-1/rsvp \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-123"}'
```

## Next Steps

1.  **Run Concurrency Tests**: Verify how the system handles multiple RSVPs at once.
2.  **Prepare Demo Script**: Write a script for the presentation showing the flow (Create -> View -> RSVP -> Full).
