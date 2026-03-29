import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const destDir = path.resolve(__dirname, 'public/assets');

const urls = [
  { url: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg', name: 'app-store-badge.svg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg', name: 'google-play-badge.svg' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg', name: 'world-map.svg' }
];

urls.forEach(({ url, name }) => {
  const destPath = path.join(destDir, name);
  const file = fs.createWriteStream(destPath);
  https.get(url, (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded ${name}`);
    });
  }).on('error', (err) => {
    fs.unlink(destPath, () => {});
    console.error(`Error downloading ${name}: ${err.message}`);
  });
});
