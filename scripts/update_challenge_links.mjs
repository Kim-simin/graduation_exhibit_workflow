import fs from "fs";
import path from "path";

const filePath = path.resolve("my-exhibit-platform/data/industry_challenges.json");
const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

// 1. Parent Challenges URLs
const parentUrls = {
  "parent-shipbuilding": {
    officialUrl: "https://www.usg.ac.kr/",
    providerUrl: "https://www.hd-hyundai.com/"
  },
  "parent-smart-hospital": {
    officialUrl: "https://www.khidi.or.kr/",
    providerUrl: "https://www.amc.seoul.kr/"
  },
  "parent-smart-city": {
    officialUrl: "https://dscu.ac.kr/",
    providerUrl: "https://www.hdec.kr/"
  }
};

data.parentChallenges = data.parentChallenges.map((p) => {
  const urls = parentUrls[p.id] || {};
  return {
    ...p,
    officialUrl: urls.officialUrl || "https://www.rnd.or.kr/",
    providerUrl: urls.providerUrl || "https://www.ntis.go.kr/"
  };
});

// 2. Challenge specific links
const challengeUrlMap = {
  "challenge-shipbuilding-llm": {
    officialUrl: "https://www.hd-hyundai.com/innovation/digital",
    providerUrl: "https://www.hd-hyundai.com/",
    regionUrl: "https://naoe.pusan.ac.kr/",
    applicationUrl: "/rfp/submit?challengeId=challenge-shipbuilding-llm",
    resourceUrls: {
      "res-ship-01": "https://aihub.or.kr/aihubdata/data/view.do?currMenu=115&topMenu=100&aihubDataSe=realm&dataSetSn=71452",
      "res-ship-02": "https://www.kipris.or.kr/",
      "res-ship-03": "https://www.hd-hyundai.com/brand/ci"
    }
  },
  "challenge-shipbuilding-safety-iot": {
    officialUrl: "https://www.samsungshi.com/Kor/business/esg_safety.aspx",
    providerUrl: "https://www.samsungshi.com/",
    regionUrl: "https://www.ulsan.ac.kr/",
    applicationUrl: "/rfp/submit?challengeId=challenge-shipbuilding-safety-iot",
    resourceUrls: {
      "res-iot-01": "https://www.zeus.go.kr/",
      "res-iot-02": "https://data.go.kr/data/15082476/fileData.do"
    }
  },
  "challenge-shipbuilding-dashboard": {
    officialUrl: "https://www.ksoe.co.kr/business/digital",
    providerUrl: "https://www.ksoe.co.kr/",
    regionUrl: "https://www.usg.ac.kr/",
    applicationUrl: "/rfp/submit?challengeId=challenge-shipbuilding-dashboard",
    resourceUrls: {
      "res-dash-01": "https://aihub.or.kr/aihubdata/data/view.do?currMenu=115&topMenu=100&aihubDataSe=realm&dataSetSn=71441",
      "res-dash-02": "https://www.kosha.or.kr/"
    }
  },
  "challenge-ocean-cruise-branding": {
    officialUrl: "https://bto.or.kr/kor/CMS/Board/Board.do?mCode=MN019",
    providerUrl: "https://bto.or.kr/",
    regionUrl: "https://www.usg.ac.kr/",
    applicationUrl: "https://bto.or.kr/kor/CMS/Board/Board.do?mCode=MN019",
    resourceUrls: {
      "res-cruise-01": "https://www.busan.go.kr/bhintro"
    }
  },
  "challenge-hospital-fall-monitoring": {
    officialUrl: "https://www.amc.seoul.kr/research/",
    providerUrl: "https://www.lunit.io/ko",
    regionUrl: "https://www.khidi.or.kr/",
    applicationUrl: "/rfp/submit?challengeId=challenge-hospital-fall-monitoring",
    resourceUrls: {
      "res-hosp-01": "https://aihub.or.kr/aihubdata/data/view.do?currMenu=115&topMenu=100&aihubDataSe=realm&dataSetSn=71477",
      "res-hosp-02": "https://www.kipris.or.kr/"
    }
  },
  "challenge-chronic-care-lifelog": {
    officialUrl: "https://www.yuhan.co.kr/RND/Pipeline/",
    providerUrl: "https://www.yuhan.co.kr/",
    regionUrl: "https://medicine.catholic.ac.kr/",
    applicationUrl: "/rfp/submit?challengeId=challenge-chronic-care-lifelog",
    resourceUrls: {
      "res-care-01": "https://www.data.go.kr/data/15000561/openapi.do",
      "res-care-02": "https://aihub.or.kr/aihubdata/data/view.do?currMenu=115&topMenu=100&aihubDataSe=realm&dataSetSn=71398"
    }
  },
  "challenge-isolation-robot-interface": {
    officialUrl: "https://www.hyundai-robotics.com/product/product_list.html?cate=service",
    providerUrl: "https://www.hyundai-robotics.com/",
    regionUrl: "https://anam.kumc.or.kr/",
    applicationUrl: "/rfp/submit?challengeId=challenge-isolation-robot-interface",
    resourceUrls: {
      "res-robot-01": "https://www.zeus.go.kr/",
      "res-robot-02": "https://www.kdca.go.kr/"
    }
  },
  "challenge-bems-energy-optimization": {
    officialUrl: "https://www.hdec.kr/kr/esg/sustainability.aspx",
    providerUrl: "https://www.hdec.kr/",
    regionUrl: "https://dscu.ac.kr/",
    applicationUrl: "/rfp/submit?challengeId=challenge-bems-energy-optimization",
    resourceUrls: {
      "res-bems-01": "https://data.go.kr/data/15082103/fileData.do",
      "res-bems-02": "https://www.kipris.or.kr/"
    }
  },
  "challenge-battery-recycling-safety": {
    officialUrl: "https://www.skecoplant.com/business/eco-circuler",
    providerUrl: "https://www.skecoplant.com/",
    regionUrl: "https://cbe.kaist.ac.kr/",
    applicationUrl: "/rfp/submit?challengeId=challenge-battery-recycling-safety",
    resourceUrls: {
      "res-battery-01": "https://www.kist.re.kr/",
      "res-battery-02": "https://aihub.or.kr/aihubdata/data/view.do?currMenu=115&topMenu=100&aihubDataSe=realm&dataSetSn=71412"
    }
  },
  "challenge-uam-vertiport-space-ux": {
    officialUrl: "https://www.hanwhasystems.com/kr/business/new_business/uam.do",
    providerUrl: "https://www.hanwhasystems.com/",
    regionUrl: "https://grad.hongik.ac.kr/",
    applicationUrl: "/rfp/submit?challengeId=challenge-uam-vertiport-space-ux",
    resourceUrls: {
      "res-uam-01": "https://www.hanwhasystems.com/kr/business/new_business/uam.do",
      "res-uam-02": "https://www.molit.go.kr/"
    }
  },
  "challenge-local-esg-smart-market": {
    officialUrl: "https://ccei.creativekorea.or.kr/chungnam/",
    providerUrl: "https://www.kosmes.or.kr/",
    regionUrl: "https://ccei.creativekorea.or.kr/chungnam/",
    applicationUrl: "/rfp/submit?challengeId=challenge-local-esg-smart-market",
    resourceUrls: {
      "res-local-01": "https://www.data.go.kr/"
    }
  }
};

data.challenges = data.challenges.map((c) => {
  const mapping = challengeUrlMap[c.id] || {};
  const updatedResources = (c.resources || []).map((r) => {
    const resUrl = mapping.resourceUrls && mapping.resourceUrls[r.id];
    return {
      ...r,
      url: resUrl || r.url || "https://www.data.go.kr/"
    };
  });

  return {
    ...c,
    officialUrl: mapping.officialUrl || "https://www.ntis.go.kr/",
    providerUrl: mapping.providerUrl || "https://www.rnd.or.kr/",
    regionUrl: mapping.regionUrl || "https://www.usg.ac.kr/",
    applicationUrl: mapping.applicationUrl || `/rfp/submit?challengeId=${encodeURIComponent(c.id)}`,
    resources: updatedResources
  };
});

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
console.log(`[SUCCESS] Updated ${data.challenges.length} challenges with official links in ${filePath}`);
