"""
Complete AI Clothing Vision Pipeline
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 1 → Background Removal (rembg U²-Net)
Step 2 → Top/Bottom Segmentation (numpy slicing)
Step 3 → KMeans Color Extraction (scikit-learn)
Step 4 → Pattern Detection (Gemini Vision)
Step 5 → Clothing Type Detection (Gemini + rules)
Step 6 → Structured JSON output saved to MongoDB
"""
import os
import io
import json
import base64
import requests
import numpy as np
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY     = os.getenv("GEMINI_API_KEY", "")
CLARIFAI_PAT       = os.getenv("CLARIFAI_PAT")
CLARIFAI_USER_ID   = os.getenv("CLARIFAI_USER_ID")
CLARIFAI_APP_ID    = os.getenv("CLARIFAI_APP_ID")
GENERAL_MODEL_ID   = "aaa03c23b3724a16a56b629203edc62c"

# ── 40-colour palette (RGB reference) ───────────────────────────────────────
COLOUR_PALETTE = [
    ("red",         (220, 50, 50)),   ("crimson",    (180, 20, 30)),
    ("coral",       (255,127, 80)),   ("orange",     (255,140,  0)),
    ("amber",       (255,191,  0)),   ("yellow",     (255,220, 20)),
    ("lime green",  (50, 200, 50)),   ("green",      ( 34,139, 34)),
    ("olive",       (107,142, 35)),   ("teal",       (  0,128,128)),
    ("cyan",        (  0,180,200)),   ("sky blue",   (135,206,235)),
    ("blue",        ( 30, 80,200)),   ("navy blue",  ( 15, 30,100)),
    ("royal blue",  ( 65,105,225)),   ("indigo",     ( 75,  0,130)),
    ("violet",      (148,  0,211)),   ("purple",     (120, 50,180)),
    ("pink",        (255,105,180)),   ("rose",       (220, 80,120)),
    ("maroon",      (128,  0,  0)),   ("brown",      (139, 90, 43)),
    ("tan",         (210,180,140)),   ("beige",      (245,245,220)),
    ("cream",       (255,253,208)),   ("white",      (255,255,255)),
    ("off white",   (250,249,240)),   ("light grey", (211,211,211)),
    ("grey",        (128,128,128)),   ("dark grey",  ( 64, 64, 64)),
    ("charcoal",    ( 40, 40, 40)),   ("black",      ( 20, 20, 20)),
    ("khaki",       (195,176,145)),   ("mustard",    (220,170, 40)),
    ("turquoise",   ( 64,224,208)),   ("lavender",   (230,190,255)),
    ("peach",       (255,200,160)),   ("mint",       (170,240,210)),
    ("gold",        (212,175, 55)),   ("silver",     (192,192,192)),
]

def _nearest_colour_name(r, g, b):
    best, dist = "unknown", float("inf")
    for name, ref in COLOUR_PALETTE:
        d = sum((a-b_)**2 for a, b_ in zip((r,g,b), ref)) ** 0.5
        if d < dist:
            dist, best = d, name
    return best

def _rgb_to_hex(r, g, b):
    return "#{:02X}{:02X}{:02X}".format(int(r), int(g), int(b))

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 1 — Background Removal
# ═══════════════════════════════════════════════════════════════════════════════
def remove_background(pil_image: Image.Image) -> Image.Image:
    """Remove background using rembg U²-Net. Returns RGBA image."""
    try:
        from rembg import remove
        # rembg needs bytes input
        buf = io.BytesIO()
        pil_image.save(buf, format="PNG")
        buf.seek(0)
        out_bytes = remove(buf.read())
        result = Image.open(io.BytesIO(out_bytes)).convert("RGBA")
        return result
    except Exception as e:
        print(f"[rembg] Failed ({e}), skipping background removal")
        return pil_image.convert("RGBA")


# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2 — Top / Bottom Segmentation
# ═══════════════════════════════════════════════════════════════════════════════
def segment_top_bottom(rgba_image: Image.Image):
    """Split RGBA image into top-half and bottom-half crops."""
    w, h = rgba_image.size
    mid = h // 2
    top_crop    = rgba_image.crop((0,   0,  w, mid))
    bottom_crop = rgba_image.crop((0, mid,  w,  h))
    return top_crop, bottom_crop


