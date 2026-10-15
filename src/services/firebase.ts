import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  collection,
  query,
  getDocs,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

/* CRITICAL: The app will break without passing firestoreDatabaseId */
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Test connection on boot as mandated by Firebase skill
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or starting up.');
    }
  }
}
testConnection();

import { handleFirestoreError, OperationType } from './projectSyncService';
export * from './projectSyncService';

// User profile helper
export async function syncUserProfile(user: User, customDomain?: string) {
  const userPath = `users/${user.uid}`;
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const existing = await getDoc(userDocRef);

    const data: Record<string, any> = {
      id: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'User',
      photoURL: user.photoURL || '',
      updatedAt: new Date().toISOString(),
    };

    if (!existing.exists()) {
      data.createdAt = new Date().toISOString();
      data.customDomain = customDomain || '';
    } else if (customDomain !== undefined) {
      data.customDomain = customDomain;
    }

    await setDoc(userDocRef, data, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, userPath);
  }
}

