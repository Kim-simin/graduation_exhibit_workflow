"""Fail-closed student R&D recruitment checks shared by all opportunity imports.

Flags are derived from retained official evidence, never copied from a discovery
portal or inferred from an R&D project title. This module does not fetch evidence.
"""

import re
from datetime import datetime, timedelta, timezone
from urllib.parse import urlsplit

from research.opportunity_sources import (
    KNOWN_RESEARCH_INSTITUTE_DOMAINS, OPPORTUNITY_SOURCES, normalize_source_url,
)

KST = timezone(timedelta(hours=9))
AUDIENCE_TOKENS = ("대학생", "학부생", "재학생", "학부연구생", "학생연구원", "연구인턴", "근로연구학생")
STUDENT_PATTERN = re.compile(r"대학생|학부생|학부연구생|학부연구원|대학재학생|undergraduate", re.I)
EXCLUDED_PATTERN = re.compile(r"(?:대학생|학부생|학부연구생|학부연구원|대학재학생|undergraduate).{0,12}(?:지원불가|제외|불가|아님|지원할수없|참여할수없|모집하지않)", re.I)
RECRUITMENT_PATTERN = re.compile(r"모집|접수|지원|채용|recruit|application", re.I)
ROLLING_PATTERN = re.compile(r"상시|수시|채용\s*시|충원\s*시", re.I)


def parse_date(value, *, end_of_day=False):
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}(?:T.*)?", value):
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}", value) and end_of_day:
            parsed = parsed.replace(hour=23, minute=59, second=59, microsecond=999000)
        return parsed.replace(tzinfo=KST) if parsed.tzinfo is None else parsed
    except ValueError:
        return None


def recruitment_status(opportunity, now=None):
    now = now or datetime.now(KST)
    now = now.replace(tzinfo=KST) if now.tzinfo is None else now
    if opportunity.get("recruitmentStatus") == "CLOSED" or opportunity.get("status") == "CLOSED":
        return "CLOSED"
    evidence = opportunity.get("recruitmentEvidence") or {}
    if not isinstance(evidence, dict) or not isinstance(evidence.get("recruitmentText"), str) or not RECRUITMENT_PATTERN.search(evidence["recruitmentText"]):
        return "UNKNOWN"
    start_raw, end_raw = opportunity.get("recruitmentStartAt"), opportunity.get("recruitmentEndAt")
    start, end = parse_date(start_raw), parse_date(end_raw, end_of_day=True)
    if (start_raw and not start) or (end_raw and not end) or (start and end and start > end):
        return "UNKNOWN"
    if end and now > end:
        return "CLOSED"
    if start and now < start:
        return "UPCOMING"
    if end:
        return "OPEN"
    checked = parse_date(evidence.get("verifiedAt"))
    if (evidence.get("rollingAdmission") is True and ROLLING_PATTERN.search(evidence.get("recruitmentText", ""))
            and checked and timedelta(0) <= now - checked <= timedelta(days=30)):
        return "OPEN"
    return "UNKNOWN"


def is_official_detail(evidence, now=None):
    now = now or datetime.now(KST)
    if now.tzinfo is None:
        now = now.replace(tzinfo=KST)
    if not isinstance(evidence, dict) or evidence.get("isOfficialDetail") is not True:
        return False
    checked = parse_date(evidence.get("verifiedAt"))
    if not checked or checked > now:
        return False
    try:
        url = normalize_source_url(evidence.get("sourceUrl"))
    except (ValueError, TypeError):
        return False
    parsed = urlsplit(url)
    domain = parsed.hostname or ""
    kind = evidence.get("sourceKind")
    if kind == "NST":
        trusted = domain == "nst.re.kr" or domain.endswith(".nst.re.kr")
    elif kind == "UNIVERSITY_OFFICIAL":
        trusted = domain.endswith(".ac.kr")
    elif kind == "RESEARCH_INSTITUTE_OFFICIAL":
        trusted = any(domain == base or domain.endswith("." + base) for base in KNOWN_RESEARCH_INSTITUTE_DOMAINS)
    else:
        trusted = False
    if not trusted:
        return False
    if any(urlsplit(source["url"]).hostname == domain and urlsplit(source["url"]).path.lower() == parsed.path.lower()
           for source in OPPORTUNITY_SOURCES):
        return False
    if parsed.path in ("", "/") or re.search(r"(?:^|/)(?:index|main)(?:\.[a-z]+)?/?$|list(?:view)?(?:\.[a-z]+)?/?$", parsed.path, re.I):
        return False
    return True


def evaluate_student_rnd(opportunity, now=None):
    evidence = opportunity.get("recruitmentEvidence") or {}
    evidence = evidence if isinstance(evidence, dict) else {}
    audience = opportunity.get("eligibleAudience")
    audience = [entry.strip() for entry in audience if isinstance(entry, str) and entry.strip()] if isinstance(audience, list) else []
    raw_eligibility = evidence.get("eligibilityText")
    eligibility_text = re.sub(r"\s+", "", raw_eligibility) if isinstance(raw_eligibility, str) else ""
    student = (any(any(token in entry for token in AUDIENCE_TOKENS) for entry in audience)
               and bool(STUDENT_PATTERN.search(eligibility_text)) and not EXCLUDED_PATTERN.search(eligibility_text))
    official = is_official_detail(evidence, now)
    status = recruitment_status(opportunity, now)
    reasons = []
    if not student:
        reasons.append("학부생·대학생의 지원자격 원문 확인 필요")
    if not official:
        reasons.append("NST·대학·연구기관의 공식 상세 모집공고 확인 필요")
    if status != "OPEN":
        reasons.append({"CLOSED": "모집 마감", "UPCOMING": "접수 시작 전", "UNKNOWN": "현재 접수 가능 여부 확인 필요"}.get(status, "모집기간 확인 필요"))
    return {
        "eligibleAudience": audience,
        "studentParticipationVerified": bool(student),
        "officialSourceVerified": official,
        "recruitmentStatus": status,
        "verificationReason": "; ".join(reasons) if reasons else "공식 원문에서 학생 참여자격과 현재 모집 확인",
    }


def is_student_rnd_opportunity(opportunity, now=None):
    result = evaluate_student_rnd(opportunity, now)
    return (opportunity.get("type") == "RND" and opportunity.get("approvalStatus") == "PUBLISHED"
            and result["studentParticipationVerified"] and result["officialSourceVerified"]
            and result["recruitmentStatus"] == "OPEN")
