import subprocess
import json
import os

cmd = ["npx.cmd", "@playwright/mcp@latest", "--headless"]
proc = subprocess.Popen(
    cmd,
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True,
    encoding="utf-8",
    bufsize=1
)

def send_recv(req):
    proc.stdin.write(json.dumps(req) + "\n")
    proc.stdin.flush()
    line = proc.stdout.readline()
    return json.loads(line)

init_resp = send_recv({
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
        "protocolVersion": "2024-11-05",
        "capabilities": {},
        "clientInfo": {"name": "test-client", "version": "1.0.0"}
    }
})

tools_resp = send_recv({
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
})

tools = tools_resp.get("result", {}).get("tools", [])
print(f"Total tools: {len(tools)}")
with open("scratch/tools_schema.json", "w", encoding="utf-8") as f:
    json.dump(tools, f, indent=2, ensure_ascii=False)

for t in tools:
    name = t["name"]
    desc = t.get("description", "")
    print(f"- {name}: {desc[:60]}...")

proc.terminate()
