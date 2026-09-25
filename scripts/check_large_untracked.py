import subprocess
import os

res = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True)
untracked = []
modified = []
for line in res.stdout.splitlines():
    status = line[:2]
    filename = line[3:].strip().strip('"')
    # handle escaped octal in filename if any
    if status == "??":
        untracked.append(filename)
    else:
        modified.append(filename)

print(f"Modified files count: {len(modified)}")
print(f"Untracked files count: {len(untracked)}")

large_untracked = []
for u in untracked:
    if os.path.isfile(u):
        sz = os.path.getsize(u)
        if sz > 10 * 1024 * 1024:
            large_untracked.append((u, sz / (1024*1024)))
    elif os.path.isdir(u):
        for root, dirs, files in os.walk(u):
            for f in files:
                fp = os.path.join(root, f)
                sz = os.path.getsize(fp)
                if sz > 10 * 1024 * 1024:
                    large_untracked.append((fp, sz / (1024*1024)))

print(f"Large untracked files (> 10MB): {len(large_untracked)}")
for fp, sz in large_untracked:
    print(f"  {fp}: {sz:.2f} MB")
