"""
Personalized Outfit Recommendation Engine
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Recommends matching clothes from user's wardrobe using:
  1. Color compatibility scoring
  2. User personalization (skin tone, hair color, eye color)
  3. Pattern compatibility
  4. Occasion matching
  5. Embedding similarity (legacy)

IMPORTANT:
  - Recommends ONLY from user's existing wardrobe
  - Does NOT use external APIs for recommendations
  - Does NOT generate fake clothing
"""

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from bson import ObjectId
from db.connection import db

user_collection = db["users"]
wardrobe_collection = db["wardrobe"]


# ═══════════════════════════════════════════════════════════════════════════════
# VECTOR UTILS (legacy, kept for backward compat)
# ═══════════════════════════════════════════════════════════════════════════════
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


# ═══════════════════════════════════════════════════════════════════════════════
# DATA FETCHERS
# ═══════════════════════════════════════════════════════════════════════════════
def get_user_profile(user_id: str) -> dict:
    """Fetch user profile from MongoDB."""
    try:
        user = user_collection.find_one({"_id": ObjectId(user_id)})
    except Exception:
        user = user_collection.find_one({"_id": user_id})
    if not user:
        return {}
    return {
        "skin_tone":  user.get("skin_tone", ""),
        "hair_color": user.get("hair_color", ""),
        "eye_color":  user.get("eye_color", ""),
    }


def get_item_by_id(item_id: str) -> dict:
    """Fetch a single wardrobe item by its ID."""
    try:
        item = wardrobe_collection.find_one({"_id": ObjectId(item_id)})
    except Exception:
        return None
    return item


def get_candidates(user_id: str, target_category: str, exclude_id: str = None) -> list:
    """Fetch candidate items from user's wardrobe for a specific category."""
    query = {"user_id": user_id, "category": target_category}
    items = list(wardrobe_collection.find(query))
    if exclude_id:
        items = [i for i in items if str(i["_id"]) != exclude_id]
    return items


# ═══════════════════════════════════════════════════════════════════════════════
# STEP 3: COLOR MATCHING LOGIC
# ═══════════════════════════════════════════════════════════════════════════════

# ── Neutrals (pair well with almost anything) ────────────────────────────────
NEUTRALS = {"black", "white", "grey", "dark grey", "light grey", "charcoal",
            "off white", "cream", "beige", "navy blue"}

# ── Good contrast pairs ──────────────────────────────────────────────────────
CONTRAST_PAIRS = {
    frozenset({"blue", "beige"}), frozenset({"blue", "khaki"}),
    frozenset({"navy blue", "white"}), frozenset({"navy blue", "beige"}),
    frozenset({"navy blue", "cream"}), frozenset({"navy blue", "khaki"}),
    frozenset({"black", "white"}), frozenset({"black", "cream"}),
    frozenset({"maroon", "beige"}), frozenset({"maroon", "cream"}),
    frozenset({"maroon", "white"}), frozenset({"maroon", "khaki"}),
    frozenset({"olive", "white"}), frozenset({"olive", "cream"}),
    frozenset({"brown", "white"}), frozenset({"brown", "cream"}),
    frozenset({"charcoal", "white"}), frozenset({"charcoal", "cream"}),
    frozenset({"red", "black"}), frozenset({"red", "white"}),
    frozenset({"green", "white"}), frozenset({"green", "black"}),
    frozenset({"royal blue", "white"}), frozenset({"royal blue", "beige"}),
    frozenset({"teal", "white"}), frozenset({"teal", "cream"}),
    frozenset({"mustard", "navy blue"}), frozenset({"mustard", "black"}),
    frozenset({"pink", "grey"}), frozenset({"pink", "navy blue"}),
    frozenset({"lavender", "white"}), frozenset({"lavender", "grey"}),
}

# ── Bright colors that clash when paired ──────────────────────────────────────
BRIGHT_COLORS = {"red", "orange", "yellow", "lime green", "cyan", "pink",
                 "violet", "coral", "amber", "turquoise", "gold"}


