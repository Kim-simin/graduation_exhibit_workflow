# scripts/check_python_imaging.py
import sys

print(f"Python version: {sys.version}")

try:
    import PIL
    from PIL import Image
    print(f"PIL/Pillow version: {PIL.__version__}")
except ImportError as e:
    print(f"Pillow NOT installed: {e}")

try:
    import cv2
    print(f"OpenCV version: {cv2.__version__}")
except ImportError as e:
    print(f"OpenCV NOT installed: {e}")

try:
    import numpy as np
    print(f"NumPy version: {np.__version__}")
except ImportError as e:
    print(f"NumPy NOT installed: {e}")
