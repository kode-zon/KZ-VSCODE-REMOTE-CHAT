import * as vscode from 'vscode';
import { ChatRequest, ApprovalResponse } from '../types';

export class RemoteChatService {
  constructor(private context: vscode.ExtensionContext) {}

  // Store pending requests in memory
  private pendingRequests: Map<string, ChatRequest> = new Map();
  private responses: Map<string, ApprovalResponse> = new Map();

  /**
   * Add a chat request to the pending queue
   * This would normally come from the AI assistant in VS Code
   */
  addRequest(request: ChatRequest): void {
    this.pendingRequests.set(request.id, request);
  }

  /**
   * Get all pending requests
   */
  getPendingRequests(): ChatRequest[] {
    return Array.from(this.pendingRequests.values()).filter(
      (r) => r.status === 'pending'
    );
  }

  /**
   * Get a specific request
   */
  getRequest(requestId: string): ChatRequest | undefined {
    return this.pendingRequests.get(requestId);
  }

  /**
   * Check if a response has been received for a request
   */
  getResponse(requestId: string): ApprovalResponse | undefined {
    return this.responses.get(requestId);
  }

  /**
   * Store a response (called when user approves/rejects from mobile)
   */
  recordResponse(response: ApprovalResponse): void {
    this.responses.set(response.requestId, response);

    // Update request status
    const request = this.pendingRequests.get(response.requestId);
    if (request) {
      request.status = response.approved ? 'approved' : 'rejected';
    }
  }

  /**
   * Clear a request from the pending queue
   */
  clearRequest(requestId: string): void {
    this.pendingRequests.delete(requestId);
  }

  /**
   * Wait for a response with timeout
   */
  async waitForResponse(
    requestId: string,
    timeoutMs: number = 60000
  ): Promise<ApprovalResponse | null> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const response = this.responses.get(requestId);
      if (response) {
        return response;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return null;
  }
}

