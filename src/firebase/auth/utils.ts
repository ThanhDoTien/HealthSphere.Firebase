
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

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "https://healthsphere-8kji.onrender.com";

interface SignUpData {
  name: string;
  email: string;
  password?: string;
  age: number;
  height: number;
  weight: number;
  gender: string;
  weightGoal: string;
  goal: string;
  activityLevel: string;
}

const createUserProfile = async (
  userId: string,
  data: Omit<SignUpData, "password">
): Promise<void> => {
  const userDocRef = doc(firestore, `users/${userId}`);
  const createdAt = new Date().toISOString();

  const profileToStore = { ...data, createdAt };
  await setDoc(userDocRef, profileToStore).catch((error) => {
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

  // Đồng bộ sang Middleware Backend với định dạng JSON chuẩn
  const syncPayload = {
    id: 0,
    authId: userId,
    email: data.email,
    name: data.name,
    gender: data.gender,
    height: data.height,
    weight: data.weight,
    goal: data.goal,
    weightGoal: data.weightGoal,
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

  // Khởi tạo nhật ký cân nặng đầu tiên (Sử dụng Ngày làm ID để đồng bộ)
  const today = new Date().toISOString().split('T')[0];
  const weightLogRef = doc(firestore, `users/${userId}/weights`, today);
  const weightLogData = {
    userId: userId,
    weight: data.weight,
    date: today,
  };
  await setDoc(weightLogRef, weightLogData);
};

export const updateUserProfile = async (
  userId: string,
  data: Partial<SignUpData>
): Promise<void> => {
  const userDocRef = doc(firestore, `users/${userId}`);
  const updateData = { ...data };
  delete updateData.email;
  delete (updateData as any).password;

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

  // Đồng bộ sang Nhật ký cân nặng nếu có thay đổi cân nặng
  if (data.weight !== undefined) {
    const today = new Date().toISOString().split('T')[0];
    const weightLogRef = doc(firestore, `users/${userId}/weights`, today);
    await setDoc(weightLogRef, {
      userId: userId,
      weight: data.weight,
      date: today,
    }, { merge: true });
  }
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
      weightGoal: "maintain",
      goal: "Stay healthy",
      activityLevel: "moderate"
    };
    await createUserProfile(userCredential.user.uid, profileData);
  }

  return userCredential;
};

export const logout = async (): Promise<void> => {
  return signOut(auth);
};