# ═══════════════════════════════════════════════════════════════════════════════
# STEP 3 — KMeans Colour Extraction
# ═══════════════════════════════════════════════════════════════════════════════
def extract_kmeans_colours(rgba_image: Image.Image, k: int = 3):
    """
    Run k-means on non-transparent pixels.
    Returns list of dicts: {name, hex, rgb, r, g, b, weight}
    """
    from sklearn.cluster import KMeans

    arr = np.array(rgba_image.convert("RGBA"))
    # Keep only pixels where alpha > 10 (i.e. not background)
    mask = arr[:, :, 3] > 10
    pixels = arr[mask][:, :3].astype(float)

    if len(pixels) < k * 10:
        # Too few pixels – fallback to average
        if len(pixels) == 0:
            return [{"name": "unknown", "hex": "#808080", "rgb": "rgb(128,128,128)", "r":128,"g":128,"b":128,"weight":1.0}]
        mean = pixels.mean(axis=0)
        r, g, b = int(mean[0]), int(mean[1]), int(mean[2])
        return [{"name": _nearest_colour_name(r,g,b), "hex": _rgb_to_hex(r,g,b), "rgb": f"rgb({r},{g},{b})", "r":r,"g":g,"b":b,"weight":1.0}]

    # Downsample for speed
    if len(pixels) > 5000:
        idx = np.random.choice(len(pixels), 5000, replace=False)
        pixels = pixels[idx]

    km = KMeans(n_clusters=k, n_init=5, random_state=42)
    km.fit(pixels)
    centres = km.cluster_centers_
    labels  = km.labels_
    counts  = np.bincount(labels)
    total   = counts.sum()

    result = []
    for i in np.argsort(-counts):   # dominant first
        r, g, b = centres[i]
        r, g, b = int(r), int(g), int(b)
        # Skip near-black background leftovers
        if r < 15 and g < 15 and b < 15:
            continue
        result.append({
            "name":   _nearest_colour_name(r, g, b),
            "hex":    _rgb_to_hex(r, g, b),
            "rgb":    f"rgb({r},{g},{b})",
            "r": r, "g": g, "b": b,
            "weight": round(float(counts[i]) / total, 3),
        })
    if not result:
        result.append({"name":"unknown","hex":"#808080","rgb":"rgb(128,128,128)","r":128,"g":128,"b":128,"weight":1.0})
    return result


# ═══════════════════════════════════════════════════════════════════════════════
# STEP 4 — Pattern Detection (Gemini Vision)
# ═══════════════════════════════════════════════════════════════════════════════
def _pil_to_base64(pil_image: Image.Image) -> str:
    buf = io.BytesIO()
    pil_image.convert("RGB").save(buf, format="JPEG", quality=85)
    return base64.b64encode(buf.getvalue()).decode()


def detect_pattern_gemini(crop_image: Image.Image, section: str = "topwear") -> str:
    """Ask Gemini Vision to identify the clothing pattern."""
    if not GEMINI_API_KEY:
        return "solid"
    try:
        b64 = _pil_to_base64(crop_image)
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key={GEMINI_API_KEY}"
        body = {
            "contents": [{
                "parts": [
                    {"text": f"Look at this {section} clothing image. Identify the pattern. Reply with ONLY ONE word from: solid, striped, checked, printed, floral, graphic, camo, abstract, polka_dots. No explanation."},
                    {"inline_data": {"mime_type": "image/jpeg", "data": b64}}
                ]
            }],
            "generationConfig": {"temperature": 0.1, "maxOutputTokens": 10}
        }
        res = requests.post(url, json=body, timeout=15)
        raw = res.json()["candidates"][0]["content"]["parts"][0]["text"].strip().lower()
        # Clean to single word
        valid = {"solid","striped","checked","printed","floral","graphic","camo","abstract","polka_dots","polka dots"}
        for word in raw.split():
            w = word.strip(".,;:")
            if w in valid:
                return w
        return raw.split()[0].strip(".,;:") if raw else "solid"
    except Exception as e:
        print(f"[Pattern Gemini] {e}")
        return _detect_pattern_rules(crop_image)


def _detect_pattern_rules(pil_image: Image.Image) -> str:
    """Rule-based fallback: analyse variance to guess solid vs patterned."""
    arr = np.array(pil_image.convert("RGB")).astype(float)
    std = arr.std(axis=(0,1)).mean()
    if std < 18:
        return "solid"
    elif std < 35:
        return "subtle pattern"
    return "printed"


# ═══════════════════════════════════════════════════════════════════════════════
# STEP 5 — Clothing Type Detection (Gemini + Rules)
# ═══════════════════════════════════════════════════════════════════════════════
TOPWEAR_TYPES    = {"t-shirt","shirt","hoodie","sweater","blouse","tank top","kurta","jacket","blazer","crop top","polo"}
BOTTOMWEAR_TYPES = {"jeans","trousers","shorts","skirt","leggings","chinos","cargo pants","joggers","dhoti"}

