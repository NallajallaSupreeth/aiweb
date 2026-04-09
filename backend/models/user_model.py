from datetime import datetime

def create_user_model(data):
    return {
        "full_name": data.get("full_name"),
        "email": data.get("email"),
        "phone": data.get("phone"),
        "password": data.get("password"),

        # 👤 Profile
        "profile_pic": "",

        # 📏 Physical attributes
        "height": None,
        "weight": None,

        "body_measurements": {
            "chest": None,
            "waist": None,
            "shoulder": None
        },

        # 🎨 Appearance
        "skin_tone": "",
        "eye_color": "",
        "hair_color": "",

        # 🧠 Preferences
        "style_preferences": [],

        # 📅 Google Calendar tokens
        "google_tokens": {},

        "created_at": datetime.utcnow()
    }