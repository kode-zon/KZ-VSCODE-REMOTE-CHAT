import * as express from 'express';
import { Server } from 'http';
import { ChatRequest, ApprovalResponse } from '../types';

export interface WebServerConfig {
  port: number;
  hostname?: string;
}

export class WebServerService {
  private app: express.Application;
  private server: Server | null = null;
  private config: WebServerConfig;
  private pendingRequests: Map<string, ChatRequest> = new Map();
  private responses: Map<string, ApprovalResponse> = new Map();
  private onApprovalCallback?: (response: ApprovalResponse) => void;

  constructor(config: WebServerConfig) {
    this.config = {
      hostname: 'localhost',
      ...config,
    };
    this.app = express();
    this.setupRoutes();
  }

  private setupRoutes() {
    this.app.use(express.json());
    this.app.use(express.static('public'));

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: Date.now() });
    });

    // Get pending requests
    this.app.get('/api/requests/pending', (req, res) => {
      const pending = Array.from(this.pendingRequests.values()).filter(
        (r) => r.status === 'pending'
      );
      res.json(pending);
    });

    // Get specific request
    this.app.get('/api/requests/:id', (req, res) => {
      const request = this.pendingRequests.get(req.params.id);
      if (request) {
        res.json(request);
      } else {
        res.status(404).json({ error: 'Request not found' });
      }
    });

    // Submit approval/rejection
    this.app.post('/api/requests/:id/respond', (req, res) => {
      const { approved, note } = req.body;
      const requestId = req.params.id;

      const response: ApprovalResponse = {
        requestId,
        approved,
        responseTime: Date.now() - (this.pendingRequests.get(requestId)?.timestamp || Date.now()),
        responderNote: note,
      };

      this.responses.set(requestId, response);

      // Update request status
      const request = this.pendingRequests.get(requestId);
      if (request) {
        request.status = approved ? 'approved' : 'rejected';
      }

      // Trigger callback
      if (this.onApprovalCallback) {
        this.onApprovalCallback(response);
      }

      res.json({ status: 'recorded', response });
    });

    // Get response status
    this.app.get('/api/requests/:id/status', (req, res) => {
      const response = this.responses.get(req.params.id);
      if (response) {
        res.json(response);
      } else {
        res.status(404).json({ error: 'Response not found' });
      }
    });

    // Serve web UI
    this.app.get('/', (req, res) => {
      res.send(this.getWebUIHtml());
    });

    this.app.get('/ui.css', (req, res) => {
      res.type('text/css').send(this.getWebUICss());
    });

    this.app.get('/ui.js', (req, res) => {
      res.type('application/javascript').send(this.getWebUIJs());
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.config.port, this.config.hostname, () => {
          console.log(
            `Web server started on http://${this.config.hostname}:${this.config.port}`
          );
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err) => {
          if (err) reject(err);
          else {
            this.server = null;
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  addRequest(request: ChatRequest): void {
    this.pendingRequests.set(request.id, request);
  }

  removeRequest(requestId: string): void {
    this.pendingRequests.delete(requestId);
  }

  getRequest(requestId: string): ChatRequest | undefined {
    return this.pendingRequests.get(requestId);
  }

  getResponse(requestId: string): ApprovalResponse | undefined {
    return this.responses.get(requestId);
  }

  getServerUrl(hostname?: string): string {
    const host = hostname || this.config.hostname || 'localhost';
    return `http://${host}:${this.config.port}`;
  }

  onApproval(callback: (response: ApprovalResponse) => void): void {
    this.onApprovalCallback = callback;
  }

  private getWebUIHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KodeZon Remote Chat</title>
  <link rel="stylesheet" href="/ui.css">
</head>
<body>
  <div class="container">
    <header class="header">
      <h1>🤖 KodeZon Remote Chat</h1>
      <p class="subtitle">Approve or reject chat requests</p>
    </header>

    <main class="content">
      <div id="requests-list" class="requests-list">
        <div class="loading">Loading requests...</div>
      </div>
    </main>

    <footer class="footer">
      <p>Connected • Auto-refresh every 2 seconds</p>
    </footer>
  </div>

  <div id="detail-modal" class="modal" style="display: none;">
    <div class="modal-content">
      <button class="close-btn" onclick="closeDetail()">&times;</button>
      <div id="detail-body"></div>
    </div>
  </div>

  <script src="/ui.js"></script>
</body>
</html>`;
  }

  private getWebUICss(): string {
    return `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.container {
  width: 100%;
  max-width: 600px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 60vh;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px 20px;
  text-align: center;
}

.header h1 {
  font-size: 28px;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  opacity: 0.9;
}

.content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.requests-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.request-card {
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #f9f9f9;
  cursor: pointer;
  transition: all 0.2s;
}

.request-card:hover {
  border-color: #667eea;
  background: #f0f0ff;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.request-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 8px;
}

.request-workspace {
  font-weight: 600;
  color: #667eea;
  font-size: 14px;
}

.request-time {
  font-size: 12px;
  color: #999;
}

.request-question {
  color: #333;
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 12px;
}

.request-actions {
  display: flex;
  gap: 8px;
}

button {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-approve {
  background: #4caf50;
  color: white;
}

.btn-approve:hover {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
}

.btn-reject {
  background: #f44336;
  color: white;
}

.btn-reject:hover {
  background: #da190b;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(244, 67, 54, 0.3);
}

.loading {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.empty {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.footer {
  background: #f5f5f5;
  padding: 16px 20px;
  text-align: center;
  font-size: 12px;
  color: #999;
  border-top: 1px solid #e0e0e0;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  padding: 0;
  background: #f0f0f0;
  color: #333;
  font-size: 24px;
  border-radius: 50%;
}

.close-btn:hover {
  background: #e0e0e0;
}

.detail-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}

.detail-field {
  margin-bottom: 16px;
}

.detail-label {
  font-size: 12px;
  font-weight: 600;
  color: #667eea;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.detail-value {
  font-size: 14px;
  color: #333;
  padding: 8px;
  background: #f9f9f9;
  border-radius: 4px;
  word-break: break-word;
}

.detail-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.detail-actions button {
  flex: 1;
  padding: 12px;
  font-size: 14px;
}

.success-message {
  background: #4caf50;
  color: white;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 12px;
  text-align: center;
  font-size: 14px;
}

@media (max-width: 600px) {
  .header h1 {
    font-size: 22px;
  }

  .request-card {
    padding: 12px;
  }

  .modal-content {
    padding: 20px;
  }
}
`;
  }

  private getWebUIJs(): string {
    return `
let currentRequests = [];

async function loadRequests() {
  try {
    const response = await fetch('/api/requests/pending');
    currentRequests = await response.json();
    renderRequests();
  } catch (error) {
    console.error('Error loading requests:', error);
  }
}

function renderRequests() {
  const container = document.getElementById('requests-list');
  
  if (currentRequests.length === 0) {
    container.innerHTML = '<div class="empty"><div class="empty-icon">✓</div><p>No pending requests</p></div>';
    return;
  }

  container.innerHTML = currentRequests.map(req => \`
    <div class="request-card">
      <div class="request-header">
        <div class="request-workspace">📂 \${req.workspaceName}</div>
        <div class="request-time">\${formatTime(req.timestamp)}</div>
      </div>
      <div class="request-question">\${escapeHtml(req.question)}</div>
      <div class="request-actions">
        <button class="btn-approve" onclick="approveRequest('\${req.id}')">✓ Approve</button>
        <button class="btn-reject" onclick="rejectRequest('\${req.id}')">✗ Reject</button>
      </div>
    </div>
  \`).join('');
}

async function approveRequest(requestId) {
  if (confirm('Approve this request?')) {
    await submitResponse(requestId, true);
  }
}

async function rejectRequest(requestId) {
  const note = prompt('Reject reason (optional):', '');
  if (note !== null) {
    await submitResponse(requestId, false, note);
  }
}

async function submitResponse(requestId, approved, note = '') {
  try {
    const response = await fetch(\`/api/requests/\${requestId}/respond\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved, note })
    });

    if (response.ok) {
      alert(approved ? '✓ Approved!' : '✗ Rejected!');
      await loadRequests();
    }
  } catch (error) {
    console.error('Error submitting response:', error);
    alert('Error submitting response');
  }
}

function formatTime(timestamp) {
  const now = Date.now();
  const diff = Math.floor((now - timestamp) / 1000);
  
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  
  const date = new Date(timestamp);
  return date.toLocaleDateString();
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function closeDetail() {
  document.getElementById('detail-modal').style.display = 'none';
}

// Load on start and refresh every 2 seconds
loadRequests();
setInterval(loadRequests, 2000);
`;
  }
}
