"""
Complete AI Clothing Vision Pipeline
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 1 → Background Removal (rembg U²-Net)
Step 2 → Single-item detection (pixel distribution analysis)
Step 3 → CLIP-based Clothing Type Classification (FINAL AUTHORITY)
Step 4 → KMeans Color Extraction (scikit-learn)
Step 5 → Pattern Detection (Gemini Vision — pattern/style ONLY)
Step 6 → Structured JSON output saved to MongoDB

IMPORTANT:
  - CLIP is the SOLE authority for clothing TYPE and CATEGORY
  - Gemini is used ONLY for pattern, material, style
  - Category is DERIVED from CLIP type via CATEGORY_MAP
"""
import os
import io
import json
import base64
import requests
import numpy as np
import torch
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
# STEP 5 — CLIP-based Clothing Type Classification (FINAL AUTHORITY)
# ═══════════════════════════════════════════════════════════════════════════════

# ── Fashion labels ────────────────────────────────────────────────────────────
TOP_LABELS    = ["shirt", "t-shirt", "hoodie", "jacket", "kurta"]
BOTTOM_LABELS = ["jeans", "trousers", "shorts", "track pants"]
ALL_LABELS    = TOP_LABELS + BOTTOM_LABELS   # used for full-image classification

# ── Authoritative category mapping (CLIP type → category) ────────────────────
CATEGORY_MAP = {
    "shirt":       "topwear",
    "t-shirt":     "topwear",
    "hoodie":      "topwear",
    "jacket":      "topwear",
    "kurta":       "topwear",
    "jeans":       "bottomwear",
    "trousers":    "bottomwear",
    "shorts":      "bottomwear",
    "track pants": "bottomwear",
}

# ── Global CLIP model (loaded once, reused across requests) ───────────────────
_clip_model     = None
_clip_processor = None

def load_clip_model():
    """Load CLIP model and processor once globally. Thread-safe via GIL."""
    global _clip_model, _clip_processor
    if _clip_model is None:
        print("[CLIP] Loading openai/clip-vit-base-patch32 …")
        from transformers import CLIPModel, CLIPProcessor
        model_name = "openai/clip-vit-base-patch32"
        _clip_processor = CLIPProcessor.from_pretrained(model_name)
        _clip_model     = CLIPModel.from_pretrained(model_name)
        _clip_model.eval()        # inference mode – no grad needed
        print("[CLIP] Model loaded ✔")
    return _clip_model, _clip_processor


def classify_clothing(image: Image.Image, labels: list) -> dict:
    """
    Classify a clothing image against a list of text labels using CLIP.

    Returns:
        {"type": str, "confidence": float, "all_scores": dict}
    """
    model, processor = load_clip_model()

    # Prepare text prompts ("a photo of a <label>" improves CLIP accuracy)
    text_prompts = [f"a photo of a {label}" for label in labels]

    # Resize to 224×224 for CLIP
    img_rgb = image.convert("RGB").resize((224, 224), Image.LANCZOS)

    # Tokenize and encode
    inputs = processor(
        text=text_prompts,
        images=img_rgb,
        return_tensors="pt",
        padding=True,
    )

    with torch.no_grad():
        outputs = model(**inputs)

    # Compute softmax probabilities from image-text similarity
    logits = outputs.logits_per_image[0]        # shape: (num_labels,)
    probs  = torch.softmax(logits, dim=0).cpu().numpy()

    best_idx  = int(probs.argmax())
    best_label = labels[best_idx]
    confidence = round(float(probs[best_idx]), 4)

    all_scores = {label: round(float(probs[i]), 4) for i, label in enumerate(labels)}

    print(f"[CLIP] Classified → {best_label} ({confidence:.2%}) | scores: {all_scores}")
    return {"type": best_label, "confidence": confidence, "all_scores": all_scores}


# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2b — Single-item Detection
# ═══════════════════════════════════════════════════════════════════════════════
def detect_single_item(rgba_image: Image.Image) -> bool:
    """
    Detect whether the image contains a SINGLE clothing item or a full outfit.

    Logic:
      - Compute the vertical distribution of non-transparent pixels
      - If the clothing object is concentrated in one region (top-heavy OR
        bottom-heavy), it's a single item
      - If pixels are spread fairly evenly across the full height, it's an outfit

    Returns:
        True  → single item (do NOT split)
        False → multiple items / outfit (split into top/bottom)
    """
    arr = np.array(rgba_image)
    alpha = arr[:, :, 3]
    h = alpha.shape[0]

    if h == 0:
        return True

    mid = h // 2
    top_pixels = (alpha[:mid, :] > 10).sum()
    bot_pixels = (alpha[mid:, :] > 10).sum()
    total_pixels = top_pixels + bot_pixels

    if total_pixels < 100:
        return True   # barely any content

    top_ratio = top_pixels / total_pixels
    bot_ratio = bot_pixels / total_pixels

    # If one half has ≥70% of all clothing pixels → it's a single item
    is_single = (top_ratio >= 0.70) or (bot_ratio >= 0.70)

    print(f"[SingleItem] top={top_ratio:.1%} bot={bot_ratio:.1%} → {'SINGLE' if is_single else 'OUTFIT'}")
    return is_single


