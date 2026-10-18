/** Firebase Google authentication. No simulated identities or fallback tokens. */
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

function getFirebaseAuth() {
  if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId || !firebaseConfig.appId) {
    throw new Error('إعدادات تسجيل الدخول عبر Google غير مكتملة.');
  }
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return getAuth(app);
}

export async function signInWithGoogleFirebase(): Promise<{
  idToken: string;
  user: { uid: string; email: string; displayName: string; photoURL?: string; emailVerified: boolean };
}> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  provider.setCustomParameters({ prompt: 'select_account' });

  const credential = await signInWithPopup(auth, provider);
  const user = credential.user;
  if (!user.email || !user.emailVerified) {
    throw new Error('تعذر التحقق من البريد الإلكتروني لحساب Google.');
  }

  return {
    idToken: await user.getIdToken(),
    user: {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || 'باحث زائر',
      photoURL: user.photoURL || undefined,
      emailVerified: user.emailVerified,
    },
  };
}

export async function signOutFirebase(): Promise<void> {
  try {
    await signOut(getFirebaseAuth());
  } catch {
    // Firebase may not have been initialized in this browser session.
  }
}