def detect_clothing_type_gemini(crop_image: Image.Image, section: str = "top") -> str:
    """Ask Gemini to name the clothing type."""
    if not GEMINI_API_KEY:
        return "shirt" if section == "top" else "jeans"
    try:
        b64 = _pil_to_base64(crop_image)
        if section == "top":
            options = "t-shirt, shirt, hoodie, sweater, blouse, tank top, kurta, jacket, blazer, crop top, polo"
        else:
            options = "jeans, trousers, shorts, skirt, leggings, chinos, cargo pants, joggers"

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key={GEMINI_API_KEY}"
        body = {
            "contents": [{
                "parts": [
                    {"text": f"What type of {section}wear clothing is in this image? Reply with ONLY ONE item from this list: {options}. No explanation."},
                    {"inline_data": {"mime_type": "image/jpeg", "data": b64}}
                ]
            }],
            "generationConfig": {"temperature": 0.1, "maxOutputTokens": 15}
        }
        res = requests.post(url, json=body, timeout=15)
        raw = res.json()["candidates"][0]["content"]["parts"][0]["text"].strip().lower()
        # Match to known types
        known = TOPWEAR_TYPES if section == "top" else BOTTOMWEAR_TYPES
        for word in raw.replace(",","").split():
            if word in known:
                return word
        return raw.strip(".,;:")[:20]
    except Exception as e:
        print(f"[Type Gemini] {e}")
        return "shirt" if section == "top" else "jeans"


# ═══════════════════════════════════════════════════════════════════════════════
# STEP 6 — Main Pipeline: Analyse Clothing Image → Structured Output
# ═══════════════════════════════════════════════════════════════════════════════
def analyze_clothing_image(image_url: str = None, file_path: str = None) -> dict:
    """
    Full AI pipeline:
      1. Load & resize image
      2. Remove background (rembg)
      3. Split top / bottom
      4. KMeans colour extraction for each half
      5. Gemini Vision: pattern + clothing type
      6. Return structured dict for MongoDB

    Returns a flat dict that also contains 'topwear' and 'bottomwear' sub-dicts.
    """
    # ── Load image ────────────────────────────────────────────────────────────
    try:
        if file_path and os.path.exists(file_path):
            img = Image.open(file_path)
        elif image_url:
            r = requests.get(image_url, timeout=10)
            img = Image.open(io.BytesIO(r.content))
        else:
            raise ValueError("No image source provided")
    except Exception as e:
        print(f"[Vision] Load error: {e}")
        return _fallback_result()

    # ── Resize (max 512px on largest side) ───────────────────────────────────
    img.thumbnail((512, 512), Image.LANCZOS)
    img = img.convert("RGBA")

    # ── Step 1: Remove background ─────────────────────────────────────────────
    print("[Vision] Removing background…")
    rgba = remove_background(img)

    # ── Step 2: Segment ───────────────────────────────────────────────────────
    top_crop, bot_crop = segment_top_bottom(rgba)

    # ── Step 3: Colour extraction ─────────────────────────────────────────────
    print("[Vision] Extracting colours…")
    top_colours = extract_kmeans_colours(top_crop, k=3)
    bot_colours = extract_kmeans_colours(bot_crop, k=3)

    # ── Steps 4 & 5: Gemini (pattern + type) — concurrent via threads ─────────
    import concurrent.futures
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
        f_top_type    = ex.submit(detect_clothing_type_gemini, top_crop, "top")
        f_bot_type    = ex.submit(detect_clothing_type_gemini, bot_crop, "bottom")
        f_top_pattern = ex.submit(detect_pattern_gemini, top_crop, "topwear")
        f_bot_pattern = ex.submit(detect_pattern_gemini, bot_crop, "bottomwear")

        top_type    = f_top_type.result()
        bot_type    = f_bot_type.result()
        top_pattern = f_top_pattern.result()
        bot_pattern = f_bot_pattern.result()

    # ── Determine main (overall) category ─────────────────────────────────────
    # Dominant colour for quick card display
    dominant_top = top_colours[0] if top_colours else {}
    dominant_bot = bot_colours[0] if bot_colours else {}

    # Category = topwear if the top region has more opaque pixels than bottom
    top_px = np.array(top_crop)
    bot_px = np.array(bot_crop)
    top_count = (top_px[:,:,3] > 10).sum()
    bot_count = (bot_px[:,:,3] > 10).sum()

    if top_count >= bot_count * 0.7:   # top has meaningful pixels → it's topwear
        main_category  = "topwear"
        main_subcat    = top_type
        main_colour    = dominant_top.get("name", "unknown")
        main_hex       = dominant_top.get("hex",  "#808080")
        main_rgb       = dominant_top.get("rgb",  "rgb(128,128,128)")
        main_pattern   = top_pattern
    else:
        main_category  = "bottomwear"
        main_subcat    = bot_type
        main_colour    = dominant_bot.get("name", "unknown")
        main_hex       = dominant_bot.get("hex",  "#808080")
        main_rgb       = dominant_bot.get("rgb",  "rgb(128,128,128)")
        main_pattern   = bot_pattern

    # Infer style/material/season/occasion from subcat
    style    = _infer_style(main_subcat)
    material = _infer_material(main_subcat)
    season   = _infer_season(main_subcat)
    occasion = _infer_occasion(main_subcat)

    result = {
        # ── Flat fields (for card display & filtering) ──
        "category":    main_category,
        "subcategory": main_subcat,
        "style":       style,
        "color":       main_colour,
        "color_hex":   main_hex,
        "color_rgb":   main_rgb,
        "pattern":     main_pattern,
        "material":    material,
        "season":      season,
        "occasion":    occasion,

        # ── Structured sub-objects (detailed) ──
        "topwear": {
            "type":          top_type,
            "pattern":       top_pattern,
            "colors":        top_colours,        # list of {name, hex, rgb, weight}
            "dominant_rgb":  [dominant_top.get("r",128), dominant_top.get("g",128), dominant_top.get("b",128)],
        },
        "bottomwear": {
            "type":          bot_type,
            "pattern":       bot_pattern,
            "colors":        bot_colours,
            "dominant_rgb":  [dominant_bot.get("r",128), dominant_bot.get("g",128), dominant_bot.get("b",128)],
        },
    }

    print(f"[Vision] Result: cat={main_category} sub={main_subcat} color={main_colour} pattern={main_pattern}")
    return result


