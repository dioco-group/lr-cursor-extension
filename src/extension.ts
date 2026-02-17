import * as vscode from 'vscode';
import { SidebarProvider } from './sidebarProvider';
import { PreviewPanel } from './previewPanel';

export function activate(context: vscode.ExtensionContext) {
    // Register the sidebar webview provider
    const sidebarProvider = new SidebarProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            SidebarProvider.viewType,
            sidebarProvider
        )
    );

    // Register the preview command (also appears as editor title button for .json files)
    context.subscriptions.push(
        vscode.commands.registerCommand('lr-course-editor.previewModule', () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('No active editor. Open a course module JSON file first.');
                return;
            }

            if (!editor.document.fileName.endsWith('.json')) {
                vscode.window.showWarningMessage('Preview is only available for .json files.');
                return;
            }

            PreviewPanel.createOrShow(editor.document, context.extensionUri);
        })
    );

    // Register the open sidebar command
    context.subscriptions.push(
        vscode.commands.registerCommand('lr-course-editor.openSidebar', () => {
            vscode.commands.executeCommand('workbench.view.extension.lr-course-manager');
        })
    );
}

export function deactivate() {}