def calculate_color_score(color1: str, color2: str) -> tuple:
    """
    Calculate color compatibility score between two clothing items.

    Returns:
        (score: int, reason: str)
    """
    c1 = (color1 or "").lower().strip()
    c2 = (color2 or "").lower().strip()

    if not c1 or not c2:
        return (0, "")

    # Good contrast pairing
    if frozenset({c1, c2}) in CONTRAST_PAIRS:
        return (3, f"Great contrast: {c1} + {c2}")

    # Neutral pairing (neutral + anything = safe)
    if c1 in NEUTRALS or c2 in NEUTRALS:
        return (2, f"Neutral pairing: {c1} + {c2}")

    # Same color family / similar tone
    if c1 == c2:
        return (1, f"Monochrome: {c1}")

    # Bright + bright = clash
    if c1 in BRIGHT_COLORS and c2 in BRIGHT_COLORS:
        return (-2, f"Color clash: {c1} + {c2}")

    # Default: mild compatibility
    return (1, f"Compatible tones: {c1} + {c2}")


# ═══════════════════════════════════════════════════════════════════════════════
# STEP 4: PERSONALIZATION SCORING
# ═══════════════════════════════════════════════════════════════════════════════

# ── Skin tone → good colors ──────────────────────────────────────────────────
SKIN_TONE_COLORS = {
    "fair": {
        "good": {"navy blue", "black", "maroon", "dark grey", "charcoal",
                 "royal blue", "indigo", "teal", "olive", "brown"},
        "avoid": {"cream", "beige", "off white", "light grey", "yellow", "peach"},
    },
    "light": {  # alias for fair
        "good": {"navy blue", "black", "maroon", "dark grey", "charcoal",
                 "royal blue", "indigo", "teal", "olive", "brown"},
        "avoid": {"cream", "beige", "off white", "light grey", "yellow", "peach"},
    },
    "medium": {
        "good": {"olive", "mustard", "teal", "brown", "khaki", "maroon",
                 "green", "orange", "coral", "amber", "tan"},
        "avoid": set(),
    },
    "warm": {
        "good": {"olive", "mustard", "brown", "khaki", "coral", "orange",
                 "amber", "gold", "tan", "peach"},
        "avoid": {"grey", "silver", "light grey"},
    },
    "cool": {
        "good": {"navy blue", "royal blue", "grey", "lavender", "silver",
                 "teal", "indigo", "pink", "violet"},
        "avoid": {"orange", "gold", "mustard", "amber"},
    },
    "dark": {
        "good": {"white", "yellow", "red", "orange", "coral", "pink",
                 "cream", "gold", "amber", "lime green", "turquoise",
                 "mint", "lavender", "peach"},
        "avoid": {"black", "dark grey", "charcoal", "navy blue", "maroon"},
    },
}

# ── Hair color → complementary clothing colors ──────────────────────────────
HAIR_COLOR_MATCH = {
    "black":  {"bold": {"red", "white", "royal blue", "gold", "turquoise", "coral"}},
    "brown":  {"earthy": {"beige", "olive", "khaki", "brown", "tan", "mustard", "cream"}},
    "blonde": {"pastel": {"lavender", "pink", "mint", "peach", "sky blue", "cream"}},
    "red":    {"complement": {"green", "teal", "olive", "navy blue", "cream", "beige"}},
    "grey":   {"neutral": {"navy blue", "maroon", "black", "white", "teal"}},
    "white":  {"neutral": {"navy blue", "maroon", "black", "teal", "royal blue"}},
}

# ── Eye color → complementary clothing colors ───────────────────────────────
EYE_COLOR_MATCH = {
    "brown":  {"warm": {"brown", "khaki", "olive", "mustard", "maroon", "orange", "gold", "amber", "tan"}},
    "blue":   {"cool": {"grey", "navy blue", "silver", "lavender", "charcoal", "royal blue", "teal"}},
    "green":  {"complement": {"maroon", "brown", "gold", "mustard", "olive", "coral", "peach"}},
    "hazel":  {"mixed": {"olive", "brown", "gold", "teal", "green", "amber", "khaki"}},
    "black":  {"bold": {"white", "red", "royal blue", "gold", "turquoise"}},
    "grey":   {"neutral": {"navy blue", "charcoal", "lavender", "silver", "teal"}},
}


