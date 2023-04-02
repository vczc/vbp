import * as vscode from 'vscode';

import TargetTreeProvider from './targetTreeProvider';
import DebugProvider from './debugProvider';
import { BrowserViewWindowManager } from './BrowserViewWindowManager';
import { setupLiveShare } from './live-share';
import { Telemetry } from './telemetry';
import * as os from 'os';
const { spawn } = require('child_process');

export function activate(context: vscode.ExtensionContext) {
  var platform = os.platform();
  // 先杀掉已有的进程，再开启新进程
  if (platform === 'win32') {
    // spawn('cmd.exe', ['/c', '%USERPROFILE%\\.vscode\\extensions\\toolchain.tortie-preview-0.7.2\\proxy.exe']);
  } else if (platform === 'darwin') {
  } else {
    // spawn('bash', ['-c', 'nohup ~/.vscode/extensions/toolchain.tortie-preview-0.7.2/proxy &'], {detached:true});
  }

  const telemetry = new Telemetry();

  const windowManager = new BrowserViewWindowManager(context.extensionPath, telemetry);
  // const debugProvider = new DebugProvider(windowManager, telemetry);

  telemetry.sendEvent('activate');

  vscode.window.registerTreeDataProvider('targetTree', new TargetTreeProvider());
  // vscode.debug.registerDebugConfigurationProvider('browser-preview', debugProvider.getProvider());

  context.subscriptions.push(
    vscode.commands.registerCommand('browser-preview.openPreview', (url?) => {
      // Handle VS Code URIs
      if (url != null && url instanceof vscode.Uri && url.scheme === 'file') {
        url = url.toString();
      }

      telemetry.sendEvent('openPreview');
      windowManager.create(url);
    }),

    vscode.commands.registerCommand('browser-preview.openActiveFile', () => {
      const activeEditor = vscode.window.activeTextEditor;
      if (!activeEditor) {
        return; // no active editor: ignore the command
      }

      // get active url
      const filename = activeEditor.document.fileName;

      telemetry.sendEvent('openActiveFile');

      if (filename) {
        windowManager.create(`file://${filename}`);
      }
    })
  );

  setupLiveShare(context.extensionPath, windowManager);
}
