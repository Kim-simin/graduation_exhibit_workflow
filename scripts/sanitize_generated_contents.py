import json
import os

def check_and_sanitize():
    paths = [
        os.path.abspath("data/generated_contents.json"),
        os.path.abspath("my-exhibit-platform/data/generated_contents.json")
    ]
    
    for p in paths:
        if not os.path.exists(p):
            print(f"File not found: {p}")
            continue
        with open(p, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        modified = False
        for c in data.get("contents", []):
            if "research_ids" not in c or not isinstance(c["research_ids"], list):
                c["research_ids"] = []
                modified = True
            if "keywords" not in c or not isinstance(c["keywords"], list):
                c["keywords"] = []
                modified = True
            if "hashtags" not in c or not isinstance(c["hashtags"], list):
                c["hashtags"] = []
                modified = True
            if "objective" not in c:
                c["objective"] = "산학 연구 및 졸업작품 연계 콘텐츠"
                modified = True
            if "engagement_strategy" not in c:
                c["engagement_strategy"] = {"share": "", "save": "", "retention": ""}
                modified = True
            if "structure" not in c:
                c["structure"] = []
                modified = True
            if "visual_direction" not in c:
                c["visual_direction"] = ""
                modified = True
            if "asset_requirements" not in c:
                c["asset_requirements"] = []
                modified = True
                
        if modified:
            with open(p, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"Sanitized and saved: {p}")
        else:
            print(f"Already clean: {p}")

if __name__ == "__main__":
    check_and_sanitize()
