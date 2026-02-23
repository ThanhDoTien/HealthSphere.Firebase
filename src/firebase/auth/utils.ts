'use client';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  UserCredential,
  signOut,
} from "firebase/auth";
import { doc, setDoc, getDoc, addDoc, collection } from "firebase/firestore";
import { initializeFirebase } from "..";
import { errorEmitter } from "../error-emitter";
import { FirestorePermissionError } from "../errors";

const { auth, firestore } = initializeFirebase();

interface SignUpData {
  name: string;
  email: string;
  password?: string;
  age: number;
  height: number;
  weight: number;
  gender: string;
  goal: string;
}

// Create a user profile and initial weight log in Firestore
const createUserProfile = async (
  userId: string,
  data: Omit<SignUpData, "password" | 'confirmPassword'> & { weight: number }
): Promise<void> => {
  const userDocRef = doc(firestore, `users/${userId}`);
  await setDoc(userDocRef, data).catch((error) => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'create',
        requestResourceData: data,
      })
    );
    throw error; // Re-throw to be caught by the calling function
  });

  // Add initial weight log
  const weightLogRef = collection(firestore, `users/${userId}/weights`);
  const weightLogData = {
    userId: userId,
    weight: data.weight,
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
  };
  await addDoc(weightLogRef, weightLogData).catch((error) => {
    // We don't rethrow here as it's a non-critical secondary write.
    // The user has been created, profile is set, just the initial weight log failed.
    // The error will still be logged to the dev console by the listener.
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: weightLogRef.path,
        operation: 'create',
        requestResourceData: weightLogData,
      })
    );
  });
};

// Sign Up with email and password
export const signUp = async (data: SignUpData): Promise<UserCredential> => {
  if (!data.password) throw new Error("Password is required for sign up.");
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    data.email,
    data.password
  );
  const { password, ...profileData } = data;
  await createUserProfile(userCredential.user.uid, profileData);
  return userCredential;
};

// Sign In with email and password
export const signIn = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Sign In with Google
export const signInWithGoogle = async (): Promise<UserCredential> => {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);

  // Create profile if it doesn't exist
  const userDocRef = doc(firestore, `users/${userCredential.user.uid}`);
  const userDoc = await getDoc(userDocRef);
  if (!userDoc.exists()) {
    const profileData = {
      name: userCredential.user.displayName || "Google User",
      email: userCredential.user.email!,
      age: 0,
      height: 0,
      weight: 0,
      gender: "other",
      goal: "Stay healthy",
    };
    await createUserProfile(userCredential.user.uid, profileData);
  }

  return userCredential;
};

// Logout
export const logout = async (): Promise<void> => {
  return signOut(auth);
};
