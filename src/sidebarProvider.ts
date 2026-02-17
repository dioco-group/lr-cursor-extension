import * as vscode from 'vscode';
import { CourseListItem } from './types';

const MOCK_COURSES: { official: CourseListItem[]; community: CourseListItem[]; user: CourseListItem[] } = {
    official: [
        { id: 'lc_fsi_french_basic', title: 'FSI French Basic Course', language: 'French', moduleCount: 24, source: 'official', description: 'Comprehensive introductory French course' },
        { id: 'lc_fsi_spanish_basic', title: 'FSI Spanish Basic Course', language: 'Spanish', moduleCount: 20, source: 'official', description: 'Introductory Spanish from the FSI curriculum' },
        { id: 'lc_alc_english_1', title: 'ALC English Beginner', language: 'English', moduleCount: 15, source: 'official', description: 'Beginner English for Arabic speakers' },
    ],
    community: [
        { id: 'lc_comm_mandarin_travel', title: 'Mandarin for Travelers', language: 'Mandarin', moduleCount: 8, source: 'community', author: 'Chen Wei', description: 'Essential phrases for traveling in China' },
        { id: 'lc_comm_portuguese_music', title: 'Portuguese Through Music', language: 'Portuguese', moduleCount: 6, source: 'community', author: 'Ana Silva', description: 'Learn Brazilian Portuguese through popular songs' },
        { id: 'lc_comm_japanese_n5', title: 'JLPT N5 Prep', language: 'Japanese', moduleCount: 12, source: 'community', author: 'Tanaka Yuki', description: 'Preparation for JLPT N5 exam' },
    ],
    user: [
        { id: 'lc_user_italian_cooking', title: 'Italian Cooking Vocabulary', language: 'Italian', moduleCount: 3, source: 'user', description: 'Kitchen and recipe terms in Italian' },
    ],
};

export class SidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'lr-course-manager.sidebar';

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = this._getHtml(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'downloadAndEdit':
                    vscode.window.showInformationMessage(`Download & Edit: ${message.courseId} (Gitea integration coming soon)`);
                    break;
                case 'suggestEdit':
                    vscode.window.showInformationMessage(`Suggest Edit: ${message.courseId} (Gitea PR coming soon)`);
                    break;
                case 'openCourse':
                    vscode.window.showInformationMessage(`Open: ${message.courseId}`);
                    break;
                case 'uploadChanges':
                    vscode.window.showInformationMessage(`Upload Changes: ${message.courseId} (git push coming soon)`);
                    break;
                case 'createNew':
                    vscode.window.showInformationMessage('Create New Course (Gitea template coming soon)');
                    break;
                case 'forkCourse':
                    vscode.window.showInformationMessage(`Fork: ${message.courseId} (Gitea fork coming soon)`);
                    break;
                case 'previewCourse':
                    vscode.window.showInformationMessage(`Preview: ${message.courseId}`);
                    break;
            }
        });
    }

    private _getHtml(webview: vscode.Webview): string {
        return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            padding: 0;
        }

        .section {
            margin-bottom: 4px;
        }
        .section-header {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 12px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--vscode-sideBarSectionHeader-foreground);
            background: var(--vscode-sideBarSectionHeader-background);
            cursor: pointer;
            user-select: none;
        }
        .section-header:hover {
            background: var(--vscode-list-hoverBackground);
        }
        .section-header .chevron {
            font-size: 10px;
            transition: transform 0.15s;
        }
        .section-header .chevron.collapsed {
            transform: rotate(-90deg);
        }
        .section-header .count {
            margin-left: auto;
            opacity: 0.6;
            font-weight: 400;
        }
        .section-body {
            overflow: hidden;
        }
        .section-body.collapsed {
            display: none;
        }

        .course-item {
            padding: 6px 12px 6px 20px;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        .course-item:hover {
            background: var(--vscode-list-hoverBackground);
        }
        .course-name {
            font-size: 13px;
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .course-meta {
            font-size: 11px;
            opacity: 0.7;
            display: flex;
            gap: 8px;
        }
        .course-desc {
            font-size: 11px;
            opacity: 0.6;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .course-actions {
            display: none;
            gap: 4px;
            margin-top: 4px;
        }
        .course-item:hover .course-actions {
            display: flex;
        }
        .action-btn {
            font-size: 11px;
            padding: 2px 8px;
            border: 1px solid var(--vscode-button-secondaryBackground, #444);
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border-radius: 3px;
            cursor: pointer;
        }
        .action-btn:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }
        .action-btn.primary {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border-color: var(--vscode-button-background);
        }
        .action-btn.primary:hover {
            background: var(--vscode-button-hoverBackground);
        }

        .auth-section {
            padding: 12px;
            border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border, var(--vscode-panel-border));
            margin-bottom: 4px;
        }
        .auth-status {
            font-size: 11px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .auth-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--vscode-testing-iconPassed, #4caf50);
        }
        .auth-dot.disconnected {
            background: var(--vscode-testing-iconFailed, #f44336);
        }

        .empty-state {
            padding: 16px 20px;
            font-size: 12px;
            opacity: 0.6;
            text-align: center;
        }
        .create-btn {
            display: block;
            width: calc(100% - 40px);
            margin: 8px 20px;
            padding: 6px;
            font-size: 12px;
            text-align: center;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 3px;
            cursor: pointer;
        }
        .create-btn:hover {
            background: var(--vscode-button-hoverBackground);
        }
    </style>
</head>
<body>
    <div class="auth-section">
        <div class="auth-status">
            <span class="auth-dot disconnected"></span>
            <span>Not connected</span>
            <span style="margin-left: auto; opacity: 0.6; font-size: 10px;">Setup in settings</span>
        </div>
    </div>

    ${this._renderSection('Official Courses', 'official', MOCK_COURSES.official)}
    ${this._renderSection('My Courses', 'user', MOCK_COURSES.user, true)}
    ${this._renderSection('Community Courses', 'community', MOCK_COURSES.community)}

    <script>
        const vscode = acquireVsCodeApi();

        document.querySelectorAll('.section-header').forEach(header => {
            header.addEventListener('click', () => {
                const body = header.nextElementSibling;
                const chevron = header.querySelector('.chevron');
                body.classList.toggle('collapsed');
                chevron.classList.toggle('collapsed');
            });
        });

        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                vscode.postMessage({
                    command: btn.dataset.action,
                    courseId: btn.dataset.courseId
                });
            });
        });
    </script>
