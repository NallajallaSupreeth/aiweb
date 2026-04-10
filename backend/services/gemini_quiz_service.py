import os
import json
import uuid
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
MODEL = "gemini-2.0-flash-lite"

# ── Fallback questions used when Gemini is unavailable ───────────────────────
FALLBACK_QUESTIONS = [
    {
        "question_id": "fb_001",
        "type": "mcq",
        "question": "You have an important college presentation today. How do you dress?",
        "emoji": "🎓",
        "context": {"occasion": "College presentation", "weather": "Mild", "mood": "Confident"},
        "options": [
            {"id": "A", "label": "Smart Casual", "text": "White Oxford shirt, dark slim chinos, clean white sneakers — polished but relaxed", "emoji": "👔", "style_tags": ["smart casual", "minimalist"], "color_tags": ["white", "navy"], "fit": "slim", "confidence_weight": 0.85},
            {"id": "B", "label": "Streetwear Pro", "text": "Graphic tee layered under an open blazer, cargo pants, chunky sneakers — edgy but composed", "emoji": "🧢", "style_tags": ["streetwear", "urban"], "color_tags": ["black", "grey"], "fit": "oversized", "confidence_weight": 0.75},
            {"id": "C", "label": "Minimal Chic", "text": "Monochrome outfit — beige turtleneck, straight-cut trousers, loafers — clean and authoritative", "emoji": "⬜", "style_tags": ["minimalist", "classic"], "color_tags": ["beige", "camel"], "fit": "relaxed", "confidence_weight": 0.80},
            {"id": "D", "label": "Ethnic Modern", "text": "Printed Nehru jacket over a plain kurta with tailored pants — cultural and striking", "emoji": "🌺", "style_tags": ["ethnic", "fusion"], "color_tags": ["earthy", "ochre"], "fit": "tailored", "confidence_weight": 0.70},
        ],
        "analysis_hint": "Tests formal vs casual preference in achievement settings",
        "next_question_strategy": {"if_A": "Explore smart-casual depth", "if_B": "Probe streetwear styling choices", "if_C": "Deep dive into minimalism", "if_D": "Explore ethnic/fusion preferences"},
    },
    {
        "question_id": "fb_002",
        "type": "mcq",
        "question": "It's a rainy Saturday and you're heading to a cozy café to work remotely. What's your go-to?",
        "emoji": "☕",
        "context": {"occasion": "Cafe work session", "weather": "Rainy", "mood": "Relaxed, focused"},
        "options": [
            {"id": "A", "label": "Cozy Minimal", "text": "Cream ribbed knit sweater, straight-leg jeans, white sneakers — effortless and warm", "emoji": "🤎", "style_tags": ["casual", "minimalist"], "color_tags": ["cream", "denim"], "fit": "relaxed", "confidence_weight": 0.85},
            {"id": "B", "label": "Urban Layer", "text": "Oversized hoodie under a longline trench coat, joggers, high-top sneakers — street-ready even on rainy days", "emoji": "🧥", "style_tags": ["streetwear", "layered"], "color_tags": ["grey", "olive"], "fit": "oversized", "confidence_weight": 0.80},
            {"id": "C", "label": "Soft Academic", "text": "Plaid flannel shirt, brown corduroy trousers, leather Chelsea boots — bookish and intentional", "emoji": "📚", "style_tags": ["preppy", "classic"], "color_tags": ["brown", "plaid"], "fit": "slim", "confidence_weight": 0.75},
            {"id": "D", "label": "Luxe Comfort", "text": "Cashmere turtleneck, tailored jogger pants, suede loafers — premium loungewear energy", "emoji": "✨", "style_tags": ["luxury", "minimal"], "color_tags": ["charcoal", "camel"], "fit": "tailored", "confidence_weight": 0.70},
        ],
        "analysis_hint": "Identifies casual preference and layering habits",
        "next_question_strategy": {"if_A": "Focus on neutral palette depth", "if_B": "Explore outerwear and layering", "if_C": "Probe prep and academic aesthetics", "if_D": "Explore luxury casual territory"},
    },
    {
        "question_id": "fb_003",
        "type": "mcq",
        "question": "Your best friend's birthday party is at a rooftop bar this evening. What are you wearing?",
        "emoji": "🌇",
        "context": {"occasion": "Rooftop birthday party", "weather": "Warm evening", "mood": "Celebratory, social"},
        "options": [
            {"id": "A", "label": "Night Minimal", "text": "All-black: slim crew-neck tee, tailored black trousers, sleek leather boots — understated cool", "emoji": "🖤", "style_tags": ["minimalist", "formal"], "color_tags": ["black"], "fit": "slim", "confidence_weight": 0.80},
            {"id": "B", "label": "Statement Streetwear", "text": "Bold printed short-sleeve shirt, wide-leg cargo pants, fresh colorway Jordan 1s — loud and proud", "emoji": "🔥", "style_tags": ["streetwear", "bold"], "color_tags": ["vibrant", "multi"], "fit": "oversized", "confidence_weight": 0.85},
            {"id": "C", "label": "Smart Elevated", "text": "Linen blazer over a fitted polo, slim chinos, suede loafers in tan — social and polished", "emoji": "🍸", "style_tags": ["smart casual", "classic"], "color_tags": ["tan", "navy"], "fit": "tailored", "confidence_weight": 0.75},
            {"id": "D", "label": "Boho Glam", "text": "Flowy printed co-ord set, strappy sandals, layered gold jewelry — free-spirited and festive", "emoji": "🌙", "style_tags": ["bohemian", "ethnic"], "color_tags": ["gold", "terracotta"], "fit": "relaxed", "confidence_weight": 0.70},
        ],
        "analysis_hint": "Reveals how the user expresses themselves in social/celebratory contexts",
        "next_question_strategy": {"if_A": "Minimalist evening wear depth", "if_B": "Bold & expressive styling", "if_C": "Smart-casual refinement", "if_D": "Bohemian styling nuances"},
    },
    {
        "question_id": "fb_004",
        "type": "mcq",
        "question": "You're running errands on a hot afternoon — grocery store, bank, pharmacy. Style matters even for this.",
        "emoji": "🛍️",
        "context": {"occasion": "Everyday errands", "weather": "Hot afternoon", "mood": "Practical, comfortable"},
        "options": [
            {"id": "A", "label": "Clean Basics", "text": "White linen tee, light beige shorts, slip-on canvas sneakers — minimal effort, maximum cleanliness", "emoji": "☀️", "style_tags": ["casual", "minimalist"], "color_tags": ["white", "beige"], "fit": "relaxed", "confidence_weight": 0.85},
            {"id": "B", "label": "Sporty Utility", "text": "Dry-fit polo, tech shorts with utility pockets, trail runners — functional and fresh", "emoji": "🏃", "style_tags": ["sporty", "casual"], "color_tags": ["navy", "grey"], "fit": "relaxed", "confidence_weight": 0.80},
            {"id": "C", "label": "Street Casual", "text": "Cropped graphic tee, boxy jorts, chunky dad sneakers, a bucket hat — effortlessly trendy", "emoji": "🧢", "style_tags": ["streetwear", "casual"], "color_tags": ["washed", "multi"], "fit": "oversized", "confidence_weight": 0.75},
            {"id": "D", "label": "Ethnic Ease", "text": "Loose cotton kurta in pastel, drawstring linen pants, kolhapuri sandals — breezy and rooted", "emoji": "🌿", "style_tags": ["ethnic", "casual"], "color_tags": ["pastel", "ivory"], "fit": "relaxed", "confidence_weight": 0.70},
        ],
        "analysis_hint": "Shows baseline daily comfort style and utility preferences",
        "next_question_strategy": {"if_A": "Minimalist basics curation", "if_B": "Athleisure and performance wear", "if_C": "Streetwear daily aesthetic", "if_D": "Ethnic comfort wear choices"},
    },
    {
        "question_id": "fb_005",
        "type": "mcq",
        "question": "You're going on a first date to a contemporary art gallery followed by dinner. Your outfit?",
        "emoji": "🎨",
        "context": {"occasion": "Art gallery + dinner date", "weather": "Comfortable evening", "mood": "Curious, charming"},
        "options": [
            {"id": "A", "label": "Art World Minimal", "text": "Oversized black turtleneck, straight-leg grey trousers, white platform sneakers — gallery-ready intellectual", "emoji": "🖼️", "style_tags": ["minimalist", "artistic"], "color_tags": ["black", "grey", "white"], "fit": "oversized", "confidence_weight": 0.85},
            {"id": "B", "label": "Elevated Romantic", "text": "Silk button-up in ivory, fitted dark jeans, pointed Chelsea boots — warm, intentional, date-appropriate", "emoji": "🕯️", "style_tags": ["classic", "romantic"], "color_tags": ["ivory", "navy"], "fit": "slim", "confidence_weight": 0.80},
            {"id": "C", "label": "Eclectic Statement", "text": "Bold patterned shirt, solid-color wide trousers, unique vintage sneakers — conversation starter guaranteed", "emoji": "🌈", "style_tags": ["bold", "eclectic"], "color_tags": ["pattern", "vibrant"], "fit": "relaxed", "confidence_weight": 0.75},
            {"id": "D", "label": "Luxury Understated", "text": "Merino wool crewneck in deep burgundy, tailored dark trousers, premium leather loafers — quietly confident luxury", "emoji": "💎", "style_tags": ["luxury", "classic"], "color_tags": ["burgundy", "black"], "fit": "tailored", "confidence_weight": 0.70},
        ],
        "analysis_hint": "Reveals self-expression strategy in high-stakes impression situations",
        "next_question_strategy": {"if_A": "Monochrome and artistic minimalism", "if_B": "Romantic and classic refinement", "if_C": "Bold eclectic expression", "if_D": "Quiet luxury aesthetics"},
    },
    {
        "question_id": "fb_006",
        "type": "mcq",
        "question": "Your company has a 'smart casual' dress code for a team offsite event at a resort. How do you interpret that?",
        "emoji": "🏖️",
        "context": {"occasion": "Corporate offsite", "weather": "Sunny resort", "mood": "Professional but relaxed"},
        "options": [
            {"id": "A", "label": "Relaxed Professional", "text": "Linen shirt in sky blue, khaki chinos rolled at the ankle, white leather sneakers — the perfect balance", "emoji": "🌊", "style_tags": ["smart casual", "classic"], "color_tags": ["sky blue", "khaki"], "fit": "slim", "confidence_weight": 0.85},
            {"id": "B", "label": "Urban Smart", "text": "Clean bomber jacket over a crisp tee, tapered jogger-cut trousers, clean all-white sneakers — modern and sharp", "emoji": "🏙️", "style_tags": ["streetwear", "smart casual"], "color_tags": ["navy", "white"], "fit": "tailored", "confidence_weight": 0.80},
            {"id": "C", "label": "Coastal Minimal", "text": "White cotton button-down open over a plain tee, linen shorts, espadrilles — effortlessly coastal", "emoji": "🌴", "style_tags": ["minimalist", "casual"], "color_tags": ["white", "sand"], "fit": "relaxed", "confidence_weight": 0.75},
            {"id": "D", "label": "Bold Casual", "text": "Color-blocked polo, well-fitted shorts in a complementary shade, sporty sandals — vibrant and confident", "emoji": "🎯", "style_tags": ["sporty", "bold"], "color_tags": ["cobalt", "coral"], "fit": "relaxed", "confidence_weight": 0.70},
        ],
        "analysis_hint": "Explores how the user navigates dress code ambiguity in professional settings",
        "next_question_strategy": {"if_A": "Push into classic smart-casual", "if_B": "Explore work-streetwear fusion", "if_C": "Coastal and resort minimalism", "if_D": "Bold color expression"},
    },
    {
        "question_id": "fb_007",
        "type": "mcq",
        "question": "You're traveling solo to a new city for a weekend. You need ONE outfit that works from sightseeing to a nice dinner.",
        "emoji": "✈️",
        "context": {"occasion": "Travel / solo trip", "weather": "Variable", "mood": "Adventurous, free"},
        "options": [
            {"id": "A", "label": "Travel Minimalist", "text": "Dark slim jeans, fitted black turtleneck, versatile white sneakers, minimal crossbody bag — packs light, looks sharp everywhere", "emoji": "🎒", "style_tags": ["minimalist", "casual"], "color_tags": ["black", "white"], "fit": "slim", "confidence_weight": 0.85},
            {"id": "B", "label": "Street Explorer", "text": "Tech-fabric joggers, zip-up fleece, fresh colorway trail runners, utility vest — functional and street credible", "emoji": "🗺️", "style_tags": ["streetwear", "sporty"], "color_tags": ["grey", "olive"], "fit": "relaxed", "confidence_weight": 0.80},
            {"id": "C", "label": "Classic Traveler", "text": "Chinos, OCBD shirt, leather belt, desert boots — timeless enough for any context, any culture", "emoji": "🧭", "style_tags": ["classic", "smart casual"], "color_tags": ["navy", "tan"], "fit": "slim", "confidence_weight": 0.75},
            {"id": "D", "label": "Bohemian Wander", "text": "Flowy wide-leg pants in earthy print, plain fitted top, slip-on sandals, sun hat — relaxed and globally chic", "emoji": "🌍", "style_tags": ["bohemian", "casual"], "color_tags": ["earthy", "terracotta"], "fit": "relaxed", "confidence_weight": 0.70},
        ],
        "analysis_hint": "Tests versatility preference and travel style values",
        "next_question_strategy": {"if_A": "Capsule wardrobe minimalism", "if_B": "Performance-meets-street styling", "if_C": "Classic versatile wardrobe building", "if_D": "Boho travel aesthetic"},
    },
]


