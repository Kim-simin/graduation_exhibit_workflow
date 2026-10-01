"""Official entry points; discovery is never proof of student recruitment."""

from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

STUDENT_RESEARCH_KEYWORDS = (
    "학생연구원", "학부연구생", "학부 연구생", "학부연구원", "연구인턴",
    "학생인턴", "연구실 인턴", "근로연구학생", "학연협동", "연수직", "URP",
    "Undergraduate Research", "학생 연구 참여", "연구 참여 학생 모집",
)

# These are crawl entry points, never publishable recruitment evidence by themselves.
OPPORTUNITY_SOURCES = (
    {"id": "nst", "url": "https://www.nst.re.kr/www/selectBbsNttList.do?bbsNo=19&key=61", "role": "STUDENT_RECRUITMENT_DISCOVERY", "detailSourceKind": "NST", "keywords": STUDENT_RESEARCH_KEYWORDS},
    {"id": "academyinfo", "url": "https://www.academyinfo.go.kr/", "role": "UNIVERSITY_DIRECTORY", "followUp": "공식 대학·학과·연구실·산학협력단·연구지원부서 모집공고", "keywords": STUDENT_RESEARCH_KEYWORDS},
    {"id": "krict", "url": "https://school.krict.re.kr/prog/jobOffer/kor/sub04_04_02/list.do", "role": "STUDENT_RECRUITMENT_DISCOVERY", "detailSourceKind": "RESEARCH_INSTITUTE_OFFICIAL", "keywords": STUDENT_RESEARCH_KEYWORDS},
    {"id": "ictintern", "url": "https://ictintern.or.kr/homepage/notice/noticeList.do", "role": "INTERNSHIP_DISCOVERY", "followUp": "대학 또는 연구기관 공식 상세 모집공고에서 참여자격 재검증"},
    {"id": "ntis_projects", "url": "https://www.ntis.go.kr/ThSearchProjectList.do", "role": "RND_DISCOVERY"},
    {"id": "ntis_announcements", "url": "https://www.ntis.go.kr/rndgate/eg/un/ra/mng.do", "role": "RND_DISCOVERY"},
    {"id": "iris", "url": "https://www.iris.go.kr/contents/retrieveBsnsAncmListView.do", "role": "RND_DISCOVERY"},
    {"id": "uniall_teams", "url": "https://uniall.nrf.re.kr/biz/bizteam/list.do", "role": "COOPERATION_DISCOVERY"},
    {"id": "uniall_announcements", "url": "https://uniall.nrf.re.kr/biz/pbanc/list.do", "role": "COOPERATION_DISCOVERY"},
    {"id": "zeus", "url": "https://www.zeus.go.kr/resv/organ/sortView", "role": "EQUIPMENT_DISCOVERY"},
    {"id": "etube", "url": "https://www.etube.re.kr/", "role": "EQUIPMENT_DISCOVERY"},
    {"id": "kstartup", "url": "https://www.k-startup.go.kr/", "role": "STARTUP_DISCOVERY"},
)

KNOWN_RESEARCH_INSTITUTE_DOMAINS = (
    "krict.re.kr", "kist.re.kr", "kaeri.re.kr", "etri.re.kr", "kisti.re.kr",
    "kribb.re.kr", "kari.re.kr", "kier.re.kr", "kitech.re.kr", "kimm.re.kr",
    "kims.re.kr", "kigam.re.kr", "kriss.re.kr", "kict.re.kr", "krri.re.kr",
    "kfri.re.kr", "kiom.re.kr", "kasi.re.kr", "keri.re.kr", "kbsi.re.kr",
)


def normalize_source_url(value: str) -> str:
    """Accept one plain HTTP(S) URL and remove tracking only, preserving notice IDs."""
    if not isinstance(value, str):
        raise ValueError("source URL must be a string")
    value = value.strip()
    if not value or any(char.isspace() for char in value) or any(char in value for char in "<>[]()`\\"):
        raise ValueError("source URL must be one plain URL, without Markdown")
    parsed = urlsplit(value)
    if parsed.scheme.lower() not in ("http", "https") or not parsed.hostname or parsed.username or parsed.password:
        raise ValueError("source URL must be an HTTP(S) URL without credentials")
    # Reject concatenated URLs rather than silently retaining a broken source.
    if "http://" in value[8:].lower() or "https://" in value[8:].lower():
        raise ValueError("multiple source URLs must be separate records")
    query = [(key, val) for key, val in parse_qsl(parsed.query, keep_blank_values=True)
             if not key.lower().startswith("utm_") and key.lower() not in ("fbclid", "gclid")]
    return urlunsplit((parsed.scheme.lower(), parsed.netloc.lower(), parsed.path or "/", urlencode(query), ""))
