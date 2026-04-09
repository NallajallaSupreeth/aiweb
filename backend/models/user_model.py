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
def update_user_model(user, data):
    # Basic info
    user["full_name"] = data.get("full_name", user["full_name"])
    user["phone"] = data.get("phone", user["phone"])

    # Physical attributes
    user["height"] = data.get("height", user["height"])
    user["weight"] = data.get("weight", user["weight"])

    # Body measurements (nested)
    if "body_measurements" in data:
        user["body_measurements"]["chest"] = data["body_measurements"].get(
            "chest", user["body_measurements"]["chest"]
        )
        user["body_measurements"]["waist"] = data["body_measurements"].get(
            "waist", user["body_measurements"]["waist"]
        )
        user["body_measurements"]["shoulder"] = data["body_measurements"].get(
            "shoulder", user["body_measurements"]["shoulder"]
        )

    # Appearance
    user["skin_tone"] = data.get("skin_tone", user["skin_tone"])
    user["eye_color"] = data.get("eye_color", user["eye_color"])
    user["hair_color"] = data.get("hair_color", user["hair_color"])

    return user