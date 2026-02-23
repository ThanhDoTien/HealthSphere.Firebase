'use client';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  UserCredential,
  signOut,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, firestore } from "../index";

interface SignUpData {
  name: string;
  email: string;
  password?: string;
  age: number;
  height: number;
  weight: number;
  gender: string;
}

// Create a user profile in Firestore
const createUserProfile = async (
  userId: string,
  data: Omit<SignUpData, "password">
): Promise<void> => {
  const userDocRef = doc(firestore, `users/${userId}`);
  await setDoc(userDocRef, data);
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
    // Create a complete profile with default values
    const profileData = {
      name: userCredential.user.displayName || "Google User",
      email: userCredential.user.email!,
      age: 0,
      height: 0,
      weight: 0,
      gender: "other",
    };
    await createUserProfile(userCredential.user.uid, profileData);
  }

  return userCredential;
};

// Logout
export const logout = async (): Promise<void> => {
  return signOut(auth);
};
