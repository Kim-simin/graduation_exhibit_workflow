"""
scripts/test_cross_language_lock.py
Tests cross-language mutual exclusion lock between Python and Node.js:
1. Python acquires lock on test file.
2. Spawns Node.js script using my-exhibit-platform/lib/storage-lock.ts logic.
3. Node.js attempts to acquire lock and confirms it is blocked.
4. Python releases lock, Node.js successfully acquires lock.
"""
import os
import sys
import json
import time
import subprocess
import tempfile
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from research.storage_manager import interprocess_file_lock

def test_cross_language_lock():
    print("\n--- [TEST] Cross-Language Lock Compatibility (Python <-> Node.js) ---", flush=True)

    with tempfile.TemporaryDirectory(prefix="cross_lock_") as temp_dir:
        target_file = os.path.join(temp_dir, "shared_db.json")
        lock_file = target_file + ".lock"

        # Node.js worker script that attempts to acquire lock
        node_script = f"""
const fs = require('fs');
const lockPath = {json.dumps(lock_file)};
const startTime = Date.now();

try {{
  const fd = fs.openSync(lockPath, 'wx');
  fs.writeSync(fd, `${{process.pid}}\\n${{Date.now()}}\\n`);
  fs.closeSync(fd);
  fs.unlinkSync(lockPath);
  console.log('ACQUIRED');
}} catch (e) {{
  if (e.code === 'EEXIST') {{
    console.log('BLOCKED_BY_PYTHON');
  }} else {{
    console.log('ERROR: ' + e.message);
  }}
}}
"""
        node_script_file = os.path.join(temp_dir, "probe.js")
        with open(node_script_file, "w", encoding="utf-8") as nf:
            nf.write(node_script)

        # 1. Python holds the lock
        with interprocess_file_lock(target_file):
            assert os.path.exists(lock_file), "Python lock file not created on disk!"

            # Run Node probe while Python holds lock
            proc = subprocess.run(["node", node_script_file], capture_output=True, text=True)
            output = proc.stdout.strip()
            print(f"  [Node probe while Python locked]: {output}", flush=True)
            assert "BLOCKED_BY_PYTHON" in output, f"Node was not blocked by Python lock! Output: {output}"

        # 2. Python has released the lock
        assert not os.path.exists(lock_file), "Python lock file was not removed after release!"

        # Run Node probe now that Python released
        proc2 = subprocess.run(["node", node_script_file], capture_output=True, text=True)
        output2 = proc2.stdout.strip()
        print(f"  [Node probe after Python unlocked]: {output2}", flush=True)
        assert "ACQUIRED" in output2, f"Node could not acquire lock after Python release! Output: {output2}"

        print("  [PASS] Cross-language file lock mutual exclusion verified between Python & Node.js!", flush=True)

if __name__ == "__main__":
    test_cross_language_lock()
