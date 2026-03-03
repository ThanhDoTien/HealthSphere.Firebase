'use client';

import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';

/**
 * Tạo hash đơn giản từ string (dùng làm ID duy nhất)
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString();
}

/**
 * Upload ảnh base64 lên Firebase Storage với cơ chế cache
 * 
 * @param base64String Ảnh dạng data URI
 * @param key Chuỗi duy nhất (vd: prompt, tên món ăn, bài tập...)
 * @param folder 'meals' | 'exercises'
 */
export async function uploadBase64WithCache(
  base64String: string,
  key: string,
  folder: 'meals' | 'exercises' = 'meals'
): Promise<string> {
  const { storage, auth } = initializeFirebase();

  const user = auth.currentUser;
  if (!user) {
    throw new Error('Người dùng chưa đăng nhập');
  }

  const uid = user.uid;

  // Tạo ID duy nhất từ key
  const hash = hashString(key);

  // Path chuẩn (cache theo user)
  const fullPath = `users/${uid}/ai/${folder}/${hash}.png`;
  const storageRef = ref(storage, fullPath);

  try {
    // THỬ lấy URL trước (nếu đã tồn tại)
    const existingUrl = await getDownloadURL(storageRef);
    return existingUrl;
  } catch (err) {
    // chưa có → upload mới
  }

  // Upload ảnh mới
  const snapshot = await uploadString(storageRef, base64String, 'data_url');

  const downloadURL = await getDownloadURL(snapshot.ref);

  return downloadURL;
}