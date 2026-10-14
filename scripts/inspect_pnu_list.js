const https = require('https');
const fs = require('fs');

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      rejectUnauthorized: false
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  const url = 'https://labcenter.pusan.ac.kr/kor/CMS/EquipInfoMgr/list.do?mCode=MN086';
  const html = await fetchPage(url);
  fs.writeFileSync('scripts/pnu_list_sample.html', html, 'utf-8');
  console.log('Saved pnu_list_sample.html, length:', html.length);

  // Analyze pagination and items
  const viewRegex = /href=["']([^"']*view\.do[^"']*)["']/g;
  const links = [];
  let m;
  while ((m = viewRegex.exec(html)) !== null) {
    links.push(m[1]);
  }
  console.log('View links count:', links.length);
  console.log('Sample links:', links.slice(0, 5));

  // Find pagination elements
  const paginationMatch = html.match(/class=["'][^"']*pagination[^"']*["'][\s\S]*?<\/div>/i) ||
                          html.match(/class=["'][^"']*paging[^"']*["'][\s\S]*?<\/div>/i);
  if (paginationMatch) {
    console.log('Pagination HTML:', paginationMatch[0]);
  } else {
    console.log('No pagination class found, searching for page numbers');
    const pageNumMatches = html.match(/page[a-zA-Z_]*=[0-9]+/g);
    console.log('Page num matches:', pageNumMatches);
  }
}

run().catch(console.error);
