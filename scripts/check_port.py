"""
scripts/check_port.py
Checks what is listening on port 3000 and kills it if it's a zombie node process.
"""
import subprocess

def check():
    res = subprocess.run(["netstat", "-ano"], capture_output=True, text=True)
    pids = []
    for line in res.stdout.splitlines():
        if ":3000 " in line and "LISTENING" in line:
            parts = line.strip().split()
            pid = parts[-1]
            pids.append(pid)
            print(f"[*] Port 3000 used by PID: {pid}")

    for pid in pids:
        print(f"[*] Killing PID {pid}...")
        subprocess.run(["taskkill", "/F", "/PID", pid])

if __name__ == "__main__":
    check()