def calculate_personalization_score(
    candidate_color: str,
    skin_tone: str = "",
    hair_color: str = "",
    eye_color: str = "",
) -> tuple:
    """
    Score how well a candidate item's color suits the user's features.

    Returns:
        (score: int, reasons: list[str])
    """
    color = (candidate_color or "").lower().strip()
    skin = (skin_tone or "").lower().strip()
    hair = (hair_color or "").lower().strip()
    eye = (eye_color or "").lower().strip()

    score = 0
    reasons = []

    # ── Skin tone scoring (+2 good, -1 avoid) ────────────────────────────
    if skin and skin in SKIN_TONE_COLORS:
        rules = SKIN_TONE_COLORS[skin]
        if color in rules["good"]:
            score += 2
            reasons.append(f"Suits {skin} skin tone")
        elif color in rules.get("avoid", set()):
            score -= 1
            reasons.append(f"Not ideal for {skin} skin")

    # ── Hair color scoring (+1) ──────────────────────────────────────────
    if hair and hair in HAIR_COLOR_MATCH:
        all_hair_colors = set()
        for group in HAIR_COLOR_MATCH[hair].values():
            all_hair_colors |= group
        if color in all_hair_colors:
            score += 1
            reasons.append(f"Complements {hair} hair")

    # ── Eye color scoring (+1) ───────────────────────────────────────────
    if eye and eye in EYE_COLOR_MATCH:
        all_eye_colors = set()
        for group in EYE_COLOR_MATCH[eye].values():
            all_eye_colors |= group
        if color in all_eye_colors:
            score += 1
            reasons.append(f"Complements {eye} eyes")

    return (score, reasons)


# ═══════════════════════════════════════════════════════════════════════════════
# STEP 5: PATTERN MATCHING
# ═══════════════════════════════════════════════════════════════════════════════
def calculate_pattern_score(pattern1: str, pattern2: str) -> tuple:
    """
    Score pattern compatibility between two items.

    Returns:
        (score: int, reason: str)
    """
    p1 = (pattern1 or "solid").lower().strip()
    p2 = (pattern2 or "solid").lower().strip()

    # printed/patterned + solid = great combo
    non_solid_1 = p1 not in ("solid", "")
    non_solid_2 = p2 not in ("solid", "")

    if non_solid_1 and not non_solid_2:
        return (2, f"Nice combo: {p1} top + solid bottom")
    if non_solid_2 and not non_solid_1:
        return (2, f"Nice combo: solid + {p2}")

    # solid + solid = fine
    if not non_solid_1 and not non_solid_2:
        return (1, "Both solid — clean look")

    # patterned + patterned = clash
    if non_solid_1 and non_solid_2:
        return (-1, f"Pattern clash: {p1} + {p2}")

    return (0, "")


# ═══════════════════════════════════════════════════════════════════════════════
# STEP 6: OCCASION MATCHING
# ═══════════════════════════════════════════════════════════════════════════════
OCCASION_COMPAT = {
    "formal":  {"formal", "work"},
    "casual":  {"casual", "sport"},
    "sport":   {"sport", "casual"},
    "ethnic":  {"ethnic"},
    "party":   {"party", "casual"},
    "work":    {"work", "formal"},
}


def calculate_occasion_score(occ1: str, occ2: str) -> tuple:
    """
    Score occasion compatibility.

    Returns:
        (score: int, reason: str)
    """
    o1 = (occ1 or "casual").lower().strip()
    o2 = (occ2 or "casual").lower().strip()

    if o1 == o2:
        return (2, f"Same occasion: {o1}")

    if o2 in OCCASION_COMPAT.get(o1, set()):
        return (1, f"Compatible: {o1} ↔ {o2}")

    return (0, "")


# ═══════════════════════════════════════════════════════════════════════════════
# STEP 7: TOTAL SCORE & RECOMMENDATION ENGINE
# ═══════════════════════════════════════════════════════════════════════════════
def calculate_total_score(
    input_item: dict,
    candidate: dict,
    user_profile: dict,
) -> dict:
    """
    Calculate composite match score for a candidate item.

    Returns:
        {
            "score": int,
            "reasons": list[str],
            "breakdown": dict
        }
    """
    reasons = []

    # Color
    c_score, c_reason = calculate_color_score(
        input_item.get("color", ""),
        candidate.get("color", ""),
    )
    if c_reason:
        reasons.append(c_reason)

    # Personalization
    p_score, p_reasons = calculate_personalization_score(
        candidate.get("color", ""),
        skin_tone=user_profile.get("skin_tone", ""),
        hair_color=user_profile.get("hair_color", ""),
        eye_color=user_profile.get("eye_color", ""),
    )
    reasons.extend(p_reasons)

    # Pattern
    pat_score, pat_reason = calculate_pattern_score(
        input_item.get("pattern", ""),
        candidate.get("pattern", ""),
    )
    if pat_reason:
        reasons.append(pat_reason)

    # Occasion
    occ_score, occ_reason = calculate_occasion_score(
        input_item.get("occasion", ""),
        candidate.get("occasion", ""),
    )
    if occ_reason:
        reasons.append(occ_reason)

    total = c_score + p_score + pat_score + occ_score

    return {
        "score": total,
        "reasons": reasons,
        "breakdown": {
            "color": c_score,
            "personalization": p_score,
            "pattern": pat_score,
            "occasion": occ_score,
        },
    }


