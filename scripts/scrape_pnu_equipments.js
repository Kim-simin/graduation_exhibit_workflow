const https = require('https');
const fs = require('fs');

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      rejectUnauthorized: false
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function cleanText(txt) {
  if (!txt) return null;
  const cleaned = txt.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\r/g, '').trim();
  return cleaned.length > 0 ? cleaned : null;
}

function parseTableRows(html) {
  const data = {};
  const rowRegex = /<tr>\s*<td class="c-tit03">([^<]+)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/gi;
  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const key = cleanText(match[1]);
    const val = cleanText(match[2]);
    if (key && val) {
      data[key] = val;
    }
  }
  return data;
}

function parseTabItems(html) {
  const tabs = {};
  const tabRegex = /<div class="tabItem" id="([^"]+)">[\s\S]*?<table class="item-detail">[\s\S]*?<tr>[\s\S]*?<td>([\s\S]*?)<\/td>/gi;
  let match;
  while ((match = tabRegex.exec(html)) !== null) {
    const tabId = match[1];
    const content = cleanText(match[2]);
    if (content) {
      tabs[tabId] = content;
    }
  }
  return tabs;
}

function extractImage(html) {
  const imgRegex = /<div class="equip-imgbox">[\s\S]*?<img[^>]+src="([^"]+)"/i;
  const match = html.match(imgRegex);
  if (match && match[1] && !match[1].includes('no_thum.gif')) {
    if (match[1].startsWith('http')) return match[1];
    return 'https://labcenter.pusan.ac.kr' + match[1];
  }
  return null;
}

async function scrapeAll() {
  const listUrl = 'https://labcenter.pusan.ac.kr/kor/CMS/EquipInfoMgr/list.do?mCode=MN086';
  console.log('Fetching list page:', listUrl);
  const listHtml = await fetchPage(listUrl);

  const rowRegex = /<tr>\s*<td class="tl pointer" onclick="onView\('([0-9]+)'\)"><strong>([^<]+)<\/strong><br\/>([^<]+)<\/td>[\s\S]*?<td class="tc"[^>]*>([\s\S]*?)<\/td>[\s\S]*?<td class="tc"[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi;

  const items = [];
  let m;
  while ((m = rowRegex.exec(listHtml)) !== null) {
    const keyno = m[1];
    const fullNameRaw = m[2].trim();
    const subInfo = m[3].trim();
    const urgentRaw = cleanText(m[4]);
    const usageRaw = cleanText(m[5]);

    // parse Korean and English names
    let nameKo = fullNameRaw;
    let nameEn = null;
    const nameMatch = fullNameRaw.match(/^(.+?)\s*\((.+)\)$/);
    if (nameMatch) {
      nameKo = nameMatch[1].trim();
      nameEn = nameMatch[2].trim();
    }

    // subInfo e.g. "GEMINI500 / 전자현미경실"
    let model = null;
    let lab = null;
    if (subInfo.includes('/')) {
      const parts = subInfo.split('/').map(s => s.trim());
      model = parts[0] || null;
      lab = parts[1] || null;
    } else {
      model = subInfo;
    }

    items.push({
      keyno,
      nameKo,
      nameEn,
      fullName: fullNameRaw,
      model,
      lab,
      urgent: urgentRaw === '긴급분석 가능',
      usage_method_raw: usageRaw || null
    });
  }

  console.log(`Found ${items.length} items in list.`);

  // Now fetch details for each item with gentle delay
  const fullEquipments = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const detailUrl = `https://labcenter.pusan.ac.kr/kor/CMS/EquipInfoMgr/view.do?mCode=MN086&EQUIP_KEYNO=${it.keyno}`;
    process.stdout.write(`Fetching (${i+1}/${items.length}) keyno=${it.keyno} ... `);
    try {
      const detailHtml = await fetchPage(detailUrl);
      const tableData = parseTableRows(detailHtml);
      const tabData = parseTabItems(detailHtml);
      const imageUrl = extractImage(detailHtml);

      // Usage type classification
      let usageType = 'CONSULTATION_REQUIRED';
      const uRaw = it.usage_method_raw || '';
      if (uRaw.includes('분석의뢰')) {
        usageType = 'ANALYSIS_REQUEST';
      } else if (uRaw.includes('직접이용') || uRaw.includes('직접사용')) {
        usageType = 'DIRECT_USE';
      }

      fullEquipments.push({
        id: `pnu_lab_${it.keyno}`,
        keyno: it.keyno,
        nameKo: it.nameKo,
        nameEn: it.nameEn,
        fullName: it.fullName,
        model: tableData['모델명'] || it.model || null,
        lab: it.lab || null,
        location: tableData['설치장소'] || it.lab || '부산대학교 공동실험실습관',
        installStatus: tableData['설치상태'] || null,
        equipStatus: tableData['장비상태'] || '양호',
        contact: tableData['문의처'] || null,
        operator: tableData['오퍼레이터'] || null,
        usage_method_raw: it.usage_method_raw,
        usage_type: usageType,
        urgentAvailable: it.urgent,
        imageUrl: imageUrl,
        features: tabData['EquipInfo-FEATURE'] || null,
        performance: tabData['EquipInfo-PERFORMANCE'] || null,
        useExample: tabData['EquipInfo-USE_EXAMPLE'] || null,
        useProcedure: tabData['EquipInfo-USE_PROCEDURE'] || null,
        useCost: tabData['EquipInfo-USE_COST'] || null,
        etcNotice: tabData['EquipInfo-ETC_NOTICE'] || null,
        detailUrl: detailUrl,
        fetchedAt: new Date().toISOString()
      });
      console.log('OK');
    } catch (err) {
      console.log('ERROR:', err.message);
    }
    // delay 150ms to be gentle to server
    await new Promise(r => setTimeout(r, 150));
  }

  fs.writeFileSync('scripts/pnu_lab_equipments_scraped.json', JSON.stringify(fullEquipments, null, 2), 'utf-8');
  console.log(`Successfully scraped and saved ${fullEquipments.length} equipments to scripts/pnu_lab_equipments_scraped.json`);
}

scrapeAll().catch(console.error);
