"""
scripts/check_dev_server.py
Check port 3000 and .next cache status.
"""
import os
import socket
import subprocess

def check_port(port=3000):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0

print(f"Port 3000 in use: {check_port(3000)}")

# Check .next directory
next_dir = os.path.join(os.getcwd(), "my-exhibit-platform", ".next")
if os.path.exists(next_dir):
    print(f".next directory exists: {next_dir}")
    cache_dir = os.path.join(next_dir, "cache")
    print(f".next/cache exists: {os.path.exists(cache_dir)}")
