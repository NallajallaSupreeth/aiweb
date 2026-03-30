# services/vision.py

import cv2
import numpy as np
from sklearn.cluster import KMeans
import random

# ---------- Category Detection (Still Dummy for now) ----------
CATEGORIES = ["t-shirt", "shirt", "pants", "jeans", "dress", "jacket", "skirt"]

def detect_category(image_path):
    # TODO: Replace with ML model (Week 2 advanced / Week 3)
    return random.choice(CATEGORIES)


# ---------- Dominant Color Detection (Improved) ----------
def detect_dominant_color(image_path):

    image = cv2.imread(image_path)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # Resize for faster processing
    image = cv2.resize(image, (100, 100))

    pixels = image.reshape(-1, 3)

    kmeans = KMeans(n_clusters=3, n_init=10)
    kmeans.fit(pixels)

    dominant_color = kmeans.cluster_centers_[0]

    return rgb_to_color_name(dominant_color)


def rgb_to_color_name(rgb):
    r, g, b = rgb

    if r > 200 and g < 80 and b < 80:
        return "red"
    elif r < 80 and g > 200 and b < 80:
        return "green"
    elif r < 80 and g < 80 and b > 200:
        return "blue"
    elif r > 200 and g > 200 and b < 80:
        return "yellow"
    elif r > 200 and g > 200 and b > 200:
        return "white"
    elif r < 50 and g < 50 and b < 50:
        return "black"
    else:
        return "other"


# ---------- Pattern Detection (Real Logic) ----------
def detect_pattern(image_path):

    image = cv2.imread(image_path)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Edge detection
    edges = cv2.Canny(gray, 50, 150)

    edge_density = np.mean(edges)

    if edge_density < 5:
        return "solid"
    elif edge_density < 15:
        return "striped"
    else:
        return "patterned"