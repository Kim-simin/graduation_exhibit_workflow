// scripts/check_image_libraries.mjs
import fs from 'fs';

async function check() {
  try {
    const sharp = (await import('sharp')).default;
    console.log('sharp is available at root or global:', !!sharp);
  } catch (e) {
    console.log('sharp not at root:', e.message);
  }

  try {
    const sharpWeb = (await import('../web/node_modules/sharp/lib/index.js')).default;
    console.log('sharp is available in web/node_modules:', !!sharpWeb);
  } catch (e) {
    console.log('sharp not in web/node_modules:', e.message);
  }

  try {
    const sharpAdmin = (await import('../admin/node_modules/sharp/lib/index.js')).default;
    console.log('sharp is available in admin/node_modules:', !!sharpAdmin);
  } catch (e) {
    console.log('sharp not in admin/node_modules:', e.message);
  }

  // Also check python PIL / Pillow
  console.log('Checking Python PIL / Pillow via package inspection or python script if needed.');
}

check();
