import os
import sys
import subprocess
import requests

def check():
    print("=== LOCAL RUNTIME & QWEN2.5-VL INSPECTION ===")
    
    # 1. Check GGUF models
    models = [
        "Qwen_Qwen2.5-VL-7B-Instruct-Q5_K_M.gguf",
        "Qwen_Qwen2.5-VL-7B-Instruct-mmproj.gguf",
        "mmproj-Qwen_Qwen2.5-VL-7B-Instruct-f16.gguf"
    ]
    for m in models:
        path = os.path.abspath(m)
        exists = os.path.exists(path)
        size_gb = os.path.getsize(path) / (1024**3) if exists else 0
        print(f"Model file: {m} -> Exists: {exists} ({size_gb:.2f} GB)")

    # 2. Check llama binaries
    binaries = ["llama-server.exe", "llama-cli.exe", "llama-qwen2vl-cli.exe"]
    for b in binaries:
        path = os.path.abspath(b)
        print(f"Binary: {b} -> Exists: {os.path.exists(path)}")

    # 3. Check if llama-server is currently listening on port 8080 or other ports
    ports_to_test = [8080, 11434, 8000, 3000]
    for p in ports_to_test:
        url = f"http://127.0.0.1:{p}/health"
        try:
            r = requests.get(url, timeout=1.0)
            print(f"Port {p} health: {r.status_code}")
        except Exception:
            print(f"Port {p}: Not responding")

    # 4. Check Playwright python module
    try:
        from playwright.sync_api import sync_playwright
        print("Python Playwright: Installed and importable")
    except ImportError as e:
        print(f"Python Playwright: NOT installed ({e})")

if __name__ == "__main__":
    check()
