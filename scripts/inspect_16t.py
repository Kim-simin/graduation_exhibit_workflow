import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/snu_works_stream.txt', 'r', encoding='utf-8') as f:
    stream = f.read()

# Let's search for "16:T" in stream
idx = stream.find('16:T')
print("Index of 16:T in stream:", idx)
if idx != -1:
    print("Around 16:T:")
    print(repr(stream[idx-50:idx+150]))
