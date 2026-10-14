// scripts/debug_html.mjs
import fs from 'fs';

const urlA = "http://localhost:3000/exhibit/" + encodeURIComponent("UNIV-2025-서울여자대학교-산업디자인학과");
const urlB = "http://localhost:3001/exhibit/" + encodeURIComponent("UNIV-2025-서울여자대학교-산업디자인학과");

async function check(url, label) {
  try {
    const res = await fetch(url);
    console.log(`[${label}] status: ${res.status}`);
    const text = await res.text();
    console.log(`[${label}] length: ${text.length}`);
    console.log(`[${label}] has artwork-0: ${text.includes('artwork-0')}`);
    console.log(`[${label}] has Upwell: ${text.includes('Upwell')}`);
    console.log(`[${label}] snippet:`, text.slice(0, 500));
  } catch (e) {
    console.log(`[${label}] error: ${e.message}`);
  }
}

await check(urlA, 'Port 3000');
await check(urlB, 'Port 3001');
