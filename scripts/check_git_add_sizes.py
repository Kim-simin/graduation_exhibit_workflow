import os

def get_dir_size(path):
    total = 0
    count = 0
    max_file = ("", 0)
    for root, dirs, files in os.walk(path):
        for f in files:
            fp = os.path.join(root, f)
            sz = os.path.getsize(fp)
            total += sz
            count += 1
            if sz > max_file[1]:
                max_file = (fp, sz)
    return total, count, max_file

for p in [
    "my-exhibit-platform/public/captures",
    "my-exhibit-platform/public/uploads",
    "data"
]:
    if os.path.exists(p):
        tot, cnt, mx = get_dir_size(p)
        print(f"{p}: {cnt} files, {tot / (1024*1024):.2f} MB, largest: {mx[0]} ({mx[1] / 1024:.1f} KB)")
