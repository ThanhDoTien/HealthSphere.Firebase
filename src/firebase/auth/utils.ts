
'use client';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  UserCredential,
  signOut,
} from "firebase/auth";
import { doc, setDoc, getDoc, addDoc, collection, updateDoc } from "firebase/firestore";
import { initializeFirebase } from "..";
import { errorEmitter } from "../error-emitter";
import { FirestorePermissionError } from "../errors";

const { auth, firestore } = initializeFirebase();

const BACKEND_URL = "https://healthsphere-8kji.onrender.com";

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

/**
 * Tạo User Profile trong Firestore và ĐỒNG BỘ SANG BACKEND
 */
const createUserProfile = async (
  userId: string,
  data: Omit<SignUpData, "password" | 'confirmPassword'> & { weight: number }
): Promise<void> => {
  const userDocRef = doc(firestore, `users/${userId}`);
  const createdAt = new Date().toISOString();

  // 1. Lưu vào Firestore của Firebase
  await setDoc(userDocRef, { ...data, createdAt }).catch((error) => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'create',
        requestResourceData: data,
      })
    );
    throw error;
  });

  // 2. Gửi chuỗi JSON sang Backend theo định dạng yêu cầu
  const syncPayload = {
    id: 0,
    authId: userId,
    email: data.email,
    name: data.name,
    gender: data.gender,
    height: data.height,
    weight: data.weight,
    goal: data.goal,
    createdAt: createdAt
  };

  try {
    fetch(`${BACKEND_URL}/api/Users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(syncPayload),
    }).catch(err => console.error("Sync error:", err));
  } catch (err) {
    console.error("Cannot connect to backend sync:", err);
  }

  // 3. Tạo bản ghi cân nặng đầu tiên
  const weightLogRef = collection(firestore, `users/${userId}/weights`);
  const weightLogData = {
    userId: userId,
    weight: data.weight,
    date: new Date().toISOString().split('T')[0],
  };
  await addDoc(weightLogRef, weightLogData).catch((error) => {
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

type UpdateProfileData = Partial<SignUpData>;

export const updateUserProfile = async (
  userId: string,
  data: UpdateProfileData
): Promise<void> => {
  const userDocRef = doc(firestore, `users/${userId}`);
  const updateData = { ...data };
  delete updateData.email;
  delete updateData.password;

  await updateDoc(userDocRef, updateData).catch((error) => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'update',
        requestResourceData: updateData,
      })
    );
    throw error;
  });
};

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

export const signIn = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signInWithGoogle = async (): Promise<UserCredential> => {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);

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

export const logout = async (): Promise<void> => {
  return signOut(auth);
};
