import shutil
import subprocess
import os
import json

def inspect():
    results = {}
    
    # 1. Check n8n CLI in PATH
    n8n_path = shutil.which("n8n")
    results["n8n_cli"] = n8n_path if n8n_path else "Not found in PATH"
    
    # 2. Check docker in PATH
    docker_path = shutil.which("docker")
    results["docker_cli"] = docker_path if docker_path else "Not found in PATH"
    
    # 3. Check npm global packages
    try:
        npm_path = shutil.which("npm")
        if npm_path:
            res = subprocess.run(["npm", "list", "-g", "--depth=0", "--json"], capture_output=True, text=True, timeout=10)
            results["npm_globals"] = list(json.loads(res.stdout).get("dependencies", {}).keys())
    except Exception as e:
        results["npm_globals_error"] = str(e)
        
    # 4. Check relevant env vars
    n8n_envs = {k: v for k, v in os.environ.items() if "N8N" in k.upper()}
    results["n8n_env_vars"] = n8n_envs
    
    # 5. Check netstat for listening ports
    try:
        res = subprocess.run(["netstat", "-ano"], capture_output=True, text=True, timeout=10)
        listening = []
        for line in res.stdout.splitlines():
            if "LISTENING" in line:
                parts = line.split()
                if len(parts) >= 2:
                    listening.append(parts[1])
        results["listening_ports"] = sorted(list(set(listening)))
    except Exception as e:
        results["netstat_error"] = str(e)
        
    print(json.dumps(results, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    inspect()
