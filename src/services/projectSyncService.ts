import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { ProjectFile } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Standardized Firestore error handler mandated by Firebase skill.
 * Formats context into structured JSON and logs error.
 */
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface CloudProject {
  id: string;
  userId: string;
  name: string;
  activeFilePath: string;
  files: ProjectFile[];
  filesCount: number;
  createdAt: string;
  updatedAt: string;
  lastSyncedDevice?: string;
}

export interface SyncOptions {
  projectId?: string;
  projectName?: string;
  deviceName?: string;
}

export interface SyncResult {
  success: boolean;
  projectId: string;
  lastSynced: string;
  filesCount: number;
  error?: string;
}

export const DEFAULT_PROJECT_ID = 'default_project';

/**
 * Sanitize files before uploading to Firestore to stay safely within the 1MB document limit.
 * Large binary files (>400KB) are filtered or trimmed with placeholder notices.
 */
export function sanitizeFilesForCloud(files: ProjectFile[]): ProjectFile[] {
  return files.map((file) => {
    if (file.isBinary && file.content && file.content.length > 400000) {
      return {
        ...file,
        content: `[Binary content omitted for cloud sync: ${file.name}]`,
        modified: false,
      };
    }
    return {
      name: file.name,
      path: file.path,
      content: file.content || '',
      isBinary: Boolean(file.isBinary),
      size: file.size || (file.content ? file.content.length : 0),
      modified: false,
    };
  });
}

/**
 * Sync current project files to Firestore under the authenticated user's ID.
 * Persists files, active file path, and timestamps across devices.
 */
export async function syncCurrentProjectToFirestore(
  userId: string,
  files: ProjectFile[],
  activeFilePath: string,
  options?: SyncOptions
): Promise<SyncResult> {
  const projectId = options?.projectId || DEFAULT_PROJECT_ID;
  const path = `users/${userId}/projects/${projectId}`;

  if (!userId) {
    return {
      success: false,
      projectId,
      lastSynced: '',
      filesCount: 0,
      error: 'User not authenticated',
    };
  }

  try {
    const cleanFiles = sanitizeFilesForCloud(files);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const isoString = now.toISOString();

    const projectRef = doc(db, 'users', userId, 'projects', projectId);

    // Check if doc exists to preserve original createdAt
    let createdAt = isoString;
    try {
      const existingSnap = await getDoc(projectRef);
      if (existingSnap.exists()) {
        const data = existingSnap.data();
        if (data.createdAt) {
          createdAt = data.createdAt;
        }
      }
    } catch {
      // Non-fatal, fallback to now
    }

    const payload: CloudProject = {
      id: projectId,
      userId,
      name: options?.projectName || 'Ren\'Py & Code Studio Project',
      activeFilePath: activeFilePath || cleanFiles[0]?.path || 'game/script.rpy',
      files: cleanFiles,
      filesCount: cleanFiles.length,
      createdAt,
      updatedAt: isoString,
      lastSyncedDevice: options?.deviceName || navigator.userAgent.slice(0, 40),
    };

    await setDoc(projectRef, payload, { merge: true });

    return {
      success: true,
      projectId,
      lastSynced: timeStr,
      filesCount: cleanFiles.length,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Load a project from Firestore by user ID and project ID.
 */
export async function loadProjectFromFirestore(
  userId: string,
  projectId: string = DEFAULT_PROJECT_ID
): Promise<CloudProject | null> {
  const path = `users/${userId}/projects/${projectId}`;

  if (!userId) {
    return null;
  }

  try {
    const projectRef = doc(db, 'users', userId, 'projects', projectId);
    const snap = await getDoc(projectRef);

    if (!snap.exists()) {
      return null;
    }

    const data = snap.data();
    let loadedFiles: ProjectFile[] = [];

    if (Array.isArray(data.files) && data.files.length > 0) {
      loadedFiles = data.files;
    } else if (data.filesJson) {
      try {
        loadedFiles = JSON.parse(data.filesJson);
      } catch {
        loadedFiles = [];
      }
    }

    return {
      id: data.id || projectId,
      userId: data.userId || userId,
      name: data.name || 'Cloud Project',
      activeFilePath: data.activeFilePath || (loadedFiles[0] ? loadedFiles[0].path : ''),
      files: loadedFiles,
      filesCount: loadedFiles.length,
      createdAt: data.createdAt || '',
      updatedAt: data.updatedAt || '',
      lastSyncedDevice: data.lastSyncedDevice,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Retrieve all projects saved in Firestore for the given user ID.
 */
export async function listUserProjectsFromFirestore(userId: string): Promise<CloudProject[]> {
  const path = `users/${userId}/projects`;

  if (!userId) {
    return [];
  }

  try {
    const colRef = collection(db, 'users', userId, 'projects');
    const q = query(colRef, orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);

    return snap.docs.map((d) => {
      const data = d.data();
      let filesList: ProjectFile[] = [];
      if (Array.isArray(data.files)) {
        filesList = data.files;
      } else if (data.filesJson) {
        try {
          filesList = JSON.parse(data.filesJson);
        } catch {
          filesList = [];
        }
      }

      return {
        id: d.id,
        userId: data.userId || userId,
        name: data.name || 'Untitled Project',
        activeFilePath: data.activeFilePath || '',
        files: filesList,
        filesCount: data.filesCount ?? filesList.length,
        createdAt: data.createdAt || '',
        updatedAt: data.updatedAt || '',
        lastSyncedDevice: data.lastSyncedDevice,
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Delete a project from Firestore.
 */
export async function deleteProjectFromFirestore(
  userId: string,
  projectId: string
): Promise<boolean> {
  const path = `users/${userId}/projects/${projectId}`;

  if (!userId || !projectId) {
    return false;
  }

  try {
    const projectRef = doc(db, 'users', userId, 'projects', projectId);
    await deleteDoc(projectRef);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Subscribe to real-time changes on a user's project document.
 * This allows real-time synchronization across multiple browser windows or devices.
 */
export function subscribeToCloudProject(
  userId: string,
  projectId: string,
  onUpdate: (project: CloudProject | null) => void
): Unsubscribe {
  const path = `users/${userId}/projects/${projectId}`;

  const projectRef = doc(db, 'users', userId, 'projects', projectId);

  return onSnapshot(
    projectRef,
    (snap) => {
      if (!snap.exists()) {
        onUpdate(null);
        return;
      }

      const data = snap.data();
      let files: ProjectFile[] = [];
      if (Array.isArray(data.files)) {
        files = data.files;
      } else if (data.filesJson) {
        try {
          files = JSON.parse(data.filesJson);
        } catch {
          files = [];
        }
      }

      onUpdate({
        id: data.id || projectId,
        userId: data.userId || userId,
        name: data.name || 'Ren\'Py Project',
        activeFilePath: data.activeFilePath || (files[0] ? files[0].path : ''),
        files,
        filesCount: files.length,
        createdAt: data.createdAt || '',
        updatedAt: data.updatedAt || '',
        lastSyncedDevice: data.lastSyncedDevice,
      });
    },
    (error) => {
      // Mandated: Always catch snapshot errors with handleFirestoreError
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}
