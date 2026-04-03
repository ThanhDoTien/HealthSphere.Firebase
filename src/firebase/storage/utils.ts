'use client';

import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { initializeFirebase } from '@/firebase';

/**
 * Tạo mã Hash ổn định từ prompt để dùng làm tên file duy nhất.
 */
function hashString(str: string): string {
  let hash = 0;
  // Chuẩn hóa cực kỳ nghiêm ngặt: xóa khoảng trắng thừa, viết thường
  const normalized = str.replace(/\s+/g, ' ').trim().toLowerCase();
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Upload ảnh AI vào thư mục chung 'images/ai/' với cơ chế cache.
 */
export async function uploadBase64WithCache(
  base64String: string,
  prompt: string,
  folder: 'meals' | 'exercises' = 'meals'
): Promise<string> {
  const { storage, auth } = initializeFirebase();

  if (!auth.currentUser) {
    throw new Error('User must be logged in');
  }

  if (!base64String || !base64String.startsWith('data:')) {
    return '';
  }

  const hash = hashString(prompt);
  const fullPath = `images/ai/${folder}/${hash}.png`;
  const storageRef = ref(storage, fullPath);

  try {
    // Kiểm tra xem ảnh đã tồn tại trong kho chung chưa
    const existingUrl = await getDownloadURL(storageRef);
    console.log('⚡ [Shared Cache Hit]:', hash);
    return existingUrl;
  } catch (err: any) {
    // Nếu không tìm thấy, tiến hành upload mới
    if (err.code !== 'storage/object-not-found') {
      console.warn('⚠️ Storage error:', err);
    }
  }

  try {
    console.log('🚀 [Shared Cache Miss] Uploading:', fullPath);
    const uploadSnapshot = await uploadString(storageRef, base64String, 'data_url');
    return await getDownloadURL(uploadSnapshot.ref);
  } catch (uploadErr) {
    console.error('❌ Upload failed:', uploadErr);
    return base64String;
  }
}

/**
 * Lấy URL ảnh AI từ bộ nhớ đệm chung (Shared Cache) dựa trên mã Hash của prompt.
 * Điều này cho phép tái sử dụng ảnh giữa các người dùng khác nhau nếu có cùng prompt.
 */
export async function getAiCacheUrl(prompt: string, folder: 'meals' | 'exercises' = 'meals'): Promise<string | null> {
  const { storage } = initializeFirebase();
  const hash = hashString(prompt);
  const cacheRef = ref(storage, `images/ai/cache/${hash}.png`);

  try {
    const url = await getDownloadURL(cacheRef);
    console.log('💎 [Global Cache Hit]:', hash);
    return url;
  } catch (err: any) {
    if (err.code !== 'storage/object-not-found') {
      console.warn('⚠️ Cache check error:', err);
    }
    return null;
  }
}

/**
 * Lấy URL ảnh Placeholder mặc định từ Storage
 */
export async function getPlaceholderUrl(folder: 'meals' | 'workouts', fileName: string): Promise<string> {
  const { storage } = initializeFirebase();
  const placeholderRef = ref(storage, `ImagePlacehoder/${folder}/${fileName}`);
  try {
    return await getDownloadURL(placeholderRef);
  } catch (err) {
    console.error('Placeholder not found:', err);
    // Fallback sang Pollinations nhưng sử dụng model ổn định hơn hoặc không logo
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(fileName + ', professional food photography')}?width=800&height=600&nologo=true&seed=${hashString(fileName)}`; 
  }
}
