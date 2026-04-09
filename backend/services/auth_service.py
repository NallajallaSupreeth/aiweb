from db.connection import db
from utils.password_hash import hash_password, verify_password
from models.user_model import create_user_model
from bson import ObjectId

users_collection = db["users"]


# 🔹 CREATE USER (SIGNUP)
def create_user(data):
    existing = users_collection.find_one({"email": data.email})
    if existing:
        return None

    user_data = create_user_model({
        "full_name": data.full_name,
        "email": data.email,
        "phone": data.phone,
        "password": hash_password(data.password)
    })

    result = users_collection.insert_one(user_data)
    user_data["_id"] = str(result.inserted_id)

    return user_data


# 🔹 LOGIN / AUTHENTICATION
def authenticate_user(email, password):
    user = users_collection.find_one({"email": email})

    if not user:
        return None

    if not verify_password(password, user["password"]):
        return None

    user["_id"] = str(user["_id"])
    return user


# 🔹 GET USER BY ID
def get_user_by_id(user_id):
    user = users_collection.find_one({"_id": ObjectId(user_id)})

    if not user:
        return None

    user["_id"] = str(user["_id"])
    return user


# 🔹 UPDATE USER PROFILE
def update_user(user_id, update_data: dict):
    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )

    updated_user = users_collection.find_one({"_id": ObjectId(user_id)})

    if updated_user:
        updated_user["_id"] = str(updated_user["_id"])

    return updated_user


# 🔹 STORE GOOGLE TOKENS
def save_google_tokens(user_id, tokens: dict):
    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"google_tokens": tokens}}
    )

    return True