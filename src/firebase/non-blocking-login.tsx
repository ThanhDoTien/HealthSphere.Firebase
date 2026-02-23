'use client';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { toast } from '@/hooks/use-toast';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  // CRITICAL: Call signInAnonymously directly. Do NOT use 'await signInAnonymously(...)'.
  signInAnonymously(authInstance).catch((error) => {
    console.error('Lỗi đăng nhập ẩn danh:', error);
    toast({
        variant: "destructive",
        title: "Lỗi đăng nhập ẩn danh",
        description: "Không thể đăng nhập ẩn danh vào lúc này. Vui lòng thử lại sau.",
    });
  });
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string, fullName: string): void {
  // CRITICAL: Call createUserWithEmailAndPassword directly. Do NOT use 'await createUserWithEmailAndPassword(...)'.
  createUserWithEmailAndPassword(authInstance, email, password)
    .then((userCredential) => {
      if (userCredential.user && fullName) {
        updateProfile(userCredential.user, { displayName: fullName }).catch(err => {
            console.error("Lỗi cập nhật hồ sơ:", err);
        });
      }
    })
    .catch((error) => {
        console.error('Lỗi đăng ký:', error);
        let description = "Đã xảy ra lỗi không xác định. Vui lòng thử lại.";
        switch (error.code) {
            case 'auth/email-already-in-use':
                description = "Email này đã được sử dụng bởi một tài khoản khác.";
                break;
            case 'auth/weak-password':
                description = "Mật khẩu quá yếu. Vui lòng chọn một mật khẩu mạnh hơn (ít nhất 6 ký tự).";
                break;
            case 'auth/invalid-email':
                description = "Địa chỉ email không hợp lệ.";
                break;
            default:
                description = error.message;
        }
        toast({
            variant: "destructive",
            title: "Lỗi đăng ký",
            description: description,
        });
  });
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  // CRITICAL: Call signInWithEmailAndPassword directly. Do NOT use 'await signInWithEmailAndPassword(...)'.
  signInWithEmailAndPassword(authInstance, email, password).catch((error) => {
    console.error('Lỗi đăng nhập:', error);
    let description = "Đã xảy ra lỗi không xác định. Vui lòng thử lại.";
    if (error.code === 'auth/invalid-credential') {
        description = "Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.";
    } else {
        description = error.message;
    }
    toast({
        variant: "destructive",
        title: "Lỗi đăng nhập",
        description: description,
    });
  });
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}
