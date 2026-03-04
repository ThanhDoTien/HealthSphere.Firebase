'use client';

import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { initializeFirebase } from '@/firebase';

/**
 * Tạo mã Hash ổn định từ string (dùng làm ID duy nhất cho cache ảnh cộng đồng)
 * Phải đảm bảo prompt giống nhau sẽ ra mã hash giống nhau cho mọi user.
 */
function hashString(str: string): string {
  let hash = 0;
  // Chuẩn hóa chuỗi (xóa khoảng trắng thừa, viết thường) trước khi hash
  const normalized = str.trim().toLowerCase();
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Upload ảnh AI vào thư mục CHUNG 'images/ai/' với cơ chế cache toàn hệ thống.
 * Sử dụng mã Hash của Prompt để làm tên file.
 * Nếu ảnh đã tồn tại, dùng lại URL cũ để tiết kiệm tài nguyên.
 */
export async function uploadBase64WithCache(
  base64String: string,
  prompt: string,
  folder: 'meals' | 'exercises' = 'meals'
): Promise<string> {
  const { storage, auth } = initializeFirebase();

  if (!auth.currentUser) {
    throw new Error('Người dùng cần đăng nhập để thực hiện tác vụ này');
  }

  const hash = hashString(prompt);
  const fullPath = `images/ai/${folder}/${hash}.png`;
  const storageRef = ref(storage, fullPath);

  try {
    // KIỂM TRA CACHE TOÀN CỘNG ĐỒNG: 
    // Nếu tệp này đã có trong Storage (do user khác đã gen trước đó), dùng luôn URL cũ
    const existingUrl = await getDownloadURL(storageRef);
    console.log('⚡ [Global Cache Hit] Image found for prompt hash:', hash);
    return existingUrl;
  } catch (err) {
    // Lỗi 404 nghĩa là chưa có ai gen ảnh này, tiến hành upload mới
    console.log('🚀 [Cache Miss] Generating and uploading new shared AI image:', fullPath);
  }

  // Upload tệp mới vào kho chung
  const uploadSnapshot = await uploadString(storageRef, base64String, 'data_url');
  return await getDownloadURL(uploadSnapshot.ref);
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
