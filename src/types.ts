/**
 * Course and module types for Language Reactor courses.
 * Derived from reactor-module-tools/module-preview/src/lc_types.ts.
 * Backend-only fields (nlp, ttsDataURL) retained for schema compatibility
 * but not used in the extension.
 */

export type LangCode = string;

// -- Course ------------------------------------------------------------------

export interface Course {
    diocoPlaylistId: string;
    title: string;
    description: string;
    image: string | null;
    targetLang_G: LangCode;
    homeLang_G: LangCode;
}

// -- Module ------------------------------------------------------------------

export interface VoiceSpec {
    voice: string;
    prompt: string | null;
    displayName?: string | null;
}

export interface ModuleVoiceConfig {
    default: string | VoiceSpec | null;
    prompt: string | VoiceSpec | null;
    response: string | VoiceSpec | null;
    introVoice?: string | VoiceSpec | null;
    speakers: { [speakerName: string]: string | VoiceSpec };
}

export interface Module {
    diocoDocId: string;
    title: string;
    description: string | null;
    image: string | null;
    targetLang_G: LangCode;
    homeLang_G: LangCode;
    voiceConfig: ModuleVoiceConfig;
    ttsPrompt: string | null;
    lessons: LessonContent[];
}

// -- Lesson ------------------------------------------------------------------

export interface LessonContent {
    id: string;
    title: string;
    activities: Activity[];
}

// -- Activities --------------------------------------------------------------

export type Activity = DialogueActivity | GrammarActivity | ExerciseActivity | ChatActivity;

export interface ActivityBase {
    type: 'DIALOGUE' | 'GRAMMAR' | 'EXERCISE' | 'CHAT';
    id: string;
    title: string;
    intro?: string | null;
}

export interface DialogueActivity extends ActivityBase {
    type: 'DIALOGUE';
    instruction: string | null;
    ttsPrompt: string | null;
    lines: DialogueLine[];
}

export interface DialogueLine {
    speaker: string | null;
    text: string;
    translation: string;
    notes: string | null;
    vocab: { word: string; definition: string }[] | null;
    nlp: unknown | null;
    ttsDataURL: string | null;
}

export interface GrammarActivity extends ActivityBase {
    type: 'GRAMMAR';
    image: string | null;
    content: string;
    phrases: unknown[];
}

export interface ExerciseActivity extends ActivityBase {
    type: 'EXERCISE';
    instruction: string | null;
    ttsPrompt: string | null;
    items: ExerciseItem[];
}

export interface ExerciseItem {
    prompt: string;
    promptTranslation: string | null;
    response: string;
    responseTranslation: string | null;
    isExample: boolean;
    promptNlp: unknown | null;
    responseNlp: unknown | null;
    promptTtsDataURL: string | null;
    responseTtsDataURL: string | null;
}

export interface ChatActivity extends ActivityBase {
    type: 'CHAT';
    scenario: string;
    initialPrompt: string;
}

// -- Sidebar mock data -------------------------------------------------------

export interface CourseListItem {
    id: string;
    title: string;
    language: string;
    moduleCount: number;
    source: 'official' | 'community' | 'user';
    description?: string;
    author?: string;
}
