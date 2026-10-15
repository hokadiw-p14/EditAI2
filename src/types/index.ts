export type DiagnosticSeverity = 'error' | 'warning' | 'info';

export interface SyntaxDiagnostic {
  id: string;
  line: number; // 1-indexed
  column: number;
  endColumn?: number;
  messageTh: string;
  messageEn: string;
  severity: DiagnosticSeverity;
  rule: string;
  fixSuggestion?: {
    labelTh: string;
    labelEn: string;
    newText: string;
  };
}

export interface DialogueItem {
  id: string;
  lineIndex: number;
  character: string;
  originalText: string;
  translatedText: string;
  voiceFile?: string;
  notes?: string;
  tags: string[];
}

export interface ProjectFile {
  name: string;
  path: string;
  content: string;
  isBinary?: boolean;
  size?: number;
  modified?: boolean;
}

export type EditorTab = 'editor' | 'translator' | 'apk' | 'cheat_generator' | 'connectors' | 'docs';

export interface CheatModOptions {
  enableConsole: boolean;
  enableDeveloper: boolean;
  unlockAllCgs: boolean;
  infiniteMoney: boolean;
  enableRollbackAnywhere: boolean;
  thaiFontSupport: boolean;
  fontName: string;
  fastSkip: boolean;
}

export interface VersionCommit {
  id: string;
  timestamp: number;
  formattedTime: string;
  message: string;
  author: string;
  filesSnapshot: ProjectFile[];
  activeFilePath: string;
  isAutoCommit?: boolean;
  tag?: string;
}

