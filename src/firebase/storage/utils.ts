'use client';

import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { initializeFirebase } from '@/firebase';

/**
 * Uploads a base64 image string to Firebase Storage and returns the download URL.
 * 
 * @param base64String The image in data URI format (data:image/png;base64,...)
 * @param path The destination path in Storage (e.g., 'suggestions/meals/image_1.png')
 * @returns The public download URL
 */
export async function uploadBase64ToStorage(base64String: string, path: string): Promise<string> {
  const { storage } = initializeFirebase();
  const storageRef = ref(storage, path);

  // uploadString handles the data URL format automatically
  const snapshot = await uploadString(storageRef, base64String, 'data_url');
  const downloadURL = await getDownloadURL(snapshot.ref);
  
  return downloadURL;
}
