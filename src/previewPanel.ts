import * as vscode from 'vscode';
import { Module, DialogueActivity, GrammarActivity, ExerciseActivity, ChatActivity, Activity } from './types';

export class PreviewPanel {
    public static readonly viewType = 'lr-course-editor.preview';
    private static _panels: Map<string, PreviewPanel> = new Map();

    private readonly _panel: vscode.WebviewPanel;
    private readonly _document: vscode.TextDocument;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(document: vscode.TextDocument, extensionUri: vscode.Uri) {
        const key = document.uri.toString();
        const existing = PreviewPanel._panels.get(key);
        if (existing) {
            existing._panel.reveal(vscode.ViewColumn.Beside);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            PreviewPanel.viewType,
            `Preview: ${getFileName(document.uri)}`,
            { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
            { enableScripts: true, localResourceRoots: [extensionUri] }
        );

        const preview = new PreviewPanel(panel, document, extensionUri);
        PreviewPanel._panels.set(key, preview);
    }

    private constructor(
        panel: vscode.WebviewPanel,
        document: vscode.TextDocument,
        private readonly _extensionUri: vscode.Uri
    ) {
        this._panel = panel;
        this._document = document;

        this._update();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Re-render on document change
        const changeDisposable = vscode.workspace.onDidChangeTextDocument((e) => {
            if (e.document.uri.toString() === this._document.uri.toString()) {
                this._update();
            }
        });
        this._disposables.push(changeDisposable);
    }

    public dispose() {
        const key = this._document.uri.toString();
        PreviewPanel._panels.delete(key);
        this._panel.dispose();
        while (this._disposables.length) {
            const d = this._disposables.pop();
            if (d) { d.dispose(); }
        }
    }

    private _update() {
        const text = this._document.getText();
        let module: Module | null = null;
        let error: string | null = null;

        try {
            const parsed = JSON.parse(text);
            if (parsed.diocoDocId && parsed.lessons) {
                module = parsed as Module;
            } else {
                error = 'This JSON file does not appear to be a course module (missing diocoDocId or lessons).';
            }
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            error = `JSON parse error: ${msg}`;
        }

        this._panel.webview.html = this._getHtml(module, error);
    }

    private _getHtml(module: Module | null, error: string | null): string {
        const body = error
            ? `<div class="error">${escapeHtml(error)}</div>`
            : module
                ? renderModule(module)
                : '<div class="error">No content</div>';

        return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: var(--vscode-font-family);
            font-size: 13px;
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
            padding: 16px 20px;
            line-height: 1.5;
        }

        .error {
            color: var(--vscode-errorForeground);
            background: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            padding: 12px;
            border-radius: 4px;
            margin: 12px 0;
        }

        /* Module header */
        .module-header {
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 2px solid var(--vscode-panel-border);
        }
        .module-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 4px;
        }
        .module-meta {
            font-size: 11px;
            opacity: 0.7;
            display: flex;
            gap: 12px;
        }
        .module-desc {
            margin-top: 6px;
            font-size: 12px;
            opacity: 0.8;
        }
        .module-id {
            font-family: var(--vscode-editor-font-family);
            font-size: 11px;
            opacity: 0.5;
        }

        /* Lesson */
        .lesson {
            margin-bottom: 24px;
        }
        .lesson-header {
            font-size: 15px;
            font-weight: 600;
            margin-bottom: 12px;
            padding: 6px 0;
            border-bottom: 1px solid var(--vscode-panel-border);
            display: flex;
            align-items: baseline;
            gap: 8px;
        }
        .lesson-id {
            font-family: var(--vscode-editor-font-family);
            font-size: 10px;
            opacity: 0.4;
            font-weight: 400;
        }

