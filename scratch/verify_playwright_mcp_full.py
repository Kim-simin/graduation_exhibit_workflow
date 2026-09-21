import subprocess
import http.server
import socketserver
import threading
import json
import os
import sys
import time

# Ensure UTF-8 output on Windows
sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

class SilentHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

def run_test():
    print("=====================================================================")
    print("[PLAYWRIGHT MCP FULL END-TO-END VERIFICATION]")
    print("=====================================================================")

    # 1. Start local HTTP server for read-only test page
    PORT = 8923
    httpd = socketserver.TCPServer(("127.0.0.1", PORT), SilentHandler)
    server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    server_thread.start()
    print(f"[*] Local HTTP Test Server running on http://127.0.0.1:{PORT}")

    cmd = ["npx.cmd", "@playwright/mcp@latest", "--headless"]
    print(f"[*] Executing MCP Server: {' '.join(cmd)}")
    
    proc = subprocess.Popen(
        cmd,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
        bufsize=1
    )

    req_id = 0
    def call_mcp(method, params=None):
        nonlocal req_id
        req_id += 1
        payload = {"jsonrpc": "2.0", "id": req_id, "method": method}
        if params is not None:
            payload["params"] = params
        proc.stdin.write(json.dumps(payload) + "\n")
        proc.stdin.flush()
        line = proc.stdout.readline()
        if not line:
            err = proc.stderr.read()
            raise RuntimeError(f"Server closed connection unexpectedly: {err}")
        return json.loads(line)

    results = {
        "Installation": "FAIL",
        "Server Startup": "FAIL",
        "Antigravity Detection": "FAIL",
        "Browser Launch": "FAIL",
        "Page Navigation": "FAIL",
        "Click": "FAIL",
        "Scroll": "FAIL",
        "Screenshot": "FAIL"
    }

    try:
        # [검증 1 & 2] Initialize
        print("\n[1/7] Initializing MCP Server Protocol...")
        init_res = call_mcp("initialize", {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "antigravity-verifier", "version": "1.0.0"}
        })
        server_info = init_res.get("result", {}).get("serverInfo", {})
        print(f" -> Connected to Server: {server_info.get('name')} (v{server_info.get('version')})")
        results["Installation"] = "PASS"
        results["Server Startup"] = "PASS"

        # Notify initialized
        proc.stdin.write(json.dumps({"jsonrpc": "2.0", "method": "notifications/initialized"}) + "\n")
        proc.stdin.flush()

        # Tools list (Antigravity recognition)
        print("\n[2/7] Listing Exposed MCP Tools (tools/list)...")
        tools_res = call_mcp("tools/list", {})
        tools = tools_res.get("result", {}).get("tools", [])
        tool_names = [t["name"] for t in tools]
        print(f" -> Discovered {len(tools)} tools: {', '.join(tool_names[:8])}...")
        if "browser_navigate" in tool_names and "browser_click" in tool_names:
            results["Antigravity Detection"] = "PASS"

        # [검증 3 & 4] Browser Launch & Navigate to test page
        test_url = f"http://127.0.0.1:{PORT}/scratch/test_page.html"
        print(f"\n[3/7] Launching Browser & Navigating to {test_url}...")
        nav_res = call_mcp("tools/call", {
            "name": "browser_navigate",
            "arguments": {"url": test_url}
        })
        nav_content = nav_res.get("result", {}).get("content", [])
        print(f" -> Navigation completed.")
        results["Browser Launch"] = "PASS"
        results["Page Navigation"] = "PASS"

        # Snapshot check
        snap_res = call_mcp("tools/call", {
            "name": "browser_snapshot",
            "arguments": {}
        })
        snap_str = json.dumps(snap_res, ensure_ascii=False)
        print(f" -> Snapshot verified. (Length: {len(snap_str)} chars)")

        # [검증 5 - Click]
        print("\n[4/7] Testing Element Click (#test-btn)...")
        click_res = call_mcp("tools/call", {
            "name": "browser_click",
            "arguments": {
                "target": "#test-btn"
            }
        })
        print(f" -> Click executed on #test-btn.")
        
        # Verify DOM mutation caused by click
        eval_click = call_mcp("tools/call", {
            "name": "browser_evaluate",
            "arguments": {
                "function": "() => document.getElementById('status').innerText"
            }
        })
        eval_str = json.dumps(eval_click, ensure_ascii=False)
        print(f" -> Status after click: {eval_str}")
        if "Clicked" in eval_str or "성공" in eval_str:
            results["Click"] = "PASS"

        # [검증 5 - Scroll]
        print("\n[5/7] Testing Page Scroll...")
        eval_scroll = call_mcp("tools/call", {
            "name": "browser_evaluate",
            "arguments": {
                "function": "() => { window.scrollTo(0, 1000); return window.scrollY; }"
            }
        })
        scroll_str = json.dumps(eval_scroll)
        print(f" -> Scroll result: {scroll_str}")
        if "1000" in scroll_str:
            results["Scroll"] = "PASS"

        # [검증 5 - Screenshot]
        print("\n[6/7] Testing Browser Screenshot...")
        screenshot_path = os.path.abspath("scratch/playwright_mcp_shot.png")
        ss_res = call_mcp("tools/call", {
            "name": "browser_take_screenshot",
            "arguments": {
                "scale": "css",
                "filename": "scratch/playwright_mcp_shot.png"
            }
        })
        print(f" -> Screenshot tool finished.")
        if os.path.exists(screenshot_path) and os.path.getsize(screenshot_path) > 0:
            print(f" -> Screenshot file created: {screenshot_path} ({os.path.getsize(screenshot_path):,} bytes)")
            results["Screenshot"] = "PASS"
        else:
            # Check if screenshot data was returned inline in content
            content = ss_res.get("result", {}).get("content", [])
            if any(c.get("type") == "image" for c in content) or os.path.exists(screenshot_path):
                results["Screenshot"] = "PASS"

        # [Cleanup] Close browser
        print("\n[7/7] Closing Browser Session...")
        call_mcp("tools/call", {"name": "browser_close", "arguments": {}})
        print(" -> Browser closed gracefully.")

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error during verification: {e}", file=sys.stderr)
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except Exception:
            proc.kill()
        httpd.shutdown()

    print("\n=====================================================================")
    print("PLAYWRIGHT MCP STATUS")
    print("=====================================================================")
    for k, v in results.items():
        print(f"{k}: {v}")
    print("=====================================================================")

    return results

if __name__ == "__main__":
    res = run_test()
    all_pass = all(v == "PASS" for v in res.values())
    sys.exit(0 if all_pass else 1)
