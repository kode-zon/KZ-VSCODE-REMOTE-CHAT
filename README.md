# KodeZon Remote Chat - VS Code Extension

VS Code extension for receiving and approving AI chat requests directly from your mobile device.

## 🎯 How It Works

```
┌─────────────────────────────────────┐
│   VS Code Extension                 │
│   - Runs embedded web server        │
│   - Displays IP:port in sidebar     │
│   - Receives approval/rejection     │
└─────────────┬───────────────────────┘
              │
         HTTP │ IP:port
              │
┌─────────────▼───────────────────────┐
│   Mobile Browser (ANY device)       │
│   - View chat requests              │
│   - Approve/Reject from mobile      │
│   - Shows workspace context         │
└─────────────────────────────────────┘
```

## ✨ Features

- 🔔 **Embedded Web Server**: No Docker needed, extension serves the web UI
- 📱 **Mobile Access**: Connect any mobile device to `IP:port` shown in sidebar
- 🌐 **Multi-Network**: Shows all available network addresses
- 🔄 **Multi-Workspace**: Automatically tracks requests across workspaces
- ⚙️ **Configurable Port**: Change port in VS Code settings (default: 5000)
- 🎨 **Beautiful UI**: Modern mobile-first interface

## 🚀 Quick Start

### 1. Install Extension

```bash
cd shared-sibling/KODEZON-VSCODE-REMOTE-CHAT
npm install
npm run esbuild
```

### 2. Configure Port (Optional)

Open VS Code Settings (Ctrl+,) and search for `kodezon-remote-chat`:

```json
{
  "kodezon-remote-chat.serverPort": 5000
}
```

Default is port 5000. Change to any available port 1024-65535.

### 3. Check Sidebar

Look for **KodeZon Remote Chat** in the sidebar activity bar:
- ✅ Shows the server URL (e.g., `http://192.168.1.100:5000`)
- 📋 Shows all network addresses you can use
- 📱 "Open Browser" button to test locally

### 4. Connect Mobile Device

1. Copy the URL from the sidebar (or click "Copy" button)
2. Open your mobile browser
3. Paste the URL in address bar
4. You'll see the chat request interface

### 5. Send Test Notification

In VS Code Command Palette (Ctrl+Shift+P):
```
> KodeZon Remote Chat: Test Notification
```

You should see a test request appear in your mobile browser!

## 📱 Mobile Interface

When you open the URL on your mobile device, you'll see:

- **Request List**: All pending chat requests
- **Workspace Info**: Shows which VS Code workspace each request came from
- **Quick Actions**: One-tap Approve/Reject buttons
- **Auto-refresh**: Updates every 2 seconds automatically

## 🔧 Configuration

### Settings (`kodezon-remote-chat`)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `serverPort` | number | 5000 | Port for web server (1024-65535) |
| `autoNotify` | boolean | true | Show VS Code notifications |
| `pollInterval` | number | 2000 | Check interval (ms) |

## 📡 API Endpoints

The embedded web server provides these endpoints:

```
GET  /                             → Web UI
GET  /health                       → Health check
GET  /api/requests/pending         → List pending requests
GET  /api/requests/:id             → Get specific request
POST /api/requests/:id/respond     → Submit approval/rejection
GET  /api/requests/:id/status      → Get response status
```

## 💡 Usage Example

### Scenario: AI Assistant Needs Approval

1. **AI asks in VS Code**: "Should I commit these changes?"

2. **Extension creates request** internally

3. **Sidebar shows**: 
   ```
   📱 Mobile Web Server
   http://192.168.1.100:5000
   
   🌐 Network Addresses
   • http://localhost:5000
   • http://192.168.1.100:5000
   • http://10.0.0.50:5000
   ```

4. **You open mobile**: `http://192.168.1.100:5000`

5. **See request on mobile**:
   ```
   📂 my-project
   "Should I commit these changes?"
   [✓ Approve] [✗ Reject]
   ```

6. **Tap Approve** → Response sent back to VS Code

7. **AI continues** with the approval

## 🛠️ Commands

| Command | Description |
|---------|-------------|
| `kodezon-remote-chat.testNotification` | Send test request |
| `kodezon-remote-chat.openSettings` | Open extension settings |

## 🌐 Network Access

### Local Machine
- Mobile device on same network: Use IP address (e.g., `192.168.x.x`)
- Localhost on computer: Use `localhost:5000`

### Remote/Cloud
- For remote machine, configure port forwarding or use public IP
- Ensure firewall allows traffic on configured port

## 🔐 Security Notes

- ⚠️ No authentication by default (adds to request URL)
- 💡 For production, add API key/authentication
- 🔒 Use HTTPS if accessed over internet
- 🛡️ Consider firewall/VPN for private networks

## 🐛 Troubleshooting

### Port Already in Use
- Check what's using the port: `netstat -ano | findstr :5000` (Windows)
- Change port in settings and reload VS Code

### Can't Connect from Mobile
- Verify mobile is on same network as computer
- Check firewall allows traffic on the port
- Use IP address, not `localhost`
- Try pinging the computer from mobile to verify connectivity

### No Requests Showing
- Send test notification: `Ctrl+Shift+P` → "Test Notification"
- Check browser console for errors
- Verify extension is running (check sidebar)

### Server Won't Start
- Port might be in use - try different port
- Check VS Code output: `View > Output > KodeZon Remote Chat`
- Restart VS Code

## 📚 Integrating with AI Chat

To integrate with your AI assistant:

1. **Create a chat request**:
   ```typescript
   const request: ChatRequest = {
     id: 'req-' + Date.now(),
     workspaceName: vscode.workspace.name,
     workspacePath: vscode.workspace.workspaceFolders[0].uri.fsPath,
     workspaceId: generateId(),
     question: "Should I proceed?",
     timestamp: Date.now(),
     status: 'pending'
   };
   remoteChatService.addRequest(request);
   ```

2. **Wait for response**:
   ```typescript
   const response = await remoteChatService.waitForResponse(request.id, 60000);
   if (response?.approved) {
     // Proceed with action
   } else {
     // Cancel action
   }
   ```

## 🎓 Examples

### TypeScript Integration

```typescript
// Get the service from your extension context
const remoteChatService = getRemoteChatService();

// Create a request
const request: ChatRequest = {
  id: `refactor-${Date.now()}`,
  workspaceName: 'My Project',
  workspacePath: '/home/user/my-project',
  workspaceId: 'proj-123',
  question: 'Should I refactor this component?',
  timestamp: Date.now(),
  status: 'pending'
};

// Add to pending queue
remoteChatService.addRequest(request);

// Wait for user decision (60 second timeout)
const response = await remoteChatService.waitForResponse(request.id, 60000);

if (response?.approved) {
  console.log('✓ User approved');
  // Execute the refactoring
} else if (response) {
  console.log('✗ User rejected');
  // Skip the refactoring
} else {
  console.log('⏱️ Timeout - no response');
}
```

## 🔗 Related

- [Project Summary](./PROJECT_SUMMARY.md) - Full project overview
- [Mobile Web API](./MOBILE_WEB_INTERFACE.md) - Web interface details
- [Integration Guide](./INTEGRATION_GUIDE.md) - Advanced setup

## 📝 License

MIT

