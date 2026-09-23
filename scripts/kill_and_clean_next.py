"""
scripts/kill_and_clean_next.py
Clean stale next dev server and remove corrupted .next directory.
"""
import os
import shutil
import subprocess
import time

def clean_next():
    # 1. Kill node process on port 3000
    try:
        out = subprocess.check_output("netstat -ano | findstr :3000", shell=True, text=True)
        for line in out.strip().splitlines():
            parts = line.split()
            if len(parts) >= 5 and "LISTENING" in parts:
                pid = parts[-1]
                print(f"Terminating stale dev process PID: {pid}")
                subprocess.run(f"taskkill /F /PID {pid}", shell=True)
    except Exception as e:
        print(f"No process or error: {e}")

    time.sleep(1)

    # 2. Remove .next directory
    next_dir = os.path.join(os.getcwd(), "my-exhibit-platform", ".next")
    if os.path.exists(next_dir):
        print(f"Removing corrupted/mixed .next directory: {next_dir}")
        try:
            shutil.rmtree(next_dir)
            print("Successfully deleted .next directory.")
        except Exception as e:
            print(f"Failed to delete .next: {e}")

if __name__ == "__main__":
    clean_next()
