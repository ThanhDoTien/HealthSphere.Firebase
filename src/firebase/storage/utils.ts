'use client';

import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { initializeFirebase } from '@/firebase';

/**
 * Tạo hash đơn giản từ string (dùng làm ID duy nhất cho cache)
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

  // Đảm bảo path bắt đầu bằng users/{uid}/ để tuân thủ Security Rules riêng tư
  const fullPath = path.startsWith('users/') ? path : `users/${user.uid}/${path}`;
  const storageRef = ref(storage, fullPath);

  const snapshot = await uploadString(storageRef, base64String, 'data_url');
  return await getDownloadURL(snapshot.ref);
}

/**
 * Upload ảnh AI vào thư mục CHUNG (shared) với cơ chế cache toàn cục.
 * Nếu ảnh đã tồn tại (dựa trên hash của key), trả về URL cũ ngay lập tức.
 * 
 * @param base64String Ảnh dạng data URI
 * @param key Chuỗi duy nhất (vd: prompt) để tạo hash
 * @param folder Thư mục con trong shared/ai/
 */
export async function uploadBase64WithCache(
  base64String: string,
  key: string,
  folder: 'meals' | 'exercises' = 'meals'
): Promise<string> {
  const { storage, auth } = initializeFirebase();

  if (!auth.currentUser) {
    throw new Error('Người dùng chưa đăng nhập');
  }

  // Tạo ID duy nhất từ key (prompt)
  const hash = hashString(key);

  // SỬ DỤNG ĐƯỜNG DẪN CHUNG (shared) thay vì users/{uid}
  const fullPath = `shared/ai/${folder}/${hash}.png`;
  const storageRef = ref(storage, fullPath);

  try {
    // KIỂM TRA CACHE: Thử lấy URL nếu ảnh đã được ai đó tạo trước đó
    const existingUrl = await getDownloadURL(storageRef);
    console.log('⚡ AI Image Cache Hit:', fullPath);
    return existingUrl;
  } catch (err) {
    // Nếu lỗi (nghĩa là ảnh chưa tồn tại), tiến hành upload mới
    console.log('🔥 Generating New AI Image & Saving to Shared Pool...');
  }

  const snapshot = await uploadString(storageRef, base64String, 'data_url');
  return await getDownloadURL(snapshot.ref);
}
