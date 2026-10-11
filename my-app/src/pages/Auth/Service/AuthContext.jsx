import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
  confirmPasswordReset,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../../firebase/firebase';
import { setActiveUserId } from '../../../offline/offlineStore';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [authError,   setAuthError]   = useState('');

  async function upsertUserDoc(firebaseUser, extraFields = {}) {
    const ref = doc(db, 'users', firebaseUser.uid);
    const payload = {
      email:    firebaseUser.email,
      name:     firebaseUser.displayName ?? extraFields.name ?? '',
      photoURL: firebaseUser.photoURL ?? '',
    };
    await setDoc(ref, { ...payload, createdAt: serverTimestamp() });
    return { uid: firebaseUser.uid, ...payload };
  }

  async function loadUserProfile(firebaseUser) {
    if (!firebaseUser) { setUserProfile(null); return; }
    const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
    setUserProfile(snap.exists() ? { uid: firebaseUser.uid, ...snap.data() } : null);
  }

  async function login(email, password) {
    setAuthError('');
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      await loadUserProfile(user);
      return user;
    } catch (err) {
      setAuthError(friendlyError(err.code));
      throw err;
    }
  }

  async function register(name, email, password) {
    setAuthError('');
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName: name });
      await upsertUserDoc(user, { name });
      await signOut(auth);
      return user;
    } catch (err) {
      setAuthError(friendlyError(err.code));
      throw err;
    }
  }

  async function loginWithGoogle() {
    setAuthError('');
    try {
      const { user } = await signInWithPopup(auth, new GoogleAuthProvider());
      const profile  = await upsertUserDoc(user);
      setUserProfile(profile);
      return user;
    } catch (err) {
      console.error('[Google sign-in]', err.code, err.message);
      setAuthError(friendlyError(err.code));
      throw err;
    }
  }

  async function loginWithGithub() {
    setAuthError('');
    try {
      const { user } = await signInWithPopup(auth, new GithubAuthProvider());
      const profile  = await upsertUserDoc(user);
      setUserProfile(profile);
      return user;
    } catch (err) {
      console.error('[GitHub sign-in]', err.code, err.message);
      setAuthError(friendlyError(err.code));
      throw err;
    }
  }

  async function logout() {
    await signOut(auth);
    setUserProfile(null);
  }

  async function sendPasswordReset(email) {
    setAuthError('');
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      const msg = friendlyError(err.code);
      setAuthError(msg);
      throw new Error(msg);
    }
  }

  async function confirmNewPassword(oobCode, newPassword) {
    setAuthError('');
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
    } catch (err) {
      const msg = friendlyError(err.code);
      setAuthError(msg);
      throw new Error(msg);
    }
  }

  function clearError() { setAuthError(''); }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setActiveUserId(user?.uid ?? null);
      await loadUserProfile(user);
      setLoading(false);
    });
    return unsub;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    authError,
    clearError,
    login,
    register,
    loginWithGoogle,
    loginWithGithub,
    logout,
    sendPasswordReset,
    confirmNewPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

import { Navigate, Outlet } from 'react-router-dom';
export function ProtectedRoute({ redirectTo = '/auth/login' }) {
  const { currentUser, userProfile, loading } = useAuth();

 if (loading || (currentUser && !userProfile)) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <style>{`
        @keyframes shadowPulse {
          33% { background: #f4f4f4; box-shadow: -24px 0 #1b6b51, 24px 0 #f4f4f4; }
          66% { background: #1b6b51; box-shadow: -24px 0 #f4f4f4, 24px 0 #f4f4f4; }
          100% { background: #f4f4f4; box-shadow: -24px 0 #f4f4f4, 24px 0 #1b6b51; }
        }
        .dot-loader {
          width: 16px; height: 16px; border-radius: 50%;
          display: block; position: relative;
          background: #f4f4f4;
          box-shadow: -24px 0 #f4f4f4, 24px 0 #f4f4f4;
          animation: shadowPulse 2s linear infinite;
        }
      `}</style>
      <span className="dot-loader" />
    </div>
  );
}

  return currentUser && userProfile ? <Outlet /> : <Navigate to={redirectTo} replace />;
}

function friendlyError(code) {
  const map = {
    'auth/user-not-found':                    'No account found with that email.',
    'auth/wrong-password':                    'Incorrect password. Please try again.',
    'auth/invalid-credential':                'Invalid email or password.',
    'auth/email-already-in-use':              'An account with this email already exists.',
    'auth/weak-password':                     'Password must be at least 6 characters.',
    'auth/invalid-email':                     'Please enter a valid email address.',
    'auth/popup-closed-by-user':              'Sign-in popup was closed before completing.',
    'auth/too-many-requests':                 'Too many attempts. Please wait a moment and try again.',
    'auth/invalid-action-code':               'This reset link is invalid or has expired.',
    'auth/expired-action-code':               'This reset link has expired. Please request a new one.',
    'auth/operation-not-allowed':             'This sign-in provider is not enabled in the Firebase console. Go to Authentication > Sign-in method and turn it on.',
    'auth/unauthorized-domain':               'This sign-in method is blocked for this domain. Add the domain under Firebase Authentication > Settings > Authorized domains.',
    'auth/popup-blocked':                     'The sign-in popup was blocked. Allow popups for this site and try again.',
    'auth/cancelled-popup-request':           'Another sign-in popup is already open. Close it and try again.',
    'auth/account-exists-with-different-credential':
      'An account already exists with this email. Sign in with the original method first.',
    'auth/credential-already-in-use':         'This GitHub account is already linked to a registered email. Sign in with your email and password instead.',
    'auth/network-request-failed':            'Network error. Check your connection and try again.',
  };
  return map[code] ?? `An unexpected error occurred. Please try again. (${code || 'unknown'})`;
}