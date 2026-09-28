import json
import os
import sys

def main():
    src_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'curriculums.json')
    dest_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'my-exhibit-platform', 'data', 'curriculums.json')
    
    print(f"Reading from {src_path}")
    with open(src_path, 'r', encoding='utf-8') as f:
        src_data = json.load(f)
        
    print(f"Loaded {len(src_data)} curriculums from source.")
    for item in src_data:
        assert 'grade_tech_tree' in item, f"Missing grade_tech_tree in {item.get('id')}"
        assert len(item['grade_tech_tree']) == 4, f"Expected 4 grades in {item.get('id')}"
        
    with open(dest_path, 'w', encoding='utf-8') as f:
        json.dump(src_data, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully synced {len(src_data)} curriculums to {dest_path}")
    
    # Verify destination file
    with open(dest_path, 'r', encoding='utf-8') as f:
        dest_data = json.load(f)
    assert len(dest_data) == len(src_data)
    print("Verification passed! Both files have valid JSON and equal record count.")

if __name__ == '__main__':
    main()
