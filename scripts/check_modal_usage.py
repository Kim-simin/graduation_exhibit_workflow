import sys

def check_modal():
    with open("my-exhibit-platform/app/admin/page.tsx", "r", encoding="utf-8") as f:
        lines = f.readlines()
    for idx, line in enumerate(lines):
        if "setIsModalOpen" in line:
            print(f"Line {idx+1}: {line.strip()}")

if __name__ == "__main__":
    check_modal()