def process_outfit(rgba_image: Image.Image) -> dict:
    """
    Smart CLIP-based outfit classification.

    IF single item → classify full image against ALL labels
    IF outfit       → split into top/bottom, classify each half

    Returns dict with topwear/bottomwear sub-dicts including type + confidence.
    """
    is_single = detect_single_item(rgba_image)

    if is_single:
        # ── SINGLE ITEM: classify full image against ALL labels ──────────
        result = classify_clothing(rgba_image, ALL_LABELS)
        clip_type   = result["type"]
        confidence  = result["confidence"]
        category    = CATEGORY_MAP.get(clip_type, "topwear")

        # Apply confidence filter
        if confidence < 0.5:
            clip_type = "unknown"

        print(f"[Pipeline] Single item detected: {clip_type} → {category} ({confidence:.2%})")

        if category == "topwear":
            return {
                "is_single": True,
                "single_category": "topwear",
                "topwear":    {"type": clip_type, "confidence": confidence},
                "bottomwear": {"type": "unknown", "confidence": 0.0},
            }
        else:
            return {
                "is_single": True,
                "single_category": "bottomwear",
                "topwear":    {"type": "unknown", "confidence": 0.0},
                "bottomwear": {"type": clip_type, "confidence": confidence},
            }
    else:
        # ── OUTFIT: split and classify each half ─────────────────────────
        top_crop, bot_crop = segment_top_bottom(rgba_image)
        top_result = classify_clothing(top_crop, TOP_LABELS)
        bot_result = classify_clothing(bot_crop, BOTTOM_LABELS)

        top_type = top_result["type"] if top_result["confidence"] >= 0.5 else "unknown"
        bot_type = bot_result["type"] if bot_result["confidence"] >= 0.5 else "unknown"

        print(f"[Pipeline] Outfit: top={top_type}({top_result['confidence']:.2%}), bot={bot_type}({bot_result['confidence']:.2%})")

        return {
            "is_single": False,
            "single_category": None,
            "topwear":    {"type": top_type,    "confidence": top_result["confidence"]},
            "bottomwear": {"type": bot_type,    "confidence": bot_result["confidence"]},
        }


