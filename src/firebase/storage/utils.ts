
'use client';

import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';

/**
 * Tải ảnh base64 lên Firebase Storage vào thư mục riêng của người dùng.
 * 
 * @param base64String Ảnh định dạng data URI (data:image/png;base64,...)
 * @param subPath Đường dẫn con bên trong thư mục của user (ví dụ: 'meals/image_1.png')
 * @returns URL tải xuống công khai
 */
export async function uploadBase64ToStorage(base64String: string, subPath: string): Promise<string> {
  const { storage, auth } = initializeFirebase();
  
  // Lấy UID thật từ Auth
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Người dùng chưa đăng nhập. Không thể tải ảnh lên.");
  }

  const uid = user.uid;
  // Tạo đường dẫn bắt buộc: users/{uid}/{subPath}
  const fullPath = `users/${uid}/${subPath}`;
  const storageRef = ref(storage, fullPath);

  // Upload string với định dạng 'data_url'
  const snapshot = await uploadString(storageRef, base64String, 'data_url');
  const downloadURL = await getDownloadURL(snapshot.ref);
  
  return downloadURL;
}