def generate_recommendations(
    user_id: str,
    item_id: str,
    top_k: int = 5,
) -> dict:
    """
    Main recommendation entry point.

    1. Fetch selected item
    2. Fetch user profile
    3. Determine target category (topwear ↔ bottomwear)
    4. Score all candidates
    5. Return top-K sorted by score

    Returns the full response dict for the API.
    """
    # ── Fetch input item ──────────────────────────────────────────────────
    input_item = get_item_by_id(item_id)
    if not input_item:
        return {"status": "error", "message": "Item not found"}

    # ── Fetch user profile ────────────────────────────────────────────────
    profile = get_user_profile(user_id)

    # ── Determine what to recommend (uses normalized categories) ─────────
    input_norm = normalize_category(input_item)
    if input_norm == "topwear":
        target_category = "bottomwear"
    else:
        target_category = "topwear"

    # ── Fetch candidates ──────────────────────────────────────────────────
    candidates = get_candidates(user_id, target_category, exclude_id=item_id)

    if not candidates:
        # Fallback: try all items except input
        all_items = list(wardrobe_collection.find({"user_id": user_id}))
        candidates = [i for i in all_items if str(i["_id"]) != item_id]

    # ── Score each candidate ──────────────────────────────────────────────
    scored = []
    for candidate in candidates[:20]:  # limit to 20 candidates for performance
        result = calculate_total_score(input_item, candidate, profile)

        candidate["_id"] = str(candidate["_id"])

        scored.append({
            "item_id":     candidate["_id"],
            "type":        candidate.get("subcategory") or candidate.get("category", ""),
            "category":    candidate.get("category", ""),
            "color":       candidate.get("color", "unknown"),
            "color_hex":   candidate.get("color_hex", ""),
            "pattern":     candidate.get("pattern", ""),
            "occasion":    candidate.get("occasion", ""),
            "image_url":   candidate.get("image_url", ""),
            "match_score": result["score"],
            "reasons":     result["reasons"],
            "breakdown":   result["breakdown"],
        })

    # ── Sort by score DESC ────────────────────────────────────────────────
    scored.sort(key=lambda x: x["match_score"], reverse=True)

    # Serialize input item
    input_item["_id"] = str(input_item["_id"])

    return {
        "status": "success",
        "input_item": {
            "item_id":     input_item["_id"],
            "type":        input_item.get("subcategory") or input_item.get("category", ""),
            "category":    input_item.get("category", ""),
            "color":       input_item.get("color", "unknown"),
            "pattern":     input_item.get("pattern", ""),
            "occasion":    input_item.get("occasion", ""),
            "image_url":   input_item.get("image_url", ""),
        },
        "user_profile": profile,
        "target_category": target_category,
        "recommendations": scored[:top_k],
        "total_candidates": len(candidates),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# CATEGORY NORMALIZATION (FIX 1 & 2)
# ═══════════════════════════════════════════════════════════════════════════════

# Maps raw category / subcategory strings → normalized "topwear" or "bottomwear"
_TOPWEAR_KEYWORDS = {
    "topwear", "top", "shirt", "t-shirt", "tshirt", "polo", "blouse",
    "hoodie", "jacket", "blazer", "sweater", "sweatshirt", "cardigan",
    "coat", "vest", "tank top", "crop top", "tunic", "kurta", "outerwear",
}
_BOTTOMWEAR_KEYWORDS = {
    "bottomwear", "bottom", "jeans", "pants", "trousers", "shorts",
    "skirt", "joggers", "leggings", "chinos", "cargo", "palazzos",
    "culottes", "capris",
}


def normalize_category(item: dict) -> str:
    """
    Normalize an item's category to 'topwear' or 'bottomwear'.

    Checks category first, then subcategory, then falls back to 'topwear'.
    """
    cat = (item.get("category") or "").lower().strip()
    subcat = (item.get("subcategory") or "").lower().strip()

    # Direct match on category field
    if cat in _TOPWEAR_KEYWORDS:
        return "topwear"
    if cat in _BOTTOMWEAR_KEYWORDS:
        return "bottomwear"

    # Check subcategory
    if subcat in _TOPWEAR_KEYWORDS:
        return "topwear"
    if subcat in _BOTTOMWEAR_KEYWORDS:
        return "bottomwear"

    # Partial match (e.g. "casual shirt" contains "shirt")
    for kw in _TOPWEAR_KEYWORDS:
        if kw in cat or kw in subcat:
            return "topwear"
    for kw in _BOTTOMWEAR_KEYWORDS:
        if kw in cat or kw in subcat:
            return "bottomwear"

    # Final fallback
    return "topwear"


# ═══════════════════════════════════════════════════════════════════════════════
# LEGACY FUNCTIONS (kept for backward compat — used by routes/wardrobe.py)
# ═══════════════════════════════════════════════════════════════════════════════

# ── Legacy color compatibility ────────────────────────────────────────────────
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
    c1 = c1.lower().strip()
    c2 = c2.lower().strip()
    if c1 == c2:
        return 1.0
    if c2 in COLOR_HARMONY.get(c1, []):
        return 0.8
    return 0.2


# ── Legacy category compatibility (now uses normalized categories) ───────────
CATEGORY_MATCH = {
    "t-shirt": ["jeans", "pants", "shorts", "bottomwear"],
    "shirt": ["jeans", "pants", "bottomwear"],
    "jacket": ["jeans", "pants", "bottomwear"],
    "hoodie": ["jeans", "joggers", "bottomwear"],
    "jeans": ["t-shirt", "shirt", "topwear"],
    "pants": ["t-shirt", "shirt", "topwear"],
    "joggers": ["t-shirt", "hoodie", "topwear"],
    # Normalized categories
    "topwear": ["jeans", "pants", "shorts", "joggers", "bottomwear"],
    "bottomwear": ["t-shirt", "shirt", "jacket", "hoodie", "topwear"],
}


def is_category_compatible(c1, c2):
    c1 = (c1 or "").lower().strip()
    c2 = (c2 or "").lower().strip()
    return c2 in CATEGORY_MATCH.get(c1, [])


# ── Legacy weather scoring ───────────────────────────────────────────────────
def weather_score(item, weather):
    if not weather:
        return 1.0
    temp = weather.get("temperature", 25)
    category = normalize_category(item)
    subcat = (item.get("subcategory") or item.get("category") or "").lower()
    if temp > 30:
        return 1.0 if category == "topwear" else 0.4
    if temp < 20:
        return 1.0 if subcat in ["jacket", "hoodie", "sweater", "coat"] else 0.5
    return 0.8


# ── Legacy feedback scoring ──────────────────────────────────────────────────
def feedback_score(item, feedbacks):
    score = 0
    for f in feedbacks or []:
        if f.get("item_id") == str(item["_id"]):
            if f.get("rating") == "like":
                score += 0.2
            elif f.get("rating") == "dislike":
                score -= 0.3
    return score


# ── Legacy recommend_items (used by routes/wardrobe.py) ──────────────────────
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
    input_norm_cat = normalize_category(input_item)

    for item in wardrobe_items:
        if str(item["_id"]) == str(input_item["_id"]):
            continue
        item_embedding = item.get("embedding", [])
        item_color = item.get("color", "")
        item_norm_cat = normalize_category(item)

        # Items should be from the OPPOSITE category
        if item_norm_cat == input_norm_cat:
            continue

        sim = compute_similarity(input_embedding, item_embedding)
        col = color_score(input_color, item_color)
        wea = weather_score(item, weather)
        fb = feedback_score(item, feedbacks)
        final_score = 0.5 * sim + 0.2 * col + 0.2 * wea + 0.1 * fb
        results.append((item, final_score))

    # Fallback: if no cross-category items, try all items
    if not results:
        for item in wardrobe_items:
            if str(item["_id"]) == str(input_item["_id"]):
                continue
            sim = compute_similarity(input_embedding, item.get("embedding", []))
            col = color_score(input_color, item.get("color", ""))
            results.append((item, 0.5 * sim + 0.5 * col))

    results = sorted(results, key=lambda x: x[1], reverse=True)
    return [item for item, score in results[:top_k]]


# ═══════════════════════════════════════════════════════════════════════════════
# OUTFIT SCORING (FIX 5)
# ═══════════════════════════════════════════════════════════════════════════════
def outfit_score(item_a: dict, item_b: dict) -> int:
    """
    Simple, robust scoring between two items for outfit pairing.

    +3 → good contrast pair
    +2 → color harmony
    +1 → neutral color present
    +1 → solid pattern
    -1 → pattern clash
    +2 → same occasion
    """
    score = 0

    c1 = (item_a.get("color") or "").lower().strip()
    c2 = (item_b.get("color") or "").lower().strip()

    # Color contrast (reuse the rich CONTRAST_PAIRS set)
    if c1 and c2:
        if frozenset({c1, c2}) in CONTRAST_PAIRS:
            score += 3
        elif c1 in NEUTRALS or c2 in NEUTRALS:
            score += 2
        elif c1 == c2:
            score += 1
        elif c1 in BRIGHT_COLORS and c2 in BRIGHT_COLORS:
            score -= 1
        else:
            score += 1

    # Pattern
    p1 = (item_a.get("pattern") or "solid").lower().strip()
    p2 = (item_b.get("pattern") or "solid").lower().strip()
    non_solid_1 = p1 not in ("solid", "")
    non_solid_2 = p2 not in ("solid", "")

    if non_solid_1 and non_solid_2:
        score -= 1  # pattern clash
    elif non_solid_1 or non_solid_2:
        score += 2  # printed + solid = nice
    else:
        score += 1  # both solid = clean

    # Occasion
    o1 = (item_a.get("occasion") or "").lower().strip()
    o2 = (item_b.get("occasion") or "").lower().strip()
    if o1 and o2:
        if o1 == o2:
            score += 2
        elif o2 in OCCASION_COMPAT.get(o1, set()):
            score += 1

    return score


# ═══════════════════════════════════════════════════════════════════════════════
# GENERATE OUTFIT (FIX 3, 4, 6, 7 — fully rewritten)
# ═══════════════════════════════════════════════════════════════════════════════
def generate_outfit(input_item, wardrobe_items, weather=None):
    """
    Generate outfit(s) from the user's wardrobe, starting from input_item.

    Logic:
      1. Normalize all items to topwear/bottomwear
      2. Find items from the OPPOSITE category
      3. If none found, use ALL other items as fallback
      4. Score each candidate and pick the best
      5. ALWAYS return a valid outfit if wardrobe has ≥ 2 items

    Returns:
        {
            "top": {...} or None,
            "bottom": {...} or None,
            "message": "..."
        }
    """
    print(f"[generate_outfit] Input item category: {input_item.get('category')}, "
          f"subcategory: {input_item.get('subcategory')}")

    # ── Edge case: wardrobe too small ─────────────────────────────────────
    other_items = [
        i for i in wardrobe_items
        if str(i["_id"]) != str(input_item["_id"])
    ]

    if not other_items:
        return {
            "top": None,
            "bottom": None,
            "message": "Add more items to generate outfits",
        }

    # ── FIX 1 & 2: Normalize categories ──────────────────────────────────
    input_norm = normalize_category(input_item)
    target_norm = "bottomwear" if input_norm == "topwear" else "topwear"

    print(f"[generate_outfit] Normalized: {input_norm} → looking for {target_norm}")

    # ── FIX 3: Try strict match first, then fallback ─────────────────────
    strict_candidates = [
        i for i in other_items
        if normalize_category(i) == target_norm
    ]

    candidates = strict_candidates if strict_candidates else other_items

    print(f"[generate_outfit] Strict candidates: {len(strict_candidates)}, "
          f"Total candidates: {len(candidates)}")

    # ── FIX 5: Score each candidate ──────────────────────────────────────
    scored = []
    for candidate in candidates:
        s = outfit_score(input_item, candidate)
        scored.append((candidate, s))

    scored.sort(key=lambda x: x[1], reverse=True)

    # ── FIX 4: Guaranteed outfit ─────────────────────────────────────────
    best_match = scored[0][0]  # always exists since candidates is non-empty

    # Assign top and bottom
    if input_norm == "topwear":
        top_item = input_item
        bottom_item = best_match
    else:
        top_item = best_match
        bottom_item = input_item

    # Serialize ObjectId for JSON response
    for item in [top_item, bottom_item]:
        if item and "_id" in item:
            item["_id"] = str(item["_id"])

    print(f"[generate_outfit] ✅ Outfit: top={top_item.get('subcategory', top_item.get('category'))}, "
          f"bottom={bottom_item.get('subcategory', bottom_item.get('category'))}, "
          f"score={scored[0][1]}")

    return {
        "top": top_item,
        "bottom": bottom_item,
        "message": "Outfit generated successfully",
    }