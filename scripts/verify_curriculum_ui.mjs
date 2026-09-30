async function checkUrl(url) {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const hasAdminText = html.includes("관리자 관제 시스템");
    console.log(`[Verification] URL: ${url} -> Has '관리자 관제 시스템': ${hasAdminText}`);
  } catch (err) {
    console.error(`[Error] Failed to fetch ${url}:`, err.message);
  }
}

async function run() {
  await checkUrl("http://localhost:3000/curriculums");
  await checkUrl("http://localhost:3000/professors");
}

run();
