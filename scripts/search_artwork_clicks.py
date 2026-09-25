import os

target_dir = "my-exhibit-platform"
queries = ["setSelectedArtworkIndex", "isPosterLightboxOpen", "artworks.map"]

for q in queries:
    print(f"=== Matches for {q} ===")
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
                        if q in content:
                            print(f"  {filepath}")
                except:
                    pass
