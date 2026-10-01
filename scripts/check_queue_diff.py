#!/usr/bin/env python3
import os
import json

root_f = "data/university_queue.json"
plat_f = "my-exhibit-platform/data/university_queue.json"

with open(root_f, "r", encoding="utf-8") as f:
    d1 = json.load(f)
with open(plat_f, "r", encoding="utf-8") as f:
    d2 = json.load(f)

print("Root len:", len(d1), "Plat len:", len(d2))
print("Equal objects:", d1 == d2)
