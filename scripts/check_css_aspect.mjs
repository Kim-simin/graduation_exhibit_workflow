// scripts/check_css_aspect.mjs
import fs from 'fs';

const cssFiles = ['web/app/archive.css', 'web/app/globals.css', 'web/app/industry.css'];
for (const f of cssFiles) {
  if (fs.existsSync(f)) {
    const text = fs.readFileSync(f, 'utf8');
    const matches = text.match(/(\.grad-artwork-image[^{]*\{[^}]*\})|(\.grad-project-image[^{]*\{[^}]*\})|(\.grad-poster[^{]*\{[^}]*\})/g);
    if (matches) {
      console.log(`=== ${f} ===`);
      matches.forEach(m => console.log(m));
    }
  }
}
