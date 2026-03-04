'use client';

import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { initializeFirebase } from '@/firebase';

/**
 * Tạo mã Hash Hex từ string (dùng làm ID duy nhất cho cache ảnh)
 * Phải khớp logic với Backend để tìm được ảnh cũ
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Upload ảnh base64 trực tiếp lên Firebase Storage vào thư mục riêng của user
 */
export async function uploadBase64ToStorage(
  base64String: string,
  path: string
): Promise<string> {
  const { storage, auth } = initializeFirebase();

  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not logged in');
  }

  const fullPath = path.startsWith('users/') ? path : `users/${user.uid}/${path}`;
  const storageRef = ref(storage, fullPath);

  const snapshot = await uploadString(storageRef, base64String, 'data_url');
  return await getDownloadURL(snapshot.ref);
}

/**
 * Upload ảnh AI vào thư mục CHUNG 'images' với cơ chế cache.
 * Sử dụng mã Hash của Prompt để làm tên file.
 */
export async function uploadBase64WithCache(
  base64String: string,
  prompt: string,
  folder: 'meals' | 'exercises' = 'meals'
): Promise<string> {
  const { storage, auth } = initializeFirebase();

  if (!auth.currentUser) {
    throw new Error('Người dùng chưa đăng nhập');
  }

  const hash = hashString(prompt);
  const fullPath = `images/ai/${folder}/${hash}.png`;
  const storageRef = ref(storage, fullPath);

  try {
    // KIỂM TRA CACHE: Nếu ảnh đã tồn tại, dùng lại luôn
    const existingUrl = await getDownloadURL(storageRef);
    console.log('⚡ AI Image Cache Hit:', fullPath);
    return existingUrl;
  } catch (err) {
    console.log('Generating New AI Image...');
  }

  const snapshot = await uploadString(storageRef, base64String, 'data_url');
  return await getDownloadURL(snapshot.ref);
}
