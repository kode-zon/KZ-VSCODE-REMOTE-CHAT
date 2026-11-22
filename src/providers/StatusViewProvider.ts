import * as vscode from 'vscode';
import { RemoteChatService } from '../services/RemoteChatService';
import { WebServerService } from '../services/WebServerService';
import { NetworkInfoService } from '../services/NetworkInfoService';

export class StatusViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'kodezon-remote-chat-status';

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly remoteChatService: RemoteChatService,
    private readonly webServerService: WebServerService,
    private readonly port: number
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };

    webviewView.webview.html = this.getHtmlContent();

    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage((data) => {
      switch (data.command) {
        case 'getStatus':
          this.sendStatus(webviewView);
          break;
        case 'openMobileWeb':
          const urls = NetworkInfoService.getNetworkInfos(this.port);
          if (urls.length > 0) {
            vscode.env.openExternal(vscode.Uri.parse(urls[0].url));
          }
          break;
        case 'openSettings':
          vscode.commands.executeCommand(
            'workbench.action.openSettings',
            'kodezon-remote-chat'
          );
          break;
        case 'copyUrl':
          const networkInfo = NetworkInfoService.getNetworkInfo(this.port);
          vscode.env.clipboard.writeText(networkInfo.url);
          vscode.window.showInformationMessage(`📋 Copied: ${networkInfo.url}`);
          break;
      }
    });

    this.sendStatus(webviewView);
  }

  private sendStatus(webviewView: vscode.WebviewView) {
    const networkInfo = NetworkInfoService.getNetworkInfo(this.port);
    const allNetworks = NetworkInfoService.getNetworkInfos(this.port);

    webviewView.webview.postMessage({
      command: 'updateStatus',
      data: {
        serverUrl: networkInfo.url,
        serverIp: networkInfo.ipAddress,
        serverPort: this.port,
        hostname: networkInfo.hostname,
        allUrls: allNetworks.map((n) => n.url),
        workspaceName: vscode.workspace.name,
        workspacePath: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
      },
    });
  }

  private getHtmlContent(): string {
    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>KodeZon Remote Chat</title>
        <style>
          body {
            font-family: var(--vscode-font-family);
            padding: 16px;
            margin: 0;
            color: var(--vscode-foreground);
            background-color: var(--vscode-sideBar-background);
            font-size: 13px;
          }
          .container {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .status-section {
            padding: 12px;
            background-color: var(--vscode-sideBar-background);
            border: 1px solid var(--vscode-sideBarSectionHeader-border);
            border-radius: 4px;
          }
          .status-label {
            font-weight: bold;
            font-size: 11px;
            color: var(--vscode-sideBarSectionHeader-foreground);
            text-transform: uppercase;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
          }
          .status-value {
            font-size: 14px;
            margin-top: 4px;
            word-break: break-all;
            font-family: monospace;
            background-color: var(--vscode-input-background);
            padding: 8px;
            border-radius: 3px;
            border: 1px solid var(--vscode-input-border);
          }
          .url-box {
            background-color: var(--vscode-input-background);
            border: 2px solid #667eea;
            border-radius: 4px;
            padding: 10px;
            margin-top: 6px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .url-box-text {
            font-family: monospace;
            font-size: 13px;
            font-weight: bold;
            color: #667eea;
            flex: 1;
            word-break: break-all;
          }
          .url-box-copy {
            padding: 4px 8px;
            font-size: 11px;
            cursor: pointer;
            background-color: #667eea;
            color: white;
            border: none;
            border-radius: 2px;
            white-space: nowrap;
          }
          .url-box-copy:hover {
            background-color: #764ba2;
          }
          .button-group {
            display: flex;
            gap: 6px;
            margin-top: 10px;
            flex-wrap: wrap;
          }
          button {
            flex: 1;
            min-width: 100px;
            padding: 6px 10px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 2px;
            cursor: pointer;
            font-size: 11px;
            font-weight: bold;
          }
          button:hover {
            background-color: var(--vscode-button-hoverBackground);
          }
          .info-icon {
            font-size: 11px;
            color: #999;
            margin-top: 8px;
            line-height: 1.4;
          }
          .success {
            color: #4EC9B0;
          }
          .error {
            color: #F48771;
          }
          .primary {
            color: #667eea;
            font-weight: bold;
          }
          .workspace-info {
            font-size: 12px;
            color: #999;
            padding: 8px;
            background-color: rgba(0,0,0,0.1);
            border-radius: 3px;
            margin-top: 6px;
          }
          .ip-list {
            font-size: 11px;
            color: #666;
            margin-top: 8px;
            line-height: 1.6;
          }
          .ip-item {
            padding: 4px;
            background-color: rgba(0,0,0,0.05);
            border-radius: 2px;
            margin: 2px 0;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="status-section">
            <div class="status-label">📱 Mobile Web Server</div>
            <div class="url-box">
              <div class="url-box-text" id="serverUrl">Loading...</div>
              <button class="url-box-copy" onclick="copyUrl()">Copy</button>
            </div>
            <div class="info-icon">
              📌 Connect your mobile device to this URL
            </div>
          </div>

          <div class="status-section">
            <div class="status-label">🌐 Network Addresses</div>
            <div class="ip-list" id="ipList">Loading...</div>
          </div>

          <div class="status-section">
            <div class="status-label">📂 Current Workspace</div>
            <div class="workspace-info" id="workspace">No workspace</div>
          </div>

          <div class="status-section">
            <div class="status-label">⚙️ Configuration</div>
            <div class="status-value">
              <div>Server Port: <span id="serverPort">-</span></div>
              <div>Status: <span class="success">✓ Running</span></div>
            </div>
          </div>

          <div class="button-group">
            <button onclick="openMobileWeb()">📱 Open Browser</button>
            <button onclick="openSettings()">⚙️ Settings</button>
          </div>

          <div class="info-icon">
            💡 Tip: Share the URL above with your mobile device to approve/reject requests
          </div>
        </div>

        <script>
          const vscode = acquireVsCodeApi();

          function openMobileWeb() {
            vscode.postMessage({ command: 'openMobileWeb' });
          }

          function openSettings() {
            vscode.postMessage({ command: 'openSettings' });
          }

          function copyUrl() {
            vscode.postMessage({ command: 'copyUrl' });
          }

          window.addEventListener('message', (event) => {
            const message = event.data;
            if (message.command === 'updateStatus') {
              const data = message.data;
              document.getElementById('serverUrl').textContent = data.serverUrl || 'Not configured';
              document.getElementById('serverPort').textContent = data.serverPort || '-';
              
              const workspace = data.workspaceName || 'No workspace';
              const path = data.workspacePath ? \` (\${data.workspacePath})\` : '';
              document.getElementById('workspace').textContent = workspace + path;

              // List all network URLs
              const ipListHtml = (data.allUrls || [])
                .map(url => \`<div class="ip-item">🔗 \${url}</div>\`)
                .join('');
              document.getElementById('ipList').innerHTML = ipListHtml || 'Loading...';
            }
          });

          vscode.postMessage({ command: 'getStatus' });
        </script>
      </body>
      </html>`;
  }
}
