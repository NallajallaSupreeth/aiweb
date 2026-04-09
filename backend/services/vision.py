import requests
import os

# ==============================
# 🔐 ENV VARIABLES
# ==============================
CLARIFAI_PAT = os.getenv("CLARIFAI_PAT")
CLARIFAI_USER_ID = os.getenv("CLARIFAI_USER_ID")
CLARIFAI_APP_ID = os.getenv("CLARIFAI_APP_ID")

HEADERS = {
    "Authorization": f"Key {CLARIFAI_PAT}",
    "Content-Type": "application/json"
}

# ✅ CORRECT MODEL IDs
GENERAL_MODEL_ID = "aaa03c23b3724a16a56b629203edc62c"
COLOR_MODEL_ID = "eeed0b6733a644cea07cf4c60f87ebb7"


# ==============================
# 🧠 GENERIC CLARIFAI CALL
# ==============================
def call_clarifai(image_url, model_id):
    url = f"https://api.clarifai.com/v2/models/{model_id}/outputs"

    data = {
        "user_app_id": {
            "user_id": CLARIFAI_USER_ID,
            "app_id": CLARIFAI_APP_ID
        },
        "inputs": [
            {
                "data": {
                    "image": {
                        "url": image_url
                    }
                }
            }
        ]
    }

    response = requests.post(url, headers=HEADERS, json=data)

    res = response.json()

    print("CLARIFAI RESPONSE:", res)  # DEBUG

    return res


# ==============================
# 👕 CATEGORY DETECTION
# ==============================
def detect_category(image_url):
    try:
        res = call_clarifai(image_url, GENERAL_MODEL_ID)

        concepts = res["outputs"][0]["data"]["concepts"]

        for c in concepts:
            name = c["name"].lower()

            if name in [
                "shirt", "t-shirt", "jeans", "pants",
                "jacket", "dress", "shoes", "sneakers",
                "watch"
            ]:
                return name

        return "unknown"

    except Exception as e:
        print("Category error:", e)
        return "unknown"


# ==============================
# 🎨 COLOR DETECTION
# ==============================
def detect_dominant_color(image_url):
    try:
        res = call_clarifai(image_url, COLOR_MODEL_ID)

        colors = res["outputs"][0]["data"]["colors"]

        if colors:
            return colors[0]["w3c"]["name"].lower()

        return "unknown"

    except Exception as e:
        print("Color error:", e)
        return "unknown"


# ==============================
# 🧵 PATTERN DETECTION
# ==============================
def detect_pattern(image_url):
    try:
        res = call_clarifai(image_url, GENERAL_MODEL_ID)

        concepts = res["outputs"][0]["data"]["concepts"]

        for c in concepts:
            name = c["name"].lower()

            if "striped" in name:
                return "striped"
            if "pattern" in name:
                return "patterned"
            if "print" in name:
                return "printed"

        return "solid"

    except Exception as e:
        print("Pattern error:", e)
        return "solid"