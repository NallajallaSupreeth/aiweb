from fastapi import APIRouter, HTTPException
from bson import ObjectId
from db.connection import db

router = APIRouter()

# ✅ MongoDB collection
user_collection = db["users"]

# --- 🧩 Create User ---
@router.post("/user")
def create_user(user: dict):
    try:
        result = user_collection.insert_one(user)
        return {
            "message": "✅ User created successfully",
            "user_id": str(result.inserted_id)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"User creation failed: {e}")

# --- 🧩 Get User by ID ---
@router.get("/user/{user_id}")
def get_user(user_id: str):
    try:
        user = user_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user["_id"] = str(user["_id"])
        return user
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch user: {e}")

# --- ✏️ Update User ---
@router.put("/user/{user_id}")
def update_user(user_id: str, data: dict):
    try:
        result = user_collection.update_one(
            {"_id": ObjectId(user_id)}, {"$set": data}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")

        updated_user = user_collection.find_one({"_id": ObjectId(user_id)})
        updated_user["_id"] = str(updated_user["_id"])
        return {"message": "✅ User updated successfully", "user": updated_user}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Update failed: {e}")

# --- 🗑️ Delete User ---
@router.delete("/user/{user_id}")
def delete_user(user_id: str):
    try:
        result = user_collection.delete_one({"_id": ObjectId(user_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="User not found")

        return {"message": "🗑️ User deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {e}")
