import json
import os

transcript_path = r"C:\Users\USER\.gemini\antigravity\brain\b230d1db-c8fe-4832-a784-442bd1dddf26\.system_generated\logs\transcript_full.jsonl"

found_count = 0
with open(transcript_path, "r", encoding="utf-8") as f:
    for line in f:
        data = json.loads(line)
        if data.get("type") == "USER_INPUT":
            content = data.get("content", "")
            if "[MASTER PROMPT — 실제 채용정보 × 전공/학과 맞춤 Research & Crawler 전환]" in content:
                found_count += 1
                with open("scripts/master_prompt_extracted.txt", "w", encoding="utf-8") as out:
                    out.write(content)
print(f"Extracted prompt (found {found_count})")