# ── Helper inference functions ────────────────────────────────────────────────
def _infer_style(subcat: str) -> str:
    m = {
        "jeans": "denim", "cargo pants": "cargo", "joggers": "joggers",
        "kurta": "ethnic", "hoodie": "streetwear", "blazer": "formal",
        "jacket": "streetwear", "leggings": "sporty", "shorts": "sporty",
        "trousers": "formal", "t-shirt": "casual", "shirt": "casual",
    }
    return m.get(subcat, "casual")

def _infer_material(subcat: str) -> str:
    m = {
        "jeans": "denim", "hoodie": "fleece", "sweater": "wool",
        "t-shirt": "cotton", "shirt": "cotton", "shorts": "cotton",
        "leggings": "polyester", "trousers": "polyester", "cargo pants": "cotton",
        "chinos": "cotton", "joggers": "fleece",
    }
    return m.get(subcat, "cotton")

def _infer_season(subcat: str) -> str:
    cold = {"sweater","hoodie","jacket","blazer","coat"}
    hot  = {"shorts","tank top","crop top"}
    if subcat in cold: return "winter"
    if subcat in hot:  return "summer"
    return "all-season"

def _infer_occasion(subcat: str) -> str:
    formal = {"blazer","trousers","shirt"}
    ethnic = {"kurta","dhoti"}
    sport  = {"leggings","joggers","shorts"}
    if subcat in formal: return "formal"
    if subcat in ethnic: return "ethnic"
    if subcat in sport:  return "sport"
    return "casual"


def _fallback_result() -> dict:
    return {
        "category": "topwear", "subcategory": "shirt", "style": "casual",
        "color": "unknown", "color_hex": "#808080", "color_rgb": "rgb(128,128,128)",
        "pattern": "solid", "material": "cotton", "season": "all-season", "occasion": "casual",
        "topwear": {
            "type": "shirt", "pattern": "solid",
            "colors": [{"name":"unknown","hex":"#808080","rgb":"rgb(128,128,128)","r":128,"g":128,"b":128,"weight":1.0}],
            "dominant_rgb": [128, 128, 128],
        },
        "bottomwear": {
            "type": "jeans", "pattern": "solid",
            "colors": [{"name":"unknown","hex":"#808080","rgb":"rgb(128,128,128)","r":128,"g":128,"b":128,"weight":1.0}],
            "dominant_rgb": [128, 128, 128],
        },
    }


# ── Legacy shim functions (existing code wont break) ─────────────────────────
def detect_category(image_url: str) -> str:
    return "topwear"

def detect_dominant_color(image_url: str) -> str:
    return "unknown"

def detect_pattern(image_url: str) -> str:
    return "solid"