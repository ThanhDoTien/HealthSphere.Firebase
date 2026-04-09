// ==========================================
// FILE: src/firebase/index.ts
// MỤC ĐÍCH: Khởi tạo và Quản lý kết nối Firebase (Firebase Configuration Entry)
// TỔNG QUAN CHỨC NĂNG: Đây là trái tim của hệ thống cơ sở dữ liệu. Nó sử dụng mô hình 
// Singleton để đảm bảo ứng dụng chỉ tạo ra đúng MỘT kết nối chung tới server Firebase,
// tránh rò rỉ bộ nhớ (memory leaks) mỗi khi người dùng chuyển trang.
// ==========================================

'use client'; // Chạy ở Client Side (Trình duyệt)

import { firebaseConfig } from '@/firebase/config';

// Import Các hàm lõi từ App (Kết nối chính)
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';

// Import các Module dịch vụ lẻ tẻ của Firebase
import { getAuth } from 'firebase/auth'; // Authentication (Đăng nhập/Đăng ký)
import { getFirestore } from 'firebase/firestore'; // Database (NoSQL lưu trữ liệu)
import { getStorage } from 'firebase/storage'; // Storage (Lưu trữ ảnh avatar/đồ ăn)
import { getAnalytics } from 'firebase/analytics'; // Theo dõi lượt truy cập

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
// Hàm khởi tạo chính: Được gọi mỗi khi ứng dụng bật lên
export function initializeFirebase() {
  // Pattern Singleton: Kiểm tra xem số lượng App đang chạy có phải là chưa có ai không? (length == 0)
  if (!getApps().length) {
    let firebaseApp;
    try {
      // Đầu tiên cố gắng chạy kết nối với biến môi trường mặc định có sẵn trên Server Google
      firebaseApp = initializeApp();
    } catch (e) {
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      // Khối Catch: Thường chạy ở môi trường Máy Cục Bộ (Localhost).
      // Nếu không thấy file môi trường (env), kéo cấu hình thủ công định nghĩa trong file /src/firebase/config.ts vào.
      firebaseApp = initializeApp(firebaseConfig);
    }

    // Trả về bộ khóa đã được khởi tạo
    return getSdks(firebaseApp);
  }

  // Nếu Firebase đã được khởi tạo trước đó rồi (ví dụ reload component), 
  // chỉ cần lấy lại App cũ (getApp()) thay vì kết nối mới. 
  return getSdks(getApp());
}

// Đóng gói các cục dịch vụ (SDKs) thành 1 object bự gọn gàng
export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp, // App Gốc
    auth: getAuth(firebaseApp), // Trả về Dịch vụ Xác thực người dùng
    firestore: getFirestore(firebaseApp), // Trả về Dịch vụ Data Base
    storage: getStorage(firebaseApp), // Trả về Dịch vụ Cloud Ảnh
    // Analytics gặp vấn đề là nó dùng `window` để đo, mà môi trường Server (SSR) thì không có trình duyệt.
    // Việc kiểm tra != 'undefined' giúp code không bị crash khi build bằng Next.js
    analytics: typeof window !== 'undefined' ? getAnalytics(firebaseApp) : null
  };
}

// Export hàng loạt (Re-export) các hooks dự án tự làm dựa trên Firebase core
export * from './provider'; // Provider bọc quanh app
export * from './firestore/use-collection'; // Lấy cả bảng dữ liệu
export { useDoc, type UseDocResult } from './firestore/use-doc'; // Lấy một dòng dữ liệu lẻ
export * from './auth/use-user'; // Lấy dữ liệu profile của User đang login
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
