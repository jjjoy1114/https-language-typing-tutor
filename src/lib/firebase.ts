import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocFromServer 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { HistoryRecord, TextPreset } from '../types';

const app = initializeApp(firebaseConfig);

// CRITICAL: The app will break without this line
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Test Firestore connection on boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or configuration pending.');
    }
  }
}
testConnection();

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
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

// User Profile Management
export async function syncUserProfile(user: User) {
  const userRef = doc(db, 'users', user.uid);
  const path = `users/${user.uid}`;
  try {
    const snap = await getDoc(userRef);
    const now = new Date().toISOString();
    if (!snap.exists()) {
      await setDoc(userRef, {
        userId: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || '학생',
        email: user.email || '',
        photoURL: user.photoURL || '',
        createdAt: now,
        updatedAt: now,
      });
    } else {
      await setDoc(userRef, {
        userId: user.uid,
        displayName: user.displayName || snap.data()?.displayName || '학생',
        email: user.email || '',
        photoURL: user.photoURL || '',
        updatedAt: now,
      }, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Cloud Typing Records Operations
export async function saveRecordToCloud(userId: string, record: HistoryRecord): Promise<void> {
  const path = `users/${userId}/records/${record.id}`;
  try {
    const recordRef = doc(db, 'users', userId, 'records', record.id);
    await setDoc(recordRef, {
      id: record.id,
      userId,
      userName: record.name,
      date: record.date,
      textTitle: record.textTitle,
      mode: record.mode,
      wpm: Math.round(record.wpm),
      cpm: Math.round(record.cpm),
      accuracy: Math.round(record.accuracy),
      timeSpent: Math.round(record.timeSpent),
      completed: Boolean(record.completed),
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchUserRecordsFromCloud(userId: string): Promise<HistoryRecord[]> {
  const path = `users/${userId}/records`;
  try {
    const recordsCol = collection(db, 'users', userId, 'records');
    const q = query(recordsCol, limit(100));
    const snap = await getDocs(q);
    const records: HistoryRecord[] = [];
    snap.forEach((d) => {
      const data = d.data();
      records.push({
        id: data.id || d.id,
        name: data.userName || '',
        date: data.date || '',
        textTitle: data.textTitle || '',
        mode: data.mode || 'sentence',
        wpm: data.wpm || 0,
        cpm: data.cpm || 0,
        accuracy: data.accuracy || 0,
        timeSpent: data.timeSpent || 0,
        completed: Boolean(data.completed),
      });
    });
    // Sort descending by date/id
    return records.sort((a, b) => (b.date > a.date ? 1 : -1));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function deleteRecordFromCloud(userId: string, recordId: string): Promise<void> {
  const path = `users/${userId}/records/${recordId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'records', recordId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Cloud Custom Presets Operations
export async function savePresetToCloud(userId: string, preset: TextPreset): Promise<void> {
  const path = `users/${userId}/customPresets/${preset.id}`;
  try {
    const presetRef = doc(db, 'users', userId, 'customPresets', preset.id);
    await setDoc(presetRef, {
      id: preset.id,
      userId,
      title: preset.title,
      language: preset.language,
      content: preset.content,
      description: preset.description || '',
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchUserPresetsFromCloud(userId: string): Promise<TextPreset[]> {
  const path = `users/${userId}/customPresets`;
  try {
    const colRef = collection(db, 'users', userId, 'customPresets');
    const snap = await getDocs(colRef);
    const list: TextPreset[] = [];
    snap.forEach((d) => {
      const data = d.data();
      list.push({
        id: data.id || d.id,
        title: data.title || '',
        language: data.language || 'custom',
        content: data.content || '',
        description: data.description || '',
      });
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function deletePresetFromCloud(userId: string, presetId: string): Promise<void> {
  const path = `users/${userId}/customPresets/${presetId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'customPresets', presetId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Authentication Helpers
export async function loginWithGoogle() {
  return await signInWithPopup(auth, googleProvider);
}

export async function logoutUser() {
  return await signOut(auth);
}

export { onAuthStateChanged };
export type { User };