def _get_client():
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not set")
    return genai.Client(api_key=GEMINI_API_KEY)


def generate_quiz_question(
    gender: str = "unspecified",
    age_group: str = "adult",
    climate: str = "moderate",
    lifestyle: str = "general",
    previous_answers: list = None,
    style_profile: dict = None,
    question_number: int = 1,
) -> dict:
    """
    Try to generate a question via Gemini.
    Falls back to curated high-quality questions if quota is exceeded.
    """
    # Try Gemini first
    try:
        client = _get_client()

        prev_str = json.dumps(previous_answers or [], ensure_ascii=False)

        # Compact prompt to minimize token usage
        prompt = f"""Fashion quiz question generator. Output ONLY JSON.

Context: gender={gender}, age={age_group}, climate={climate}, lifestyle={lifestyle}, Q#{question_number}
Previous answers summary: {prev_str[:500]}

Generate ONE situational fashion quiz question. Avoid repeating previous scenarios.

Required JSON format:
{{"question_id":"{uuid.uuid4().hex[:8]}","type":"mcq","question":"situational question?","emoji":"emoji","context":{{"occasion":"","weather":"","mood":""}},"options":[{{"id":"A","label":"style name","text":"detailed outfit description","emoji":"emoji","style_tags":["tag1"],"color_tags":["color1"],"fit":"slim|relaxed|oversized|tailored","confidence_weight":0.85}},{{"id":"B","label":"","text":"","emoji":"","style_tags":[],"color_tags":[],"fit":"","confidence_weight":0.80}},{{"id":"C","label":"","text":"","emoji":"","style_tags":[],"color_tags":[],"fit":"","confidence_weight":0.75}},{{"id":"D","label":"","text":"","emoji":"","style_tags":[],"color_tags":[],"fit":"","confidence_weight":0.70}}],"analysis_hint":"what this probes","next_question_strategy":{{"if_A":"","if_B":"","if_C":"","if_D":""}}}}

Rules: 4 options must cover different styles (casual/formal/streetwear/ethnic/sporty/luxury/minimalist). Make all options attractive. Be specific with clothing items and colors."""

        response = client.models.generate_content(
            model=MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.9,
                max_output_tokens=900,
                response_mime_type="application/json",
            ),
        )

        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        return json.loads(raw)

    except Exception as gemini_err:
        print(f"[Gemini fallback] Q#{question_number}: {gemini_err}")
        # Fall back to curated question for this number
        idx = min(question_number - 1, len(FALLBACK_QUESTIONS) - 1)
        return FALLBACK_QUESTIONS[idx]


