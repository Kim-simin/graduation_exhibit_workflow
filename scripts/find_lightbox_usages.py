import os

target_dir = "my-exhibit-platform"
query = "ArtworkLightboxModal"

matches = []
for root, dirs, files in os.walk(target_dir):
    if "node_modules" in dirs:
        dirs.remove("node_modules")
    if ".next" in dirs:
        dirs.remove(".next")
    for file in files:
        if file.endswith((".tsx", ".ts", ".jsx", ".js")):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                    if query in content:
                        matches.append(filepath)
            except Exception as e:
                pass

print(f"Files containing {query}:")
for m in matches:
    print(f"  - {m}")
