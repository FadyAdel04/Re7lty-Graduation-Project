import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const assetsDir = path.resolve(__dirname, 'public/assets');

async function optimizeImage(filename, width, height) {
  const filePath = path.join(assetsDir, filename);
  const webPath = path.join(assetsDir, filename.replace('.png', '.webp'));
  
  if (fs.existsSync(filePath)) {
    console.log(`Optimizing ${filename}...`);
    await sharp(filePath)
      .resize(width, height, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .webp({ quality: 80 })
      .toFile(webPath);
    console.log(`Saved: ${filename.replace('.png', '.webp')}`);
  }
}

async function run() {
  await optimizeImage('hero-1.png', 750, 750);
  await optimizeImage('hero-2.png', 750, 750);
  await optimizeImage('hero-3.png', 750, 750);
  await optimizeImage('hero-4.png', 750, 750);
  await optimizeImage('logo.png', 200, 200); // Increased logo size slightly for crispness
  console.log("Done optimizing images!");
}

run().catch(console.error);
