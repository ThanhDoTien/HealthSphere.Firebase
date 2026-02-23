'use client';

import React, {
  DependencyList,
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useState,
  useEffect,
} from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot, DocumentData, setDoc } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

export interface FirebaseContextState {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  userProfile: DocumentData | null;
  loading: boolean;
  error: Error | null;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(
  undefined
);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!auth || !firestore) {
      setLoading(false);
      return;
    }

    let profileUnsubscribe: (() => void) | undefined;

    const authUnsubscribe = onAuthStateChanged(
      auth,
      (authUser) => {
        setUser(authUser);
        profileUnsubscribe?.();

        if (authUser) {
          setLoading(true);
          const profileRef = doc(firestore, 'users', authUser.uid);
          profileUnsubscribe = onSnapshot(
            profileRef,
            (snapshot) => {
              if (snapshot.exists()) {
                setUserProfile(snapshot.data());
                setLoading(false);
              } else {
                // Profile does not exist, so we create it with default values.
                const newProfile = {
                  name: authUser.displayName || 'New User',
                  email: authUser.email || '',
                  age: 0,
                  height: 0,
                  weight: 0,
                  gender: 'other',
                  goal: 'Get started!',
                };
                setDoc(profileRef, newProfile).catch((err) => {
                  console.error("Failed to create user profile:", err);
                  setError(err);
                  // Still set loading to false on error to not block UI
                  setLoading(false);
                });
                // The snapshot listener will be re-triggered by setDoc,
                // which will then populate the profile and set loading to false.
              }
            },
            (err) => {
              console.error('Profile listener error:', err);
              setError(err);
              setLoading(false);
            }
          );
        } else {
          // No authenticated user
          setUserProfile(null);
          setLoading(false);
        }
      },
      (err) => {
        console.error('Auth listener error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      authUnsubscribe();
      profileUnsubscribe?.();
    };
  }, [auth, firestore]);

  const contextValue = useMemo(
    () => ({
      firebaseApp,
      firestore,
      auth,
      user,
      userProfile,
      loading,
      error,
    }),
    [firebaseApp, firestore, auth, user, userProfile, loading, error]
  );

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseContextState => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  return context;
};

export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  if (!auth) throw new Error('Auth service not available.');
  return auth;
};

export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  if (!firestore) throw new Error('Firestore service not available.');
  return firestore;
};

export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  if (!firebaseApp) throw new Error('Firebase App not available.');
  return firebaseApp;
};

type MemoFirebase<T> = T & { __memo?: boolean };

export function useMemoFirebase<T>(
  factory: () => T,
  deps: DependencyList
): T | MemoFirebase<T> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoized = useMemo(factory, deps);

  if (typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;

  return memoized;
}
