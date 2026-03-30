import numpy as np
from sklearn.metrics.pairwise import cosine_similarity


# ---------------- VECTOR UTILS ----------------
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

    # Normalize similarity
    return float(max(0, min(sim, 1)))


# ---------------- COLOR LOGIC ----------------
GOOD_COLOR_MATCHES = {
    "black": ["white", "grey", "blue", "red"],
    "white": ["black", "blue", "green", "red"],
    "blue": ["white", "black"],
    "red": ["black", "white"],
    "green": ["white", "black"]
}


def is_color_compatible(color1, color2):
    if not color1 or not color2:
        return True

    if color1 == color2:
        return True

    return color2 in GOOD_COLOR_MATCHES.get(color1, [])


# ---------------- CATEGORY LOGIC ----------------
CATEGORY_MATCH = {
    "t-shirt": ["jeans", "pants"],
    "shirt": ["pants", "jeans"],
    "jacket": ["jeans", "pants"],
    "jeans": ["t-shirt", "shirt"],
    "pants": ["t-shirt", "shirt"],
    "dress": []
}


def is_category_compatible(input_cat, candidate_cat):
    return candidate_cat in CATEGORY_MATCH.get(input_cat, [])


# ---------------- WEATHER LOGIC 🔥 ----------------
def is_weather_compatible(item, weather):
    category = item.get("category", "")
    temp = weather.get("temperature", 25)

    if temp > 30:
        return category in ["t-shirt", "shirt"]

    elif temp < 20:
        return category in ["jacket", "shirt"]

    return True


# ---------------- FEEDBACK ADJUSTMENT ----------------
def adjust_score_with_feedback(user_id, item, base_score, feedbacks):

    if not feedbacks:
        return base_score

    for f in feedbacks:
        if f.get("item_id") == str(item["_id"]):

            if f.get("rating") == "like":
                base_score += 0.2

            elif f.get("rating") == "dislike":
                base_score -= 0.3

    return base_score


# ---------------- RECOMMENDATION ENGINE ----------------
def recommend_items(
    input_item,
    wardrobe_items,
    feedbacks=None,
    weather=None,
    top_k=3
):

    recommendations = []

    input_embedding = input_item.get("embedding", [])
    input_color = input_item.get("color", "")
    input_category = input_item.get("category", "")
    user_id = input_item.get("user_id", "")

    for item in wardrobe_items:

        # Skip same item
        if str(item["_id"]) == str(input_item["_id"]):
            continue

        item_embedding = item.get("embedding", [])
        item_color = item.get("color", "")
        item_category = item.get("category", "")

        # 1️⃣ Category filter
        if not is_category_compatible(input_category, item_category):
            continue

        # 2️⃣ Weather filter (NEW 🔥)
        if weather and not is_weather_compatible(item, weather):
            continue

        # 3️⃣ Color compatibility
        color_score = 1 if is_color_compatible(input_color, item_color) else 0
        if color_score == 0:
            continue

        # 4️⃣ Embedding similarity
        similarity_score = compute_similarity(input_embedding, item_embedding)

        # 🔥 Final score
        final_score = (0.7 * similarity_score) + (0.3 * color_score)

        # 🔥 Feedback learning
        final_score = adjust_score_with_feedback(user_id, item, final_score, feedbacks)

        recommendations.append((item, final_score))

    # 🔁 Fallback
    if len(recommendations) == 0:
        for item in wardrobe_items:
            if str(item["_id"]) == str(input_item["_id"]):
                continue

            score = compute_similarity(input_embedding, item.get("embedding", []))
            score = adjust_score_with_feedback(user_id, item, score, feedbacks)

            recommendations.append((item, score))

    # Sort results
    recommendations = sorted(recommendations, key=lambda x: x[1], reverse=True)

    return [item for item, score in recommendations[:top_k]]


# ---------------- OUTFIT GENERATOR ----------------
def generate_outfit(input_item, wardrobe_items, weather=None):

    tops = []
    bottoms = []

    for item in wardrobe_items:
        category = item.get("category", "")

        if category in ["t-shirt", "shirt", "jacket"]:
            tops.append(item)

        elif category in ["jeans", "pants"]:
            bottoms.append(item)

    best_top = None
    best_bottom = None
    best_top_score = -1
    best_bottom_score = -1

    input_embedding = input_item.get("embedding", [])
    input_color = input_item.get("color", "")

    # 🔝 TOP selection
    for item in tops:

        if weather and not is_weather_compatible(item, weather):
            continue

        score = compute_similarity(input_embedding, item.get("embedding", []))

        if is_color_compatible(input_color, item.get("color", "")):
            score += 0.2

        if score > best_top_score:
            best_top_score = score
            best_top = item

    # 👖 BOTTOM selection
    for item in bottoms:

        if weather and not is_weather_compatible(item, weather):
            continue

        score = compute_similarity(input_embedding, item.get("embedding", []))

        if is_color_compatible(input_color, item.get("color", "")):
            score += 0.2

        if score > best_bottom_score:
            best_bottom_score = score
            best_bottom = item

    return {
        "top": best_top,
        "bottom": best_bottom
    }