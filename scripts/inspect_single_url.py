import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/snu_works_stream.txt', 'r', encoding='utf-8') as f:
    stream = f.read()

idx16 = stream.find('16:T')
idx17 = stream.find('17:T')

print("16:T to 17:T:")
print(repr(stream[idx16:idx17]))