def generate_style_dna(answers: list, user_context: dict) -> dict:
    """Generate Style DNA — falls back to computed result if Gemini unavailable."""
    try:
        client = _get_client()

        answers_str = json.dumps(answers, ensure_ascii=False)
        context_str = json.dumps(user_context, ensure_ascii=False)

        prompt = f"""Fashion stylist AI. Output ONLY JSON.
User: {context_str}
Answers: {answers_str}

Generate Style DNA profile:
{{"style_title":"Creative title","style_archetype":"primary style","secondary_style":"secondary","description":"2-3 personalized sentences","color_palette":{{"primary":["#hex1","#hex2","#hex3"],"accent":["#hex4","#hex5"],"avoid":["#hex6"]}},"key_pieces":["piece1","piece2","piece3","piece4","piece5"],"style_tips":["tip1","tip2","tip3","tip4"],"brands_vibe":["vibe1","vibe2","vibe3"],"fit_preference":"slim|relaxed|oversized|tailored","occasion_strength":"casual|formal|streetwear|all-around","personality_traits":["trait1","trait2","trait3"],"style_score":{{"casual":75,"formal":40,"streetwear":60,"minimalist":80,"bold":55}}}}"""

        response = client.models.generate_content(
            model=MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=1200,
                response_mime_type="application/json",
            ),
        )

        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        return json.loads(raw)

    except Exception as gemini_err:
        print(f"[Gemini fallback] Style DNA: {gemini_err}")
        return _compute_fallback_dna(answers, user_context)