# ═══════════════════════════════════════════════════════════════════════════════
# STEP 6 — Main Pipeline: Analyse Clothing Image → Structured Output
# ═══════════════════════════════════════════════════════════════════════════════
def analyze_clothing_image(image_url: str = None, file_path: str = None) -> dict:
    """
    Full AI pipeline:
      1. Load & resize image
      2. Remove background (rembg)
      3. Detect single item vs outfit
      4. CLIP classification (SOLE AUTHORITY for type + category)
      5. KMeans colour extraction
      6. Gemini Vision: pattern ONLY
      7. Return structured dict for MongoDB

    CLIP is the FINAL AUTHORITY for clothing type and category.
    Category is DERIVED from CLIP type via CATEGORY_MAP.
    Gemini is restricted to pattern/style ONLY.
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

    # ── Step 2+3: Smart CLIP classification (single item OR split) ────────────
    print("[Vision] Running CLIP clothing classification…")
    try:
        outfit = process_outfit(rgba)
        is_single       = outfit["is_single"]
        single_category = outfit.get("single_category")
        top_type        = outfit["topwear"]["type"]
        top_confidence  = outfit["topwear"]["confidence"]
        bot_type        = outfit["bottomwear"]["type"]
        bot_confidence  = outfit["bottomwear"]["confidence"]
    except Exception as e:
        print(f"[CLIP] Failed ({e}), using fallback…")
        is_single       = True
        single_category = "topwear"
        top_type        = "unknown"
        top_confidence  = 0.0
        bot_type        = "unknown"
        bot_confidence  = 0.0

    # ── Step 4: Colour extraction ─────────────────────────────────────────────
    print("[Vision] Extracting colours…")
    top_crop, bot_crop = segment_top_bottom(rgba)

    if is_single:
        # For single items, extract colour from the full image
        full_colours = extract_kmeans_colours(rgba, k=3)
        if single_category == "topwear":
            top_colours = full_colours
            bot_colours = [{"name":"unknown","hex":"#808080","rgb":"rgb(128,128,128)","r":128,"g":128,"b":128,"weight":1.0}]
        else:
            top_colours = [{"name":"unknown","hex":"#808080","rgb":"rgb(128,128,128)","r":128,"g":128,"b":128,"weight":1.0}]
            bot_colours = full_colours
    else:
        top_colours = extract_kmeans_colours(top_crop, k=3)
        bot_colours = extract_kmeans_colours(bot_crop, k=3)

    # ── Step 5: Gemini pattern detection ONLY (concurrent) ────────────────────
    import concurrent.futures
    pattern_image = rgba if is_single else None
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex:
        if is_single:
            # Pattern on the full image
            section_name = single_category or "clothing"
            f_pattern = ex.submit(detect_pattern_gemini, rgba, section_name)
            main_pattern = f_pattern.result()
            top_pattern  = main_pattern if single_category == "topwear"  else "solid"
            bot_pattern  = main_pattern if single_category == "bottomwear" else "solid"
        else:
            f_top_pattern = ex.submit(detect_pattern_gemini, top_crop, "topwear")
            f_bot_pattern = ex.submit(detect_pattern_gemini, bot_crop, "bottomwear")
            top_pattern = f_top_pattern.result()
            bot_pattern = f_bot_pattern.result()

    # ── Determine main category — DERIVED FROM CLIP TYPE (not pixel count) ────
    # CLIP is the sole authority. Category comes from CATEGORY_MAP.
    if is_single:
        main_category = single_category
        main_subcat   = top_type if single_category == "topwear" else bot_type
        main_conf     = top_confidence if single_category == "topwear" else bot_confidence
        main_pattern_final = top_pattern if single_category == "topwear" else bot_pattern
        dominant = (top_colours if single_category == "topwear" else bot_colours)
        dominant_info = dominant[0] if dominant else {}
    else:
        # For outfit: pick the higher-confidence detection as the main item
        if top_confidence >= bot_confidence:
            main_category = "topwear"
            main_subcat   = top_type
            main_conf     = top_confidence
            main_pattern_final = top_pattern
            dominant_info = top_colours[0] if top_colours else {}
        else:
            main_category = "bottomwear"
            main_subcat   = bot_type
            main_conf     = bot_confidence
            main_pattern_final = bot_pattern
            dominant_info = bot_colours[0] if bot_colours else {}

    main_colour = dominant_info.get("name", "unknown")
    main_hex    = dominant_info.get("hex",  "#808080")
    main_rgb    = dominant_info.get("rgb",  "rgb(128,128,128)")

    # Infer style/material/season/occasion from CLIP's subcat
    style    = _infer_style(main_subcat)
    material = _infer_material(main_subcat)
    season   = _infer_season(main_subcat)
    occasion = _infer_occasion(main_subcat)

    dominant_top = top_colours[0] if top_colours else {}
    dominant_bot = bot_colours[0] if bot_colours else {}

    result = {
        # ── Flat fields (for card display & filtering) ──
        "category":    main_category,
        "subcategory": main_subcat,
        "style":       style,
        "color":       main_colour,
        "color_hex":   main_hex,
        "color_rgb":   main_rgb,
        "pattern":     main_pattern_final,
        "material":    material,
        "season":      season,
        "occasion":    occasion,

        # ── Structured sub-objects (detailed, with CLIP confidence) ──
        "topwear": {
            "type":          top_type,
            "confidence":    top_confidence,
            "pattern":       top_pattern,
            "colors":        top_colours,
            "dominant_rgb":  [dominant_top.get("r",128), dominant_top.get("g",128), dominant_top.get("b",128)],
        },
        "bottomwear": {
            "type":          bot_type,
            "confidence":    bot_confidence,
            "pattern":       bot_pattern,
            "colors":        bot_colours,
            "dominant_rgb":  [dominant_bot.get("r",128), dominant_bot.get("g",128), dominant_bot.get("b",128)],
        },
    }

    print(f"[Vision] ✔ Result: cat={main_category} sub={main_subcat} color={main_colour} pattern={main_pattern_final}")
    print(f"[Vision] ✔ CLIP: top={top_type}({top_confidence:.2%}), bottom={bot_type}({bot_confidence:.2%}), single={is_single}")
    return result


# ── Helper inference functions ────────────────────────────────────────────────
def _infer_style(subcat: str) -> str:
    m = {
        "jeans": "denim", "cargo pants": "cargo", "joggers": "joggers",
        "kurta": "ethnic", "hoodie": "streetwear", "blazer": "formal",
        "jacket": "streetwear", "leggings": "sporty", "shorts": "sporty",
        "trousers": "formal", "t-shirt": "casual", "shirt": "casual",
        "track pants": "sporty", "unknown": "casual",
    }
    return m.get(subcat, "casual")

def _infer_material(subcat: str) -> str:
    m = {
        "jeans": "denim", "hoodie": "fleece", "sweater": "wool",
        "t-shirt": "cotton", "shirt": "cotton", "shorts": "cotton",
        "leggings": "polyester", "trousers": "polyester", "cargo pants": "cotton",
        "chinos": "cotton", "joggers": "fleece", "track pants": "polyester",
        "unknown": "cotton",
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
            "type": "shirt", "confidence": 0.0, "pattern": "solid",
            "colors": [{"name":"unknown","hex":"#808080","rgb":"rgb(128,128,128)","r":128,"g":128,"b":128,"weight":1.0}],
            "dominant_rgb": [128, 128, 128],
        },
        "bottomwear": {
            "type": "jeans", "confidence": 0.0, "pattern": "solid",
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