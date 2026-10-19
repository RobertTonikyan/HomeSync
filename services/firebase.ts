import { initializeApp, getApps, getApp } from 'firebase/app';
import { arrayUnion, doc, getFirestore, setDoc } from 'firebase/firestore';
import * as FirebaseAuth from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Keep the anonymous session between launches. getReactNativePersistence only exists
// in Firebase's React Native build, so it's looked up at runtime.
function createAuth(): FirebaseAuth.Auth {
  const getRNPersistence = (FirebaseAuth as any).getReactNativePersistence;
  if (getRNPersistence) {
    try {
      return FirebaseAuth.initializeAuth(app, { persistence: getRNPersistence(AsyncStorage) });
    } catch {
      // Already initialised (fast refresh)
    }
  }
  return FirebaseAuth.getAuth(app);
}

export const auth = createAuth();

/**
 * Sign in silently so the Firestore rules (request.auth != null) are satisfied.
 * Requires "Anonymous" to be enabled under Firebase Console → Authentication → Sign-in method.
 */
export function ensureSignedIn(): Promise<void> {
  return new Promise((resolve) => {
    const unsub = FirebaseAuth.onAuthStateChanged(auth, async (user) => {
      unsub();
      if (!user) {
        try {
          await FirebaseAuth.signInAnonymously(auth);
        } catch (e) {
          console.warn('Anonymous sign-in failed — enable it in Firebase Console', e);
        }
      }
      resolve();
    });
  });
}

// The household ID is the shared key between the two phones — keep it long and random.
export const HOUSEHOLD_ID = (process.env.EXPO_PUBLIC_HOUSEHOLD_ID || '').trim();
if (!HOUSEHOLD_ID) {
  throw new Error('EXPO_PUBLIC_HOUSEHOLD_ID is missing. Copy .env.example to .env and set a long random household ID.');
}
if (HOUSEHOLD_ID.length < 16) {
  console.warn('[security] EXPO_PUBLIC_HOUSEHOLD_ID is short and easy to guess. Use 16+ random characters.');
}

/**
 * Register this device as a member of the household. The Firestore rules only let a
 * device add its own uid, and only members can read or write household data.
 */
export async function joinHousehold(): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const write = setDoc(
    doc(db, 'households', HOUSEHOLD_ID),
    { householdId: HOUSEHOLD_ID, memberUids: arrayUnion(uid) },
    { merge: true }
  );
  // Don't hang forever when offline; the write stays queued and syncs later.
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, 8000));
  try {
    await Promise.race([write, timeout]);
  } catch (e) {
    console.warn('[firestore] could not join household', e);
  }
}