        /* Activity shared */
        .activity {
            margin-bottom: 16px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            overflow: hidden;
        }
        .activity-header {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 10px;
            font-size: 12px;
            font-weight: 600;
            background: var(--vscode-sideBarSectionHeader-background);
        }
        .activity-type {
            font-size: 10px;
            font-weight: 600;
            padding: 1px 5px;
            border-radius: 3px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        .type-dialogue { background: #2563eb22; color: #60a5fa; border: 1px solid #2563eb44; }
        .type-grammar { background: #7c3aed22; color: #a78bfa; border: 1px solid #7c3aed44; }
        .type-exercise { background: #05966922; color: #34d399; border: 1px solid #05966944; }
        .type-chat { background: #d9770622; color: #fbbf24; border: 1px solid #d9770644; }
        .activity-title {
            flex: 1;
        }
        .activity-id {
            font-family: var(--vscode-editor-font-family);
            font-size: 10px;
            opacity: 0.4;
            font-weight: 400;
        }
        .activity-body {
            padding: 10px;
        }
        .activity-instruction {
            font-size: 12px;
            opacity: 0.7;
            font-style: italic;
            margin-bottom: 8px;
        }

        /* Dialogue */
        .dialogue-line {
            display: grid;
            grid-template-columns: 90px 1fr 1fr;
            gap: 8px;
            padding: 5px 0;
            border-bottom: 1px solid var(--vscode-panel-border);
            font-size: 12px;
            align-items: start;
        }
        .dialogue-line:last-child { border-bottom: none; }
        .dl-speaker {
            font-weight: 600;
            font-size: 11px;
            color: #60a5fa;
            padding-top: 1px;
        }
        .dl-text {
            font-weight: 500;
        }
        .dl-translation {
            opacity: 0.65;
            font-style: italic;
        }
        .dl-notes {
            grid-column: 2 / 4;
            font-size: 11px;
            opacity: 0.55;
            padding: 2px 0 0 0;
        }
        .dl-vocab {
            grid-column: 2 / 4;
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            padding: 2px 0;
        }
        .vocab-tag {
            font-size: 10px;
            padding: 1px 6px;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            border-radius: 3px;
        }

        /* Grammar */
        .grammar-content {
            font-size: 12px;
            line-height: 1.6;
        }
        .grammar-content h2 { font-size: 14px; margin: 12px 0 6px; }
        .grammar-content h3 { font-size: 13px; margin: 10px 0 4px; }
        .grammar-content p { margin: 4px 0; }
        .grammar-content ul, .grammar-content ol { padding-left: 20px; margin: 4px 0; }
        .grammar-content table {
            border-collapse: collapse;
            margin: 6px 0;
            font-size: 12px;
        }
        .grammar-content th, .grammar-content td {
            padding: 3px 10px;
            border: 1px solid var(--vscode-panel-border);
            text-align: left;
        }
        .grammar-content th {
            background: var(--vscode-sideBarSectionHeader-background);
            font-weight: 600;
        }
        .grammar-content code {
            font-family: var(--vscode-editor-font-family);
            background: var(--vscode-textCodeBlock-background);
            padding: 1px 4px;
            border-radius: 2px;
        }
        .grammar-content strong { color: #60a5fa; }
        .grammar-content em { opacity: 0.8; }

        /* Exercise */
        .exercise-table {
            width: 100%;
            font-size: 12px;
        }
        .exercise-row {
            display: grid;
            grid-template-columns: 20px 1fr 1fr;
            gap: 8px;
            padding: 5px 0;
            border-bottom: 1px solid var(--vscode-panel-border);
            align-items: start;
        }
        .exercise-row:last-child { border-bottom: none; }
        .ex-num {
            font-size: 11px;
            opacity: 0.5;
            text-align: right;
        }
        .ex-prompt { }
        .ex-response { font-weight: 500; }
        .ex-translation {
            font-size: 11px;
            opacity: 0.55;
            font-style: italic;
        }
        .ex-example {
            opacity: 0.7;
        }
        .ex-example-badge {
            font-size: 9px;
            padding: 0px 4px;
            background: #059669;
            color: #fff;
            border-radius: 2px;
            margin-left: 4px;
        }

        /* Chat */
        .chat-scenario {
            font-size: 12px;
            padding: 8px;
            background: var(--vscode-textBlockQuote-background);
            border-left: 3px solid #fbbf24;
            border-radius: 2px;
            margin-bottom: 8px;
        }
        .chat-prompt-label {
            font-size: 11px;
            font-weight: 600;
            opacity: 0.7;
            margin-bottom: 2px;
        }
        .chat-prompt {
            font-size: 12px;
            font-style: italic;
        }

        /* Voice config */
        .voice-config {
            margin-bottom: 16px;
            padding: 8px 10px;
            background: var(--vscode-textBlockQuote-background);
            border-radius: 4px;
            font-size: 11px;
        }
        .voice-config-title {
            font-weight: 600;
            font-size: 11px;
            margin-bottom: 4px;
            opacity: 0.7;
        }
        .voice-entry {
            display: flex;
            gap: 8px;
        }
        .voice-label {
            min-width: 70px;
            opacity: 0.6;
        }
        .voice-value {
            font-family: var(--vscode-editor-font-family);
            font-size: 11px;
        }
    </style>
</head>
<body>
    ${body}
    <script>
        // Simple markdown-to-HTML for grammar content
        document.querySelectorAll('.grammar-raw').forEach(el => {
            let md = el.textContent || '';
            // Headers
            md = md.replace(/^### (.+)$/gm, '<h3>$1</h3>');
            md = md.replace(/^## (.+)$/gm, '<h2>$1</h2>');
            // Bold and italic
            md = md.replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>');
            md = md.replace(/\\*(.+?)\\*/g, '<em>$1</em>');
            // Tables
            md = md.replace(/^\\|(.+)\\|$/gm, (match) => {
                const cells = match.split('|').filter(c => c.trim()).map(c => c.trim());
                return '<tr>' + cells.map(c => '<td>' + c + '</td>').join('') + '</tr>';
            });
            md = md.replace(/(<tr>.*<\\/tr>\\n?)+/g, (match) => {
                const rows = match.trim().split('\\n').filter(r => !r.match(/^\\|[-|]+\\|$/));
                if (rows.length === 0) return match;
                let first = rows[0].replace(/<td>/g, '<th>').replace(/<\\/td>/g, '</th>');
                return '<table>' + first + rows.slice(1).join('') + '</table>';
            });
            // Lists
            md = md.replace(/^- (.+)$/gm, '<li>$1</li>');
            md = md.replace(/(<li>.*<\\/li>\\n?)+/g, (match) => '<ul>' + match + '</ul>');
            // Paragraphs (lines not already wrapped)
            md = md.replace(/^(?!<[hultro])(.+)$/gm, '<p>$1</p>');
            // Inline code
            md = md.replace(/\`([^\`]+)\`/g, '<code>$1</code>');
            // Line breaks
            md = md.replace(/\\n/g, '');

            const wrapper = document.createElement('div');
            wrapper.className = 'grammar-content';
            wrapper.innerHTML = md;
            el.replaceWith(wrapper);
        });
    </script>
</body>
</html>`;
    }
}

// -- Render functions --------------------------------------------------------

function renderModule(m: Module): string {
    const voiceHtml = renderVoiceConfig(m);
    const lessonsHtml = m.lessons.map(l => renderLesson(l)).join('');

    return /* html */ `
    <div class="module-header">
        <div class="module-title">${escapeHtml(m.title)}</div>
        <div class="module-id">${escapeHtml(m.diocoDocId)}</div>
        <div class="module-meta">
            <span>Target: ${escapeHtml(m.targetLang_G)}</span>
            <span>Home: ${escapeHtml(m.homeLang_G)}</span>
            <span>${m.lessons.length} lessons</span>
            <span>${m.lessons.reduce((n, l) => n + l.activities.length, 0)} activities</span>
        </div>
        ${m.description ? `<div class="module-desc">${escapeHtml(m.description)}</div>` : ''}
    </div>
    ${voiceHtml}
    ${lessonsHtml}`;
}

function renderVoiceConfig(m: Module): string {
    const vc = m.voiceConfig;
    if (!vc) { return ''; }

    const entries: string[] = [];
    if (vc.default) { entries.push(renderVoiceEntry('Default', vc.default)); }
    if (vc.prompt) { entries.push(renderVoiceEntry('Prompt', vc.prompt)); }
    if (vc.response) { entries.push(renderVoiceEntry('Response', vc.response)); }
    if (vc.introVoice) { entries.push(renderVoiceEntry('Intro', vc.introVoice)); }
    for (const [name, spec] of Object.entries(vc.speakers)) {
        entries.push(renderVoiceEntry(name, spec));
    }

    if (entries.length === 0) { return ''; }

    return /* html */ `
    <div class="voice-config">
        <div class="voice-config-title">Voice Configuration</div>
        ${entries.join('')}
    </div>`;
}

function renderVoiceEntry(label: string, spec: string | { voice: string; prompt: string | null } | null): string {
    if (!spec) { return ''; }
    const val = typeof spec === 'string' ? spec : spec.voice;
    return `<div class="voice-entry"><span class="voice-label">${escapeHtml(label)}</span><span class="voice-value">${escapeHtml(val)}</span></div>`;
}

function renderLesson(l: { id: string; title: string; activities: Activity[] }): string {
    const activities = l.activities.map(a => renderActivity(a)).join('');
    return /* html */ `
    <div class="lesson">
        <div class="lesson-header">
            ${escapeHtml(l.title)}
            <span class="lesson-id">${escapeHtml(l.id)}</span>
        </div>
        ${activities}
    </div>`;
}

function renderActivity(a: Activity): string {
    const typeClass = `type-${a.type.toLowerCase()}`;
    let body = '';

    switch (a.type) {
        case 'DIALOGUE':
            body = renderDialogue(a);
            break;
        case 'GRAMMAR':
            body = renderGrammar(a);
            break;
        case 'EXERCISE':
            body = renderExercise(a);
            break;
        case 'CHAT':
            body = renderChat(a);
            break;
    }

    return /* html */ `
    <div class="activity">
        <div class="activity-header">
            <span class="activity-type ${typeClass}">${a.type}</span>
            <span class="activity-title">${escapeHtml(a.title)}</span>
            <span class="activity-id">${escapeHtml(a.id)}</span>
        </div>
        <div class="activity-body">
            ${body}
        </div>
    </div>`;
}

function renderDialogue(a: DialogueActivity): string {
    const instruction = a.instruction
        ? `<div class="activity-instruction">${escapeHtml(a.instruction)}</div>`
        : '';

    const lines = a.lines.map(line => {
        const vocab = line.vocab && line.vocab.length > 0
            ? `<div class="dl-vocab">${line.vocab.map(v => `<span class="vocab-tag">${escapeHtml(v.word)}: ${escapeHtml(v.definition)}</span>`).join('')}</div>`
            : '';
        const notes = line.notes
            ? `<div class="dl-notes">${escapeHtml(line.notes)}</div>`
            : '';

        return /* html */ `
        <div class="dialogue-line">
            <div class="dl-speaker">${escapeHtml(line.speaker || '—')}</div>
            <div class="dl-text">${escapeHtml(line.text)}</div>
            <div class="dl-translation">${escapeHtml(line.translation)}</div>
            ${notes}${vocab}
        </div>`;
    }).join('');

    return `${instruction}<div class="dialogue-lines">${lines}</div>`;
}

function renderGrammar(a: GrammarActivity): string {
    return `<pre class="grammar-raw" style="display:none;white-space:pre-wrap;">${escapeHtml(a.content)}</pre>
            <noscript><div class="grammar-content">${escapeHtml(a.content)}</div></noscript>`;
}

function renderExercise(a: ExerciseActivity): string {
    const instruction = a.instruction
        ? `<div class="activity-instruction">${escapeHtml(a.instruction)}</div>`
        : '';

    const rows = a.items.map((item, i) => {
        const exClass = item.isExample ? ' ex-example' : '';
        const badge = item.isExample ? '<span class="ex-example-badge">example</span>' : '';
        const promptT = item.promptTranslation ? `<div class="ex-translation">${escapeHtml(item.promptTranslation)}</div>` : '';
        const responseT = item.responseTranslation ? `<div class="ex-translation">${escapeHtml(item.responseTranslation)}</div>` : '';

        return /* html */ `
        <div class="exercise-row${exClass}">
            <div class="ex-num">${i + 1}</div>
            <div class="ex-prompt">${escapeHtml(item.prompt)}${badge}${promptT}</div>
            <div class="ex-response">${escapeHtml(item.response)}${responseT}</div>
        </div>`;
    }).join('');

    return `${instruction}<div class="exercise-table">${rows}</div>`;
}

function renderChat(a: ChatActivity): string {
    return /* html */ `
    <div class="chat-scenario">${escapeHtml(a.scenario)}</div>
    <div class="chat-prompt-label">Initial prompt:</div>
    <div class="chat-prompt">${escapeHtml(a.initialPrompt)}</div>`;
}

// -- Helpers -----------------------------------------------------------------

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getFileName(uri: vscode.Uri): string {
    const parts = uri.path.split('/');
    return parts[parts.length - 1];
}
