import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

detailed_korean_intro = """2025 서울대학교 디자인과 졸업 전시 WRAP UP은 4년간 모아온 짐을 꾸리는 이사의 현장입니다.
우리는 짐을 선별하고, 상자에 싣고, 테이핑합니다. 숨을 고르고, 땀을 훔치며, 덜컹이는 움직임을 몸소 겪습니다.
이사를 준비하는 손길은 투박하고도 선명합니다. 학부 생활을 차곡이 정리하면서도, 상상하고 손수 만들며 타협하는 열정을 담았기에 그렇습니다. 풀어내려 애쓰던 아이디어와 새출발에 가져갈 다짐과 고민까지 이사 과정에 고스란히 담았습니다.
그렇다면 우리가 감싸맨 이삿짐에는 어떤 것들이 있을까요? 또, 씩씩하게 둘러맨 이삿짐과 함께 향하게 되는 곳은 어디일까요?
몇 년간 들여다보았던 경험과 시간을 WRAP UP한 현장에 여러분을 초대합니다.

WRAP UP, Seoul National University Department of Design's Graduation Exhibition of 2025, unfolds as a moving scene of packing up four years' worth of belongings.
We organize, load the boxes, and tape them shut. While catching our breath and wiping away the sweat, we embrace the rattling inside the boxes as we move them.
The touch of our hands as we put an end to the journey of undergraduate life feels rough and distinct as they bear the passion that imagines and creates. Within this transitioning process lies the ideas we struggled to unravel along with resolutions and concerns we carry forward.
If so, what are the things we've wrapped into these boxes? And where are we heading next with these firmly tied loads alongside us? We kindly invite you to the site of WRAP UP, where the experiences and moments we've collected throughout the years are carefully wrapped."""

headline = "SNU DESIGN WEEK 2025 | WRAP UP"
period = "2025.12.04. - 2025.12.09. (THU - TUE) 10:00 - 18:00"
venue = "서울대학교 49동 & 파워플랜트 (SNU BUILDING 49 & POWERPLANT)"

paths = [
    'data/university_queue.json',
    'my-exhibit-platform/data/university_queue.json'
]

for p in paths:
    with open(p, 'r', encoding='utf-8') as f:
        queue = json.load(f)
    
    found = False
    for item in queue:
        if item.get('id') == 'UNIV-2025-서울대학교-디자인과-snu-design':
            item['curation_summary'] = {
                "headline": headline,
                "curation_intro": detailed_korean_intro
            }
            item['description'] = detailed_korean_intro
            item['exhibition_period'] = period
            item['exhibition_venue'] = venue
            item['slogan'] = "WRAP UP: 4년간 모아온 짐을 꾸리는 이사의 현장"
            item['exhibit_slogan'] = "WRAP UP: 4년간 모아온 짐을 꾸리는 이사의 현장"
            found = True
            print(f"Updated SNU card in {p}")
            break
            
    if found:
        with open(p, 'w', encoding='utf-8') as f:
            json.dump(queue, f, ensure_ascii=False, indent=2)
    else:
        print(f"Card not found in {p}!")

print("Detailed description update completed.")
