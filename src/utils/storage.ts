import { ProjectFile } from '../types';

const STORAGE_KEYS = {
  FILES: 'renpy_studio_project_files_v1',
  ACTIVE_PATH: 'renpy_studio_active_path_v1',
  LAST_SAVED: 'renpy_studio_last_saved_v1',
};

export interface StoredProject {
  files: ProjectFile[];
  activeFilePath: string;
  lastSaved: string; // ISO string or formatted time
}

/**
 * Save project files and active file path to localStorage.
 * Filters out large binary files to preserve localStorage quota.
 */
export function saveProjectToStorage(
  files: ProjectFile[],
  activeFilePath: string
): { success: boolean; lastSaved: string; error?: string } {
  try {
    if (!files || files.length === 0) {
      return { success: false, lastSaved: '', error: 'No files to save' };
    }

    // Filter out huge binary files (> 1.5MB) to avoid quota errors
    const persistableFiles = files.map((f) => {
      if (f.isBinary && f.content.length > 500000) {
        return {
          ...f,
          content: '[Binary data omitted from auto-save]',
        };
      }
      return f;
    });

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(persistableFiles));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PATH, activeFilePath);
    localStorage.setItem(STORAGE_KEYS.LAST_SAVED, timeStr);

    return { success: true, lastSaved: timeStr };
  } catch (error: any) {
    console.warn('Failed to auto-save to localStorage:', error);
    return { success: false, lastSaved: '', error: error?.message || 'Quota exceeded' };
  }
}

/**
 * Load persisted project files from localStorage if available.
 */
export function loadProjectFromStorage(): StoredProject | null {
  try {
    const rawFiles = localStorage.getItem(STORAGE_KEYS.FILES);
    const activePath = localStorage.getItem(STORAGE_KEYS.ACTIVE_PATH);
    const lastSaved = localStorage.getItem(STORAGE_KEYS.LAST_SAVED);

    if (!rawFiles) return null;

    const parsedFiles = JSON.parse(rawFiles) as ProjectFile[];
    if (!Array.isArray(parsedFiles) || parsedFiles.length === 0) {
      return null;
    }

    const validActivePath =
      activePath && parsedFiles.some((f) => f.path === activePath)
        ? activePath
        : parsedFiles[0].path;

    return {
      files: parsedFiles,
      activeFilePath: validActivePath,
      lastSaved: lastSaved || 'ก่อนหน้านี้',
    };
  } catch (error) {
    console.warn('Failed to load project from localStorage:', error);
    return null;
  }
}

/**
 * Clear stored project in localStorage.
 */
export function clearProjectStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.FILES);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_PATH);
    localStorage.removeItem(STORAGE_KEYS.LAST_SAVED);
  } catch (error) {
    console.warn('Failed to clear localStorage:', error);
  }
}

const HISTORY_KEY = 'renpy_studio_version_history_v1';

/**
 * Load Version Commits from localStorage.
 */
export function loadVersionHistoryFromStorage(): import('../types').VersionCommit[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to load version history:', err);
    return [];
  }
}

/**
 * Save Version Commits to localStorage (max 30 snapshots to respect quota).
 */
export function saveVersionHistoryToStorage(commits: import('../types').VersionCommit[]): boolean {
  try {
    // Keep latest 30 commits
    const trimmed = commits.slice(-30);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    return true;
  } catch (err) {
    console.warn('Failed to save version history:', err);
    return false;
  }
}

