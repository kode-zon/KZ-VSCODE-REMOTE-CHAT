import * as vscode from 'vscode';
import { RemoteChatService } from './RemoteChatService';
import { WebServerService } from './WebServerService';
import { ChatRequest } from '../types';

export class NotificationManager {
  private remoteChatService: RemoteChatService;
  private webServerService: WebServerService;
  private context: vscode.ExtensionContext;
  private processingRequests: Set<string> = new Set();

  constructor(
    context: vscode.ExtensionContext,
    remoteChatService: RemoteChatService,
    webServerService: WebServerService
  ) {
    this.context = context;
    this.remoteChatService = remoteChatService;
    this.webServerService = webServerService;

    // Listen for approvals from web server
    this.webServerService.onApproval((response) => {
      this.handleApprovalResponse(response);
    });
  }

  private handleApprovalResponse(response: any) {
    console.log(
      `✓ Response received for request ${response.requestId}: ${response.approved ? 'APPROVED' : 'REJECTED'}`
    );

    // Store response in service
    this.remoteChatService.recordResponse({
      requestId: response.requestId,
      approved: response.approved,
      responseTime: response.responseTime || 0,
      responderNote: response.note || '',
    });

    // Show notification
    const action = response.approved ? '✓ Approved' : '✗ Rejected';
    vscode.window.showInformationMessage(
      `${action}: Request ${response.requestId}`
    );
  }

  async sendTestNotification() {
    const workspaceName = vscode.workspace.name || 'Unknown Workspace';
    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
    const workspaceId = this.generateWorkspaceId(workspacePath);

    const testRequest: ChatRequest = {
      id: `test-${Date.now()}`,
      workspaceName,
      workspacePath,
      workspaceId,
      question: '🧪 This is a test notification from VS Code extension. Please approve or reject!',
      timestamp: Date.now(),
      requesterName: 'Test User',
      status: 'pending',
    };

    this.remoteChatService.addRequest(testRequest);
    this.webServerService.addRequest(testRequest);

    vscode.window.showInformationMessage(
      'Test notification sent! Check your mobile browser.'
    );
  }

  private generateWorkspaceId(path: string): string {
    return Buffer.from(path).toString('base64').substring(0, 16);
  }
}
