"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const sidebarProvider_1 = require("./sidebarProvider");
const previewPanel_1 = require("./previewPanel");
function activate(context) {
    // Register the sidebar webview provider
    const sidebarProvider = new sidebarProvider_1.SidebarProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(sidebarProvider_1.SidebarProvider.viewType, sidebarProvider));
    // Register the preview command (also appears as editor title button for .json files)
    context.subscriptions.push(vscode.commands.registerCommand('lr-course-editor.previewModule', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor. Open a course module JSON file first.');
            return;
        }
        if (!editor.document.fileName.endsWith('.json')) {
            vscode.window.showWarningMessage('Preview is only available for .json files.');
            return;
        }
        previewPanel_1.PreviewPanel.createOrShow(editor.document, context.extensionUri);
    }));
    // Register the open sidebar command
    context.subscriptions.push(vscode.commands.registerCommand('lr-course-editor.openSidebar', () => {
        vscode.commands.executeCommand('workbench.view.extension.lr-course-manager');
    }));
}
function deactivate() { }
//# sourceMappingURL=extension.js.map