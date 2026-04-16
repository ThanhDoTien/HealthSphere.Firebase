'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getAiCacheUrl } from '@/firebase/storage/utils';
import { initializeFirebase } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuggestImageProps {
  name: string;
  prompt: string;
  className?: string;
}

/**
 * Hàm hỗ trợ băm (Hash) chuỗi để dùng làm tên file
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

// Biến đóng vai trò "khóa" toàn cục trong một phiên làm việc để tránh gọi API trùng lặp cho cùng một hash
const inProgressGens = new Set<string>();

// Bộ nhớ đệm trong RAM để hiển thị ảnh ngay lập tức nếu đã tải một lần trong phiên này
const memoryCache = new Map<string, string>();

export default function SuggestImage({ name, prompt, className }: SuggestImageProps) {
  // Khởi tạo state từ memoryCache nếu có để tránh hiện loading flash
  const [imgSrc, setImgSrc] = useState<string | null>(() => memoryCache.get(prompt) || null);
  const [isLoading, setIsLoading] = useState(!memoryCache.has(prompt));

  useEffect(() => {
    let isMounted = true;

    async function handleImageLogic() {
      if (!prompt) return;
      
      // Nếu đã có trong memory cache, hiển thị ngay không cần chạy logic async
      if (memoryCache.has(prompt)) {
        setImgSrc(memoryCache.get(prompt) || null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      // 1. Kiểm tra Global Cache trước
      let currentUrl = await getAiCacheUrl(prompt);
      
      if (!isMounted) return;

      if (currentUrl) {
        if (isMounted) {
          setImgSrc(currentUrl);
          memoryCache.set(prompt, currentUrl); // Lưu vào memory cache
          setIsLoading(false);
        }
      } else {
        // 2. Cache Miss: Gọi API Server để Gemini 3.1 tạo ảnh mới
        try {
          const hash = hashString(prompt);
          
          // Kiểm tra xem có ai khác đang tạo ảnh này chưa (tránh racing condition)
          if (inProgressGens.has(hash)) {
            console.log(`⏳ [Gemini 3.1] Waiting for parallel generation: ${hash}`);
            // Đợi một chút rồi kiểm tra lại cache
            for (let i = 0; i < 10; i++) { 
              await new Promise(r => setTimeout(r, 2000));
              const retryUrl = await getAiCacheUrl(prompt);
              if (retryUrl && isMounted) {
                setImgSrc(retryUrl);
                memoryCache.set(prompt, retryUrl); // Lưu vào memory cache
                setIsLoading(false);
                return;
              }
            }
          }

          inProgressGens.add(hash);
          
          // Thêm jitter (độ rễ ngẫu nhiên 0-2s) để tránh việc nhiều ảnh gọi API cùng lúc gây lỗi 503
          const jitter = Math.random() * 2000;
          await new Promise(resolve => setTimeout(resolve, jitter));

          console.log(`🎨 [Gemini 3.1] Generating: ${name}`);
          
          const response = await fetch('/api/ai/cache-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, hash }),
          });

          if (response.ok && isMounted) {
            // Sau khi tạo xong, lấy lại URL từ Storage
            const newUrl = await getAiCacheUrl(prompt);
            if (newUrl) {
              setImgSrc(newUrl);
              memoryCache.set(prompt, newUrl); // Lưu vào memory cache
            }
          }
          
          inProgressGens.delete(hash);
        } catch (error) {
          const hash = hashString(prompt);
          inProgressGens.delete(hash);
          console.error('⚠️ [Image Generation Failed]:', error);
        } finally {
          if (isMounted) setIsLoading(false);
        }
      }
    }

    handleImageLogic();

    return () => {
      isMounted = false;
    };
  }, [prompt, name]);

  return (
    <div className={cn("relative bg-muted overflow-hidden", className)}>
      {isLoading && !memoryCache.has(prompt) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 backdrop-blur-sm z-10 p-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-xs font-medium text-primary animate-pulse">
            HealthSphere AI đang vẽ minh họa...
          </p>
        </div>
      )}
      
      {imgSrc && (
        <Image
          src={imgSrc}
          alt={name}
          fill
          className={cn(
            "object-cover",
            !memoryCache.has(prompt) && "transition-opacity duration-500",
            !memoryCache.has(prompt) && isLoading ? 'opacity-0' : 'opacity-100'
          )}
          unoptimized
          priority={memoryCache.has(prompt)}
          onError={() => {
            // Nếu link bị lỗi (vd: can't reach AI), có thể chuyển sang placeholder local ở đây
            console.warn('Image load error for:', name);
          }}
        />
      )}
    </div>
  );
}