def _compute_fallback_dna(answers: list, user_context: dict) -> dict:
    """Compute Style DNA from answers without Gemini."""
    style_counts = {}
    color_counts = {}
    fit_counts = {}

    for a in answers:
        for tag in a.get("style_tags", []):
            style_counts[tag] = style_counts.get(tag, 0) + 1
        for c in a.get("color_tags", []):
            color_counts[c] = color_counts.get(c, 0) + 1
        fit = a.get("fit", "")
        if fit:
            fit_counts[fit] = fit_counts.get(fit, 0) + 1

    top_style = max(style_counts, key=style_counts.get) if style_counts else "casual"
    top_fit = max(fit_counts, key=fit_counts.get) if fit_counts else "relaxed"

    style_map = {
        "minimalist": {"title": "The Refined Minimalist", "desc": "You curate carefully and wear intentionally. Clean lines and quality basics define your wardrobe."},
        "streetwear": {"title": "The Urban Tastemaker", "desc": "You set trends before they exist. Bold graphics, premium sneakers, and oversized silhouettes are your signature."},
        "classic": {"title": "The Timeless Sophisticate", "desc": "Your style transcends seasons. Investment pieces and tailored fits form the backbone of your wardrobe."},
        "casual": {"title": "The Effortless Everyday", "desc": "Comfort and style coexist perfectly in your wardrobe. You look put-together without trying too hard."},
        "ethnic": {"title": "The Cultural Storyteller", "desc": "You blend heritage with modernity. Your style celebrates craft, culture, and thoughtful fusion."},
        "sporty": {"title": "The Athletic Aesthetic", "desc": "Performance meets style in everything you wear. Athleisure is not a trend for you — it's a lifestyle."},
        "luxury": {"title": "The Quiet Luxury Connoisseur", "desc": "You value quality over quantity. Understated luxury and fine materials define your sartorial choices."},
        "bohemian": {"title": "The Free Spirit", "desc": "Flowing silhouettes, earthy tones, and layered textures tell the story of your adventurous soul."},
    }

    info = style_map.get(top_style, style_map["casual"])

    return {
        "style_title": info["title"],
        "style_archetype": top_style.title(),
        "secondary_style": "Casual",
        "description": info["desc"],
        "color_palette": {
            "primary": ["#1A1A2E", "#F5F0E8", "#9B9B9B"],
            "accent": ["#3333CC", "#8844EE"],
            "avoid": ["#FF6B6B"],
        },
        "key_pieces": [
            "High-quality white Oxford shirt",
            "Well-fitted dark denim jeans",
            "Versatile midi-length coat",
            "Classic leather sneakers or loafers",
            "Structured minimal tote bag",
        ],
        "style_tips": [
            "Build around 3–4 neutral base colors",
            f"Stick to your preferred {top_fit} fit for everyday comfort",
            "Invest in 5 quality basics rather than 20 trendy pieces",
            "Let accessories carry personality while basics stay clean",
        ],
        "brands_vibe": ["Japanese minimalist aesthetic", "European contemporary", "New York urban casual"],
        "fit_preference": top_fit,
        "occasion_strength": "casual",
        "personality_traits": ["Intentional", "Effortless", "Self-aware"],
        "style_score": {
            "casual": style_counts.get("casual", 0) * 20,
            "formal": style_counts.get("formal", 0) * 20,
            "streetwear": style_counts.get("streetwear", 0) * 20,
            "minimalist": style_counts.get("minimalist", 0) * 20,
            "bold": style_counts.get("bold", 0) * 20,
        },
    }