</body>
</html>`;
    }

    private _renderSection(title: string, type: string, courses: CourseListItem[], showCreate = false): string {
        const items = courses.map(c => this._renderCourseItem(c, type)).join('');
        const empty = courses.length === 0 ? '<div class="empty-state">No courses yet</div>' : '';
        const create = showCreate ? `<button class="create-btn" onclick="vscode.postMessage({command:'createNew'})">+ Create New Course</button>` : '';

        return /* html */ `
        <div class="section">
            <div class="section-header">
                <span class="chevron">▼</span>
                ${title}
                <span class="count">${courses.length}</span>
            </div>
            <div class="section-body">
                ${items}${empty}${create}
            </div>
        </div>`;
    }

    private _renderCourseItem(course: CourseListItem, type: string): string {
        let actions = '';
        if (type === 'official') {
            actions = `
                <button class="action-btn primary" data-action="downloadAndEdit" data-course-id="${course.id}">Download & Edit</button>
                <button class="action-btn" data-action="suggestEdit" data-course-id="${course.id}">Suggest Edit</button>`;
        } else if (type === 'user') {
            actions = `
                <button class="action-btn primary" data-action="openCourse" data-course-id="${course.id}">Open</button>
                <button class="action-btn" data-action="uploadChanges" data-course-id="${course.id}">Upload</button>`;
        } else if (type === 'community') {
            actions = `
                <button class="action-btn primary" data-action="forkCourse" data-course-id="${course.id}">Fork</button>
                <button class="action-btn" data-action="previewCourse" data-course-id="${course.id}">Preview</button>`;
        }

        const author = course.author ? `<span>by ${course.author}</span>` : '';

        return /* html */ `
        <div class="course-item">
            <div class="course-name">${course.title}</div>
            <div class="course-meta">
                <span>${course.language}</span>
                <span>${course.moduleCount} modules</span>
                ${author}
            </div>
            ${course.description ? `<div class="course-desc">${course.description}</div>` : ''}
            <div class="course-actions">${actions}</div>
        </div>`;
    }
}
