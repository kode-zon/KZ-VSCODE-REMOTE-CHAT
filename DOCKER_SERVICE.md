# Docker Service Backend for KodeZon Remote Chat

This directory contains the backend Docker service for the KodeZon Remote Chat system.

## Setup

1. Build the Docker image
2. Run as a service listening on port 8080
3. Configure VS Code extension to connect to this service

## API Endpoints

The service must implement these endpoints:

### GET /api/chat-requests/pending
Returns array of pending chat requests

**Response:**
```json
[
  {
    "id": "req-123",
    "workspaceName": "My Project",
    "workspacePath": "/home/user/projects/my-project",
    "workspaceId": "workspace-id",
    "question": "Should I proceed with this refactoring?",
    "timestamp": 1700000000000,
    "requesterName": "AI Assistant",
    "status": "pending"
  }
]
```

### POST /api/notifications/send
Send notification to mobile device

**Request:**
```json
{
  "requestId": "req-123",
  "workspaceName": "My Project",
  "workspacePath": "/home/user/projects/my-project",
  "workspaceId": "workspace-id",
  "question": "Should I proceed with this refactoring?",
  "timestamp": 1700000000000,
  "actionUrl": "http://localhost:3000/notifications/req-123",
  "deviceId": "vscode-1700000000000"
}
```

**Response:** 200 OK

### POST /api/chat-requests/respond
Submit approval or rejection

**Request:**
```json
{
  "requestId": "req-123",
  "approved": true,
  "responseTime": 45000,
  "responderId": "vscode-1700000000000",
  "responderNote": "Approved"
}
```

**Response:** 200 OK

### GET /api/chat-requests/:requestId/status
Get current status of a request

**Response:**
```json
{
  "requestId": "req-123",
  "approved": true,
  "responseTime": 45000
}
```

## Environment Variables

- `PORT`: Service port (default: 8080)
- `NOTIFICATION_SERVICE_URL`: URL to send mobile notifications
- `LOG_LEVEL`: Logging level (default: info)

## Development

```bash
docker build -t kodezon-remote-chat-backend .
docker run -p 8080:8080 kodezon-remote-chat-backend
```
