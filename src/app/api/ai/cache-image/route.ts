import { NextRequest, NextResponse } from 'next/server';
import { initializeAdmin } from '@/firebase/admin';

/**
 * API Route: Sử dụng Gemini 3.1 Flash Image thông qua REST API 
 * để tạo ảnh và lưu vào Firebase Storage.
 */
export async function POST(req: NextRequest) {
  try {
    const { prompt, hash } = await req.json();

    if (!prompt || !hash) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ [Gemini 3.1 Error]: GEMINI_API_KEY is missing in .env');
      return NextResponse.json({ error: 'Missing API Key' }, { status: 500 });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`;

    let aiResponse;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`🎨 [Gemini 3.1] Attempt ${attempts}/${maxAttempts} for: ${hash}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // Giới hạn 60s cho mỗi lần gọi

      try {
        aiResponse = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `${prompt}, simple realistic photo` }]
            }],
            generationConfig: {
              responseModalities: ["IMAGE"]
            }
          }),
          cache: 'no-store',
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (aiResponse.status === 503) {
          if (attempts < maxAttempts) {
            console.warn(`⏳ [Gemini 3.1] Server busy (503). Retrying in 2s...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
        }
        
        if (!aiResponse.ok) {
          const errorData = await aiResponse.json().catch(() => ({}));
          console.error(`❌ [Gemini 3.1 API Error] Attempt ${attempts}:`, JSON.stringify(errorData, null, 2));
          if (attempts < maxAttempts) {
            console.warn(`⏳ [Gemini 3.1] Request failed. Retrying...`);
            continue;
          }
        }

        break; // Thành công hoặc đã hết lượt thử
      } catch (err: any) {
        clearTimeout(timeoutId);
        console.error(`⚠️ [Gemini 3.1 Network Error] Attempt ${attempts}:`, err.name === 'AbortError' ? 'Timeout 60s' : err.message);
        
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        return NextResponse.json({ error: 'AI Request Timeout. Please try again.' }, { status: 504 });
      }
    }

    if (!aiResponse || !aiResponse.ok) {
      return NextResponse.json({ 
        error: 'AI Model is currently overloaded or unresponsive. Please try again later.',
      }, { status: aiResponse?.status || 500 });
    }

    const data = await aiResponse.json();
    
    // Tìm phần dữ liệu ảnh trong response
    const imagePart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    if (!imagePart) {
      console.error('❌ [Gemini 3.1 Error]: Không tìm thấy dữ liệu ảnh trong phản hồi');
      return NextResponse.json({ error: 'AI failed to generate image data' }, { status: 500 });
    }

    const base64Data = imagePart.inlineData.data;
    const buffer = Buffer.from(base64Data, 'base64');
    console.log(`✨ [Gemini 3.1] Success! Generated ${buffer.length} bytes`);

    // 2. Khởi tạo Admin SDK và lưu vào Storage
    const { adminStorage } = initializeAdmin();
    const bucket = adminStorage.bucket();
    const file = bucket.file(`images/ai/cache/${hash}.png`);

    await file.save(buffer, {
      metadata: {
        contentType: 'image/png',
        cacheControl: 'public, max-age=31536000',
      },
    });

    console.log(`✅ [Cache Success] Image saved: ${hash}.png`);
    return NextResponse.json({ success: true, path: `images/ai/cache/${hash}.png` });

  } catch (error: any) {
    console.error('❌ [Gemini 3.1 API Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
