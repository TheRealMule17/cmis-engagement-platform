# CMIS Engagement Platform - Frontend

**Team 12th Man - Event Core System**

This is the frontend application for the CMIS (Center for Management of Information Systems) Engagement Platform. It serves as the primary interface for students to browse events, RSVP, and for administrators to manage the event catalog.

## Table of Contents
- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started - Local Development](#getting-started---local-development)
- [Environment Variables](#environment-variables)
- [Features](#features)
- [Data Model](#data-model)
- [API Endpoints](#api-endpoints)
- [Development Notes](#development-notes)
- [Deployment (Backend)](#deployment-backend)
- [Team Members](#team-members)
- [Phase 1 Acceptance Criteria](#phase-1-acceptance-criteria)

## Project Overview

The CMIS Engagement Platform is designed to streamline event management and student engagement. The Event Core System (Phase 1) focuses on:
-   Listing upcoming events.
-   Allowing students to RSVP.
-   Providing real-time capacity feedback.
-   Admin tools for event creation and management.

## Tech Stack

-   **Frontend**: [SvelteKit](https://kit.svelte.dev/) (Vite-based)
-   **Backend**: AWS Lambda (Node.js)
-   **Database**: Amazon DynamoDB
-   **Infrastructure**: Terraform
-   **API**: Amazon API Gateway

## Project Structure

```bash
/
├── src/
│   ├── routes/              # Page components (File-based routing)
│   │   ├── events/          # Student view (Catalog)
│   │   └── events/admin/    # Admin view (Manage events)
│   ├── lib/
│   │   ├── components/      # Reusable UI components
│   │   │   └── events/      # Event-specific components (Card, Form, FilterBar)
│   │   └── config.js        # Centralized API configuration
├── infra/                   # Terraform infrastructure definitions
└── backend/                 # Lambda function source code and SAM templates
```

## Getting Started - Local Development

**Prerequisites**: Node.js 18+

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd cmis-engagement-platform
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment**:
    Create a `.env` file in the root directory (copy from `.env.example`):
    ```bash
    cp .env.example .env
    ```
    *Note: If you don't have a backend URL yet, the app will automatically use mock data.*

4.  **Run the development server**:
    ```bash
    npm run dev
    ```

5.  **Open the application**:
    Navigate to `http://localhost:5173` in your browser.

## Environment Variables

| Variable | Description |
| :--- | :--- |
| `VITE_API_GATEWAY_URL` | The base URL for the AWS API Gateway (e.g., `https://xyz.execute-api.us-east-1.amazonaws.com/prod`). |

## Features

-   **Event Catalog**: Browse upcoming events with filtering by Category, Date, or Search by Title.
-   **RSVP System**: 
    -   One-click RSVP with visual confirmation.
    -   Real-time capacity tracking (progress bar).
    -   "Full" status handling (disables button when capacity reached).
-   **Admin Management**:
    -   Create new events with validation.
    -   Edit existing events.
    -   Delete events.
-   **Thick Client Architecture**: Filtering and sorting happens instantly on the client side after initial data load.

## Data Model

### Event Schema (`EventsTable`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `eventId` | String (UUID) | Unique identifier (Partition Key). |
| `title` | String | Title of the event. |
| `dateTime` | String (ISO) | Date and time of the event. |
| `category` | String | Enum: 'Career', 'Social', 'Networking', 'Mentorship'. |
| `capacity` | Number | Maximum number of attendees. |
| `rsvpCount` | Number | Current number of RSVPs (aggregated). |

### RSVP Schema (`RSVPsTable`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `eventId` | String | Event ID (Partition Key). |
| `userId` | String | User ID (Sort Key). |
| `timestamp` | String (ISO) | When the RSVP was created. |

## API Endpoints

All endpoints are relative to `VITE_API_GATEWAY_URL`.

-   `GET /events` - Retrieve all events.
-   `GET /events/{id}` - Retrieve a specific event.
-   `POST /events` - Create a new event.
-   `PUT /events/{id}` - Update an existing event.
-   `DELETE /events/{id}` - Delete an event.
-   `POST /events/{id}/rsvp` - RSVP to an event.

## Development Notes

-   **Mock Data**: The application includes a "Demo Safety Net". If the API connection fails (or isn't configured), the frontend falls back to local mock data to ensure the UI is visually functional for demonstrations.
-   **Naming Convention**: All frontend code uses **camelCase** for properties (e.g., `eventId`, `dateTime`) to match the updated Javascript-friendly data model.
-   **CORS**: The backend infrastructure (API Gateway) must have CORS enabled to allow requests from `localhost:5173`.

## Deployment (Backend)

1.  Ensure you have AWS CLI configured and Terraform installed.
2.  Navigate to the `infra/` directory.
3.  Run `terraform init` and `terraform apply`.
4.  Copy the `api_gateway_url` from the Terraform output.
5.  Update your frontend `.env` file with this URL.

## Team Members

**Team 12th Man**

## Phase 1 Acceptance Criteria

- [x] Functional Event Catalog (List View)
- [x] Filtering (Category, Date) and Search
- [x] Event Details Card
- [x] RSVP Functionality (Button + Counter)
- [x] Admin: Create/Edit/Delete Events
- [x] Visual Capacity Indicator
- [x] Client-side Validation
- [x] Responsive Design (Mobile/Desktop)
