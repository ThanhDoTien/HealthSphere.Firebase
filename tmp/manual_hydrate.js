const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// 1. Tải cấu hình từ .env
dotenv.config();

const saString = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!saString) {
  console.error('❌ Không tìm thấy FIREBASE_SERVICE_ACCOUNT trong .env');
  process.exit(1);
}

const serviceAccount = JSON.parse(saString);

// 2. Khởi tạo Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "studio-8164753205-5553c.firebasestorage.app"
});

const bucket = admin.storage().bucket();

// Danh sách ảnh mẫu chất lượng cao (đã có sẵn link dự phòng ổn định)
const seeds = [
  { hash: '4ebe86f9', url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=800' }, // Breakfast
  { hash: '293e5616', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800' }, // Lunch
  { hash: '28156dff', url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=800' }, // Dinner
  { hash: '37530066', url: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&q=80&w=800' }  // Snack
];

async function hydrate() {
  console.log('🚀 Bắt đầu nạp ảnh chất lượng cao vào Storage...');
  
  for (const item of seeds) {
    try {
      console.log(`Đang nạp ${item.hash}...`);
      const res = await fetch(item.url);
      const buffer = Buffer.from(await res.arrayBuffer());
      const file = bucket.file(`images/ai/cache/${item.hash}.png`);
      
      await file.save(buffer, {
        metadata: { contentType: 'image/png' }
      });
      console.log(`✅ Đã lưu: ${item.hash}.png`);
    } catch (e) {
      console.error(`❌ Lỗi khi nạp ${item.hash}:`, e.message);
    }
  }
  console.log('💎 Hoàn tất! Bây giờ bạn hãy F5 lại Dashboard.');
  process.exit(0);
}

hydrate();
