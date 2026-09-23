"""
scripts/find_and_restart_dev.py
Find process on port 3000.
"""
import subprocess
import re
import os

def find_pid_on_port(port=3000):
    try:
        out = subprocess.check_output(f"netstat -ano | findstr :{port}", shell=True, text=True)
        print("Netstat output:")
        print(out)
        pids = set()
        for line in out.strip().splitlines():
            parts = line.split()
            if len(parts) >= 5 and "LISTENING" in parts:
                pids.add(parts[-1])
        return list(pids)
    except Exception as e:
        print(f"Error finding PID: {e}")
        return []

pids = find_pid_on_port(3000)
print(f"PIDs listening on port 3000: {pids}")
