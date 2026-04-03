import * as admin from 'firebase-admin';

/**
 * Khởi tạo Firebase Admin SDK.
 * Sử dụng Service Account để có toàn quyền truy cập Storage/Firestore ở phía Server.
 */
export function initializeAdmin() {
  if (!admin.apps.length) {
    const saString = process.env.FIREBASE_SERVICE_ACCOUNT;
    const serviceAccount = saString ? JSON.parse(saString) : null;

    if (serviceAccount) {
      console.log('🛡️ [Firebase Admin] Initializing with Service Account from .env');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: "studio-8164753205-5553c.firebasestorage.app"
      });
    } else {
      console.warn('⚠️ [Firebase Admin] No Service Account found in .env. Falling back to default credentials.');
      admin.initializeApp({
        storageBucket: "studio-8164753205-5553c.firebasestorage.app"
      });
    }
  }
  
  return {
    adminDb: admin.firestore(),
    adminStorage: admin.storage(),
    adminAuth: admin.auth(),
  };
}
