import urllib.request
import ssl
import json
import re
from bs4 import BeautifulSoup

def preview_all_projects():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    headers = {'User-Agent': 'Mozilla/5.0'}

    # Track mapping:
    # 1-30: df -> DIGITAL FABRICATION과
    # 31-40: ux -> UX DESIGN과
    # 41-46: bx -> BX DESIGN과

    results = []

    for pid in range(1, 47):
        if 1 <= pid <= 30:
            track_name = "Digital Fabrication"
            dept_name = "DIGITAL FABRICATION과"
        elif 31 <= pid <= 40:
            track_name = "UX Design"
            dept_name = "UX DESIGN과"
        else:
            track_name = "BX Design"
            dept_name = "BX DESIGN과"

        url = f"https://swuid2025.com/project/{pid}"
        try:
            req = urllib.request.Request(url, headers=headers)
            html = urllib.request.urlopen(req, context=ctx).read().decode('utf-8')
            soup = BeautifulSoup(html, 'html.parser')

            # 1. Title from H1
            h1 = soup.find('h1')
            title = h1.get_text(strip=True) if h1 else f"Project {pid}"

            # 2. Paragraphs
            paragraphs = [p.get_text(strip=True) for p in soup.find_all('p') if p.get_text(strip=True)]
            
            # Description is usually the first paragraph or paragraphs before designer
            desc_candidates = [p for p in paragraphs if '@' not in p and 'Copyright' not in p and '©' not in p]
            
            # Find designer info
            # In HTML: Designer heading is followed by student name(s) and email(s)
            # Let's inspect designer elements
            designer_section = soup.find(lambda t: t.name in ['h2', 'h3', 'h4', 'span', 'p'] and 'Designer' in t.get_text())
            student_names = ""
            if designer_section:
                # find siblings or parent's texts
                parent = designer_section.parent
                p_texts = [p.get_text(strip=True) for p in parent.find_all('p')]
                # names are typically non-email text
                name_list = []
                for pt in p_texts:
                    if '@' not in pt and 'Designer' not in pt and 'Copyright' not in pt and '©' not in pt and pt != title:
                        name_list.append(pt)
                if name_list:
                    student_names = ", ".join(name_list)

            # Fallback for student_names: look in paragraphs
            if not student_names:
                for idx, p in enumerate(paragraphs):
                    if '@' in p and idx > 0:
                        prev_p = paragraphs[idx - 1]
                        if prev_p not in desc_candidates[:1]:
                            student_names = prev_p

            desc = desc_candidates[0] if desc_candidates else f"2025 서울여자대학교 산업디자인학과 {track_name} 트랙 출품작 《{title}》"

            results.append({
                "id": pid,
                "track": track_name,
                "department": dept_name,
                "title": title,
                "student_name": student_names,
                "desc_preview": desc[:120],
                "all_paragraphs": paragraphs
            })
            print(f"Processed {pid}/46: {title} | {student_names}")

        except Exception as e:
            print(f"Error {pid}: {e}")

    with open('all_46_parsed_preview.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    preview_all_projects()
