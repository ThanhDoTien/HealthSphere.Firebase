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

  // Nếu không có base64 hợp lệ, trả về chuỗi rỗng
  if (!base64String || !base64String.startsWith('data:')) {
    return '';
  }

  const hash = hashString(prompt);
  const fullPath = `images/ai/${folder}/${hash}.png`;
  const storageRef = ref(storage, fullPath);

  try {
    // KIỂM TRA CACHE TOÀN CỘNG ĐỒNG
    const existingUrl = await getDownloadURL(storageRef);
    console.log('⚡ [Global Cache Hit] Image found:', hash);
    return existingUrl;
  } catch (err: any) {
    // Nếu lỗi không phải là 404 (không tìm thấy), có thể do lỗi mạng/quyền
    if (err.code !== 'storage/object-not-found') {
      console.warn('⚠️ Storage error during cache check:', err);
    }
  }

  try {
    // Upload tệp mới vào kho chung
    console.log('🚀 [Cache Miss] Uploading new shared AI image:', fullPath);
    const uploadSnapshot = await uploadString(storageRef, base64String, 'data_url');
    return await getDownloadURL(uploadSnapshot.ref);
  } catch (uploadErr) {
    console.error('❌ Failed to upload AI image to shared storage:', uploadErr);
    return base64String; // Trả về base64 gốc nếu không upload được để vẫn hiện được ảnh tạm thời
  }
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
