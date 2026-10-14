async function checkClientBundle() {
  console.log("Checking client bundle from http://localhost:3000/mentoring/projects/proj-grad-exhibit-platform...");
  const res = await fetch("http://localhost:3000/mentoring/projects/proj-grad-exhibit-platform");
  const html = await res.text();
  const scriptMatches = [...html.matchAll(/src="(\/_next\/static\/[^"]+)"/g)].map((m) => m[1]);
  console.log(`Found ${scriptMatches.length} script chunks in rendered page.`);

  let foundUrl = false;
  let foundKey = false;

  for (const src of scriptMatches) {
    const chunkRes = await fetch("http://localhost:3000" + src);
    const chunkJs = await chunkRes.text();
    if (chunkJs.includes("txjnpbshcygfrlhtymsm")) {
      console.log(`✅ [FOUND SUPABASE URL] in chunk: ${src}`);
      foundUrl = true;
    }
    if (chunkJs.includes("sb_publishable_mwGoRRabFv9nXrDeJcW6RA_UeTmWwMu")) {
      console.log(`✅ [FOUND SUPABASE KEY] in chunk: ${src}`);
      foundKey = true;
    }
  }

  if (foundUrl && foundKey) {
    console.log("🎉 SUCCESS: Next.js dev server has properly injected the Supabase URL and Publishable Key into the browser client bundle!");
  } else {
    console.warn("⚠️ Warning: Client bundle did not contain the environment variables. They might be in a lazy-loaded chunk.");
  }
}

checkClientBundle().catch(console.error);
