'use client';

import React, { type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
// Import the initialized services directly
import { firebaseApp, auth, firestore } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // The services are initialized once when firebase/index.ts is imported.
  // No need for useMemo or an initializeFirebase() call here.
  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      auth={auth}
      firestore={firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
