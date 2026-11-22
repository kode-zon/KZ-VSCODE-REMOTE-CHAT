# Mobile Web Interface for KodeZon Remote Chat

This document describes the expected mobile web interface (port 3000) that displays chat approval requests.

## Architecture

```
Mobile Browser (port 3000)
├── Dashboard / Request List Page
│   ├── Display all pending requests
│   ├── Show workspace information
│   └── Action buttons (Approve/Reject)
├── Request Detail Page
│   ├── Full question text
│   ├── Workspace context
│   ├── Approval/Rejection buttons
│   └── Response notes field
└── Settings Page
    └── Configure connection to Docker backend
```

## Pages & Routes

### `/` or `/requests`
Main dashboard showing all pending requests

**Display:**
- Request ID
- Workspace name and path
- Question (truncated)
- Time since request
- Action buttons (Approve/Reject)

**Data fetched from:**
- `GET http://localhost:8080/api/chat-requests/pending`

### `/notifications/:requestId`
Detail page for a specific request

**Display:**
- Full question text
- Complete workspace path
- Workspace ID
- Timestamp
- Approve/Reject buttons with optional note field

**On Approve/Reject:**
- POST to `http://localhost:8080/api/chat-requests/respond`
- Request body: `{ requestId, approved, responseTime, responderId, responderNote }`

### `/settings`
Configuration page

**Fields:**
- Docker Service URL (default: `http://localhost:8080`)
- Auto-refresh interval (default: 2000ms)
- Notification sound (on/off)

## Features

### 1. Real-time Updates
- Poll backend every 2 seconds for new requests
- WebSocket support (optional for real-time push)
- Visual indicators for new requests

### 2. Workspace Identification
- Display workspace name prominently
- Show full workspace path
- Use workspace ID for tracking across sessions

### 3. Request Actions
- **Approve**: Send approval to backend
- **Reject**: Send rejection with optional reason
- **Defer**: Postpone decision (re-queue request)
- **View More**: Expand full question text

### 4. User Feedback
- Toast notifications for successful submission
- Loading spinners during API calls
- Error messages for failed operations
- Response time display

### 5. Mobile-First Design
- Responsive layout for all screen sizes
- Touch-friendly buttons and controls
- Minimal scrolling required
- Clear typography and spacing

## API Integration

### Polling for Requests
```javascript
async function fetchPendingRequests() {
  const response = await fetch('http://localhost:8080/api/chat-requests/pending');
  return response.json(); // Returns ChatRequest[]
}
```

### Submitting Approval
```javascript
async function submitApproval(requestId, approved, note = '') {
  const response = await fetch('http://localhost:8080/api/chat-requests/respond', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestId,
      approved,
      responseTime: Date.now() - requestTimestamp,
      responderId: getDeviceId(),
      responderNote: note
    })
  });
  return response.ok;
}
```

## Example Implementation Stack

Suggested tech stack for the mobile web interface:
- **Frontend**: React, Vue, or plain HTML/JS
- **Styling**: Tailwind CSS or Material Design
- **State Management**: Redux, Vuex, or Context API
- **HTTP Client**: Fetch API or Axios
- **Real-time**: WebSocket or Server-Sent Events (SSE)

## Environment Variables

- `REACT_APP_DOCKER_HOST`: Docker service URL (default: `http://localhost:8080`)
- `REACT_APP_POLL_INTERVAL`: Polling interval in ms (default: 2000)
- `REACT_APP_NOTIFICATION_SOUND`: Sound file path for notifications (optional)

## Example Flow

```
1. User opens mobile browser to http://localhost:3000
2. App loads and polls GET /api/chat-requests/pending from Docker service
3. If requests exist, they're displayed in a list
4. User taps on a request to view details
5. User reviews the question and workspace context
6. User clicks "Approve" or "Reject"
7. App POSTs response to /api/chat-requests/respond
8. Backend processes the response
9. VS Code extension receives the response status
10. AI assistant in VS Code continues based on approval
```

## Notes

- All timestamps should be in milliseconds (Unix epoch)
- Workspace IDs help track requests across sessions
- Response times are measured in milliseconds from request creation
- Mobile interface should handle poor network conditions gracefully
