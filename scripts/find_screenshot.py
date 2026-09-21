import os

search_roots = [
    r"C:\Users\USER\.gemini\antigravity",
    r"C:\Users\USER",
    r"c:\Users\graduation_exhibit_workflow"
]

target = "step_10_scheduler_view.png"

for root in search_roots:
    for dirpath, dirnames, filenames in os.walk(root):
        if target in filenames:
            print("FOUND:", os.path.join(dirpath, target))
            break
        # don't traverse too deep in giant dirs
        if "AppData" in dirpath and "Local" in dirpath and "Google" in dirpath:
            dirnames.clear()
        if "node_modules" in dirpath or ".git" in dirpath:
            dirnames.clear()
