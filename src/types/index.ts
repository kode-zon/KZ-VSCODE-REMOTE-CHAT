export interface ChatRequest {
  id: string;
  workspaceName: string;
  workspacePath: string;
  workspaceId: string;
  question: string;
  timestamp: number;
  requesterName?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface NotificationPayload {
  requestId: string;
  workspaceName: string;
  workspacePath: string;
  workspaceId: string;
  question: string;
  timestamp: number;
  actionUrl: string;
}

export interface ApprovalResponse {
  requestId: string;
  approved: boolean;
  responseTime: number;
  responderNote?: string;
}

export interface RemoteChatConfig {
  dockerHost: string;
  mobileWebUrl: string;
  autoNotify: boolean;
  pollInterval: number;
}
