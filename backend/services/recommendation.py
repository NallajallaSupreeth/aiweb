import numpy as np
from sklearn.metrics.pairwise import cosine_similarity


# ==============================
# 🔹 VECTOR UTILS
# ==============================
def to_vector(vec):
    if not vec or len(vec) == 0:
        return None
    return np.array(vec).reshape(1, -1)


def compute_similarity(vec1, vec2):
    v1 = to_vector(vec1)
    v2 = to_vector(vec2)

    if v1 is None or v2 is None:
        return 0.0

    sim = cosine_similarity(v1, v2)[0][0]

    return float(max(0, min(sim, 1)))


# ==============================
# 🎨 COLOR COMPATIBILITY (IMPROVED)
# ==============================
COLOR_HARMONY = {
    "black": ["white", "grey", "blue", "beige"],
    "white": ["black", "blue", "green", "grey"],
    "blue": ["white", "black", "grey"],
    "red": ["black", "white"],
    "green": ["white", "black"],
    "yellow": ["black", "blue"],
    "grey": ["black", "white"],
}


def color_score(c1, c2):
    if not c1 or not c2:
        return 0.5

    if c1 == c2:
        return 1.0

    if c2 in COLOR_HARMONY.get(c1, []):
        return 0.8

    return 0.2


# ==============================
# 👕 CATEGORY COMPATIBILITY
# ==============================
CATEGORY_MATCH = {
    "t-shirt": ["jeans", "pants", "shorts"],
    "shirt": ["jeans", "pants"],
    "jacket": ["jeans", "pants"],
    "hoodie": ["jeans", "joggers"],
    "jeans": ["t-shirt", "shirt"],
    "pants": ["t-shirt", "shirt"],
    "joggers": ["t-shirt", "hoodie"],
}


def is_category_compatible(c1, c2):
    return c2 in CATEGORY_MATCH.get(c1, [])


# ==============================
# 🌦️ WEATHER LOGIC
# ==============================
def weather_score(item, weather):
    if not weather:
        return 1.0

    temp = weather.get("temperature", 25)
    category = item.get("category", "")

    if temp > 30:
        return 1.0 if category in ["t-shirt", "shirt"] else 0.4

    if temp < 20:
        return 1.0 if category in ["jacket", "hoodie"] else 0.5

    return 0.8


# ==============================
# 👍 FEEDBACK LEARNING
# ==============================
def feedback_score(item, feedbacks):
    score = 0

    for f in feedbacks or []:
        if f.get("item_id") == str(item["_id"]):

            if f.get("rating") == "like":
                score += 0.2

            elif f.get("rating") == "dislike":
                score -= 0.3

    return score


# ==============================
# 🧠 FINAL RECOMMENDATION ENGINE
# ==============================
def recommend_items(
    input_item,
    wardrobe_items,
    feedbacks=None,
    weather=None,
    top_k=5
):

    results = []

    input_embedding = input_item.get("embedding", [])
    input_color = input_item.get("color", "")
    input_category = input_item.get("category", "")

    for item in wardrobe_items:

        if str(item["_id"]) == str(input_item["_id"]):
            continue

        item_embedding = item.get("embedding", [])
        item_color = item.get("color", "")
        item_category = item.get("category", "")

        # ❌ Category mismatch
        if not is_category_compatible(input_category, item_category):
            continue

        # 🔢 Scores
        sim = compute_similarity(input_embedding, item_embedding)
        col = color_score(input_color, item_color)
        wea = weather_score(item, weather)
        fb = feedback_score(item, feedbacks)

        # 🔥 FINAL SCORE (IMPORTANT)
        final_score = (
            0.5 * sim +
            0.2 * col +
            0.2 * wea +
            0.1 * fb
        )

        results.append((item, final_score))

    # 🔁 fallback
    if not results:
        for item in wardrobe_items:
            if str(item["_id"]) == str(input_item["_id"]):
                continue

            score = compute_similarity(input_embedding, item.get("embedding", []))
            results.append((item, score))

    results = sorted(results, key=lambda x: x[1], reverse=True)

    return [item for item, score in results[:top_k]]


# ==============================
# 👗 OUTFIT GENERATOR
# ==============================
def generate_outfit(input_item, wardrobe_items, weather=None):

    tops = []
    bottoms = []

    for item in wardrobe_items:
        cat = item.get("category", "")

        if cat in ["t-shirt", "shirt", "jacket", "hoodie"]:
            tops.append(item)
        elif cat in ["jeans", "pants", "joggers"]:
            bottoms.append(item)

    best_top = max(
        tops,
        key=lambda x: compute_similarity(input_item.get("embedding"), x.get("embedding")),
        default=None
    )

    best_bottom = max(
        bottoms,
        key=lambda x: compute_similarity(input_item.get("embedding"), x.get("embedding")),
        default=None
    )

    return {
        "top": best_top,
        "bottom": best_bottom
    }