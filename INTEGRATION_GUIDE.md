# Integration Guide - KodeZon Remote Chat System

This guide explains how to integrate the VS Code extension with the Docker backend and mobile web interface.

## System Overview

```
┌──────────────────────┐
│   VS Code Editor     │
│  with Extension      │
└──────────┬───────────┘
           │
           │ HTTP/REST (port 8080)
           │
┌──────────▼───────────┐
│  Docker Service      │
│  Backend API         │
└──────────┬───────────┘
           │
           │ Data Store + Push
           │
┌──────────▼───────────┐
│  Mobile Browser      │
│  (port 3000)         │
└──────────────────────┘
```

## Step 1: Setup VS Code Extension

### Installation
```bash
cd shared-sibling/KODEZON-VSCODE-REMOTE-CHAT
npm install
npm run esbuild
```

### Configuration in VS Code
1. Open Settings (Ctrl+,)
2. Search for "kodezon-remote-chat"
3. Configure the following:

```json
{
  "kodezon-remote-chat.dockerHost": "http://localhost:8080",
  "kodezon-remote-chat.mobileWebUrl": "http://localhost:3000",
  "kodezon-remote-chat.autoNotify": true,
  "kodezon-remote-chat.pollInterval": 2000
}
```

### For Remote/Docker Development
If running VS Code in a container or remote machine:

```json
{
  "kodezon-remote-chat.dockerHost": "http://docker-service-host:8080",
  "kodezon-remote-chat.mobileWebUrl": "http://your-mobile-access-url:3000"
}
```

## Step 2: Setup Docker Backend Service

### Quick Start with Docker Compose

Create a `docker-compose.yml` in the root of KODEZON_TeleOps:

```yaml
version: '3.8'

services:
  remote-chat-backend:
    build:
      context: ./shared-sibling/KODEZON-VSCODE-REMOTE-CHAT
      dockerfile: Dockerfile.backend
    ports:
      - "8080:8080"
    environment:
      - PORT=8080
      - LOG_LEVEL=INFO
    volumes:
      - ./backend-data:/app/data
    restart: unless-stopped

  remote-chat-web:
    build:
      context: ./shared-sibling/KODEZON-VSCODE-REMOTE-CHAT
      dockerfile: Dockerfile.web
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_DOCKER_HOST=http://localhost:8080
      - REACT_APP_POLL_INTERVAL=2000
    depends_on:
      - remote-chat-backend
    restart: unless-stopped
```

### Start Services
```bash
docker-compose up -d
```

### Verify Services
```bash
# Check backend
curl http://localhost:8080/health

# Check web interface
curl http://localhost:3000/health

# Check pending requests
curl http://localhost:8080/api/chat-requests/pending
```

## Step 3: Setup Mobile Web Interface

The web interface should be accessible at `http://localhost:3000` and display:

1. **Dashboard Page**
   - List of pending chat requests
   - Shows workspace name and question preview
   - Quick approve/reject buttons

2. **Detail Page** (`/notifications/:requestId`)
   - Full question text
   - Workspace information
   - Approve/Reject with optional note field

3. **Settings Page** (optional)
   - Configure connection to Docker backend
   - Adjust polling interval

## Step 4: Testing the Integration

### Test Workflow

1. **Start all services**
   ```bash
   # In VS Code
   # Extension should be active (check sidebar for KodeZon Remote Chat)
   
   # Docker services
   docker-compose up -d
   ```

2. **Trigger a test notification**
   ```bash
   # In VS Code Command Palette (Ctrl+Shift+P)
   # Run: "KodeZon Remote Chat: Test Notification"
   ```

3. **Verify notification in mobile browser**
   - Open `http://localhost:3000` on mobile device or desktop browser
   - Should see the test request in the list

4. **Approve/Reject the request**
   - Click on the request to view details
   - Click "Approve" or "Reject"
   - Should see success message

5. **Verify response in VS Code**
   - Extension should log the response
   - Check extension output: `View > Output > KodeZon Remote Chat`

### Manual API Testing

#### Send Test Request to Backend
```bash
curl -X POST http://localhost:8080/api/chat-requests \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-req-1",
    "workspaceName": "My Project",
    "workspacePath": "/home/user/projects/my-project",
    "workspaceId": "proj-123",
    "question": "Should I proceed with refactoring?",
    "timestamp": '$(date +%s%3N)',
    "requesterName": "AI Assistant",
    "status": "pending"
  }'
```

#### Get Pending Requests
```bash
curl http://localhost:8080/api/chat-requests/pending
```

#### Submit Response
```bash
curl -X POST http://localhost:8080/api/chat-requests/respond \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "test-req-1",
    "approved": true,
    "responseTime": 5000,
    "responderId": "user-123",
    "responderNote": "Looks good!"
  }'
```

## Step 5: Multi-Workspace Configuration

The extension automatically detects and includes workspace information:

### VS Code Workspaces
- **Single Folder**: Uses folder name as workspace name
- **Multi-Root Workspace**: Shows all folders, tracks requests per folder

### Mobile Web Display
When viewing requests, the mobile interface shows:
- **Workspace Name**: Extracted from VS Code
- **Workspace Path**: Full filesystem path
- **Workspace ID**: Generated base64 ID for tracking

### Example Request with Workspace Info
```json
{
  "id": "req-456",
  "workspaceName": "KODEZON_TeleOps",
  "workspacePath": "/home/user/projects/KODEZON_TeleOps",
  "workspaceId": "S0V0RVpPTl9UZWxlT3A=",
  "question": "Should I commit these changes?",
  "timestamp": 1700000000000,
  "status": "pending"
}
```

## Step 6: Network Configuration

### For Local Development
```
VS Code -> localhost:8080 (backend)
Mobile Browser -> localhost:3000 (web interface)
```

### For Remote/Network Access

**Scenario: VS Code on Desktop, Mobile on Different Network**

1. Install backend on a network-accessible machine:
   ```bash
   # Backend accessible at: http://192.168.1.100:8080
   ```

2. Configure VS Code extension:
   ```json
   {
     "kodezon-remote-chat.dockerHost": "http://192.168.1.100:8080"
   }
   ```

3. Access mobile web from phone/tablet:
   ```
   http://192.168.1.100:3000
   ```

## Troubleshooting

### Extension Not Connecting to Backend
- Check Docker service is running: `docker ps`
- Verify backend URL in settings
- Check firewall/network connectivity
- View extension logs: `View > Output > KodeZon Remote Chat`

### No Notifications Appearing
- Verify polling is active (check status view in extension)
- Check Docker backend has pending requests
- Increase poll interval if network is slow

### Mobile Web Not Updating
- Check browser network tab for API calls
- Verify CORS is enabled on backend
- Clear browser cache and reload

### Requests Not Being Stored
- Check Docker backend logs: `docker logs <container-id>`
- Verify database/storage is writable
- Check for API errors in browser console

## Production Deployment

For production deployment, see [DOCKER_SERVICE.md](./DOCKER_SERVICE.md) for detailed backend setup and [MOBILE_WEB_INTERFACE.md](./MOBILE_WEB_INTERFACE.md) for web interface deployment.

## Support

For issues or questions:
1. Check the README.md
2. Review API documentation in DOCKER_SERVICE.md
3. Check mobile interface specs in MOBILE_WEB_INTERFACE.md
4. Debug using curl commands provided in this guide
