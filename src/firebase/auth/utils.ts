// ==========================================
// FILE: src/firebase/auth/utils.ts
// MỤC ĐÍCH: Tiện ích Xác thực & Quản lý Hồ sơ Người dùng
// TỔNG QUAN CHỨC NĂNG: Chứa tất cả các hàm liên quan đến đăng ký, đăng nhập,
// đăng nhập Google, đăng xuất. Ngoài ra còn xử lý việc tạo/cập nhật hồ sơ
// người dùng trên Firebase Firestore và đồng bộ dữ liệu sang Backend API.
// ==========================================

'use client'; // Client Component

// Các hàm xác thực của Firebase Authentication SDK
import {
  createUserWithEmailAndPassword, // Tạo tài khoản mới bằng email/mật khẩu
  signInWithEmailAndPassword,     // Đăng nhập bằng email/mật khẩu
  signInWithPopup,                // Đăng nhập bằng cửa sổ popup (Google)
  GoogleAuthProvider,             // Provider cho xác thực Google
  UserCredential,                 // Kiểu dữ liệu trả về sau khi xác thực
  signOut,                        // Đăng xuất
} from "firebase/auth";

// Các hàm thao tác với Firestore (CSDL)
import { doc, setDoc, getDoc, addDoc, collection, updateDoc } from "firebase/firestore";
import { initializeFirebase } from "..";
import { errorEmitter } from "../error-emitter";
import { FirestorePermissionError } from "../errors";

// Khởi tạo kết nối tới Firebase (Singleton)
const { auth, firestore } = initializeFirebase();

// URL Backend API để đồng bộ dữ liệu (ngoài Firebase)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "https://healthsphere-8kji.onrender.com";

// Cấu trúc dữ liệu khi đăng ký tài khoản
interface SignUpData {
  name: string;
  email: string;
  password?: string; // Không bắt buộc (Google Login không cần)
  age: number;
  height: number;
  weight: number;
  gender: string;
  weightGoal: string;    // "gain" | "lose" | "maintain"
  goal: string;          // Mục tiêu sức khỏe tự do
  activityLevel: string; // Mức độ vận động
}

// Hàm nội bộ: Tạo hồ sơ người dùng mới trên Firestore
// Được gọi sau khi Firebase Auth tạo tài khoản thành công
const createUserProfile = async (
  userId: string,
  data: Omit<SignUpData, "password"> // Loại bỏ mật khẩu khỏi dữ liệu lưu trữ
): Promise<void> => {
  // Tạo document tại đường dẫn: users/{userId}
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

// Hàm export: Cập nhật hồ sơ người dùng đã tồn tại
export const updateUserProfile = async (
  userId: string,
  data: Partial<SignUpData> // Chỉ cập nhật các trường được truyền vào
): Promise<void> => {
  const userDocRef = doc(firestore, `users/${userId}`);
  const updateData = { ...data };
  // Không cho phép thay đổi email và mật khẩu qua hàm này
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

// Hàm export: Đăng ký tài khoản mới bằng Email/Password
export const signUp = async (data: SignUpData): Promise<UserCredential> => {
  if (!data.password) throw new Error("Password is required for sign up.");
  // Bước 1: Tạo tài khoản trên Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    data.email,
    data.password
  );
  // Bước 2: Tách mật khẩu ra và lưu phần còn lại làm hồ sơ
  const { password, ...profileData } = data;
  await createUserProfile(userCredential.user.uid, profileData);
  return userCredential;
};

// Hàm export: Đăng nhập bằng Email/Password
export const signIn = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Hàm export: Đăng nhập bằng Google (OAuth Popup)
export const signInWithGoogle = async (): Promise<UserCredential> => {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);

  // Kiểm tra xem người dùng Google này đã có hồ sơ trên hệ thống chưa
  const userDocRef = doc(firestore, `users/${userCredential.user.uid}`);
  const userDoc = await getDoc(userDocRef);
  if (!userDoc.exists()) {
    // Nếu chưa có, tạo hồ sơ mới với thông tin mặc định từ Google
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

// Hàm export: Đăng xuất khỏi hệ thống
export const logout = async (): Promise<void> => {
  return signOut(auth);
};
