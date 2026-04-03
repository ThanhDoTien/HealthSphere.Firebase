const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes } = require('firebase/storage');
const fs = require('fs');
const path = require('path');

const firebaseConfig = {
  "projectId": "studio-8164753205-5553c",
  "storageBucket": "studio-8164753205-5553c.firebasestorage.app",
  "apiKey": "AIzaSyCu_KWlfTZd22RsyKjY5d9ayITU6tv6yJY"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

const images = [
  { name: '4ebe86f9.png', path: 'greek_yogurt_berries_oats_1775214584654.png' },
  { name: '293e5616.png', path: 'grilled_chicken_brown_rice_broccoli_1775214609279.png' },
  { name: '28156dff.png', path: 'pan_seared_salmon_sweet_potato_1775214717714.png' },
  { name: '37530066.png', path: 'protein_smoothie_banana_1775214733996.png' }
];

const artifactsDir = 'C:\\Users\\Thanh PC\\.gemini\\antigravity\\brain\\05004dc3-863b-47e8-893c-b3b8ae692914';

async function upload() {
  for (const img of images) {
    const filePath = path.join(artifactsDir, img.path);
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      continue;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const storageRef = ref(storage, `images/ai/cache/${img.name}`);

    try {
      console.log(`Uploading ${img.name}...`);
      await uploadBytes(storageRef, fileBuffer, { contentType: 'image/png' });
      console.log(`✅ Uploaded ${img.name}`);
    } catch (err) {
      console.error(`❌ Failed to upload ${img.name}:`, err.message);
    }
  }
}

upload().then(() => console.log('Done!'));
