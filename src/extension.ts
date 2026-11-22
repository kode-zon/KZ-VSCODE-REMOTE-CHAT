import * as vscode from 'vscode';
import { RemoteChatService } from './services/RemoteChatService';
import { WebServerService } from './services/WebServerService';
import { StatusViewProvider } from './providers/StatusViewProvider';
import { NotificationManager } from './services/NotificationManager';

let remoteChatService: RemoteChatService;
let webServerService: WebServerService;
let notificationManager: NotificationManager;

export async function activate(context: vscode.ExtensionContext) {
  console.log('🚀 KodeZon Remote Chat extension activating...');

  // Initialize services
  const config = vscode.workspace.getConfiguration('kodezon-remote-chat');
  const serverPort = config.get('serverPort') as number || 5000;

  remoteChatService = new RemoteChatService(context);
  webServerService = new WebServerService({ port: serverPort });
  notificationManager = new NotificationManager(
    context,
    remoteChatService,
    webServerService
  );

  // Start web server
  try {
    await webServerService.start();
    console.log(`✓ Web server started on port ${serverPort}`);
    vscode.window.showInformationMessage(
      `✓ KodeZon Remote Chat active on port ${serverPort}`
    );
  } catch (error) {
    console.error('Failed to start web server:', error);
    vscode.window.showErrorMessage(
      `Failed to start web server: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Register status view provider
  const statusViewProvider = new StatusViewProvider(
    context,
    remoteChatService,
    webServerService,
    serverPort
  );
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'kodezon-remote-chat-status',
      statusViewProvider
    )
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'kodezon-remote-chat.openNotificationPanel',
      () => {
        vscode.window.showInformationMessage('Opening notification panel...');
      }
    ),
    vscode.commands.registerCommand(
      'kodezon-remote-chat.openSettings',
      () => {
        vscode.commands.executeCommand(
          'workbench.action.openSettings',
          'kodezon-remote-chat'
        );
      }
    ),
    vscode.commands.registerCommand(
      'kodezon-remote-chat.testNotification',
      async () => {
        await notificationManager.sendTestNotification();
      }
    )
  );

  // Watch for config changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async (e) => {
      if (e.affectsConfiguration('kodezon-remote-chat.serverPort')) {
        const newPort = vscode.workspace
          .getConfiguration('kodezon-remote-chat')
          .get('serverPort') as number;

        if (newPort !== serverPort) {
          vscode.window.showInformationMessage(
            'Port configuration changed. Please reload VS Code.'
          );
        }
      }
    })
  );
}

export async function deactivate() {
  console.log('🛑 KodeZon Remote Chat extension deactivating...');
  if (webServerService) {
    try {
      await webServerService.stop();
      console.log('✓ Web server stopped');
    } catch (error) {
      console.error('Error stopping web server:', error);
    }
  }
}
