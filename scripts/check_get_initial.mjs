// scripts/check_get_initial.mjs
import fs from 'fs';
import path from 'path';

function checkFile(f) {
  if (!fs.existsSync(f)) {
    console.log(`[${f}] does not exist`);
    return;
  }
  const raw = fs.readFileSync(f, 'utf8');
  const list = JSON.parse(raw);
  const swu = list.find(e => e.id === 'UNIV-2025-서울여자대학교-산업디자인학과');
  if (swu) {
    console.log(`[${f}] SWU found:`, {
      id: swu.id,
      status: swu.status,
      isResearched: swu.isResearched,
      posterPath: swu.posterPath,
      filterPass: (swu.status === "published" || swu.status === "완료" || swu.status === "리서치 완료") &&
                  swu.isResearched === true &&
                  Boolean(swu.posterPath && swu.posterPath.length > 5)
    });
  } else {
    console.log(`[${f}] SWU NOT found`);
  }
}

checkFile('data/published/exhibitions.json');
checkFile('web/data/published/exhibitions.json');
checkFile('web/data/exhibitions.json');
