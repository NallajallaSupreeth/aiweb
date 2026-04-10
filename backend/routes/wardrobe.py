import os
import shutil
import uuid
from fastapi import APIRouter, UploadFile, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
from bson import ObjectId

from db.connection import db

# 🔐 Auth
from utils.dependencies import get_current_user

# 🤖 AI modules
from services.vision import detect_category, detect_dominant_color, detect_pattern
from services.embeddings import generate_image_embedding
from services.recommendation import recommend_items, generate_outfit

router = APIRouter()

wardrobe_collection = db["wardrobe"]
feedback_collection = db["feedback"]

UPLOAD_FOLDER = "static/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# 🔥 IMPORTANT: Replace this with NGROK URL when running
BASE_URL = "http://127.0.0.1:8000"


# ---------------- UPLOAD ----------------
@router.post("/wardrobe/upload")
async def upload_clothing(
    user_id: str = Depends(get_current_user),
    category: str = Form(None),
    file: UploadFile = None
):
    if not file:
        raise HTTPException(status_code=400, detail="No image uploaded.")

    try:
        # ✅ Save file
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # ==============================
        # 🌐 PUBLIC URL (IMPORTANT)
        # ==============================
        image_url = f"{BASE_URL}/{file_path}"

        # ==============================
        # 🧠 AI PIPELINE
        # ==============================

        # 🔹 CATEGORY
        detected_category = detect_category(image_url)
        if detected_category == "unknown":
            detected_category = "shirt"  # fallback

        final_category = category if category else detected_category

        # 🔹 COLOR
        color = detect_dominant_color(image_url)
        if color == "unknown":
            color = "blue"  # fallback

        # 🔹 PATTERN
        pattern = detect_pattern(image_url)

        # 🔹 EMBEDDING (safe handling)
        try:
            embedding = generate_image_embedding(file_path)
            if not embedding:
                embedding = []
        except:
            embedding = []

        # ==============================
        # 💾 STORE ITEM
        # ==============================
        new_item = {
            "user_id": user_id,
            "category": final_category,
            "image_url": f"/{file_path}",
            "color": color,
            "pattern": pattern,
            "embedding": embedding,

            # 🧺 Extra features
            "status": "clean",
            "occasion": "casual",
            "season": "all",
            "last_used": None
        }

        result = wardrobe_collection.insert_one(new_item)
        new_item["_id"] = str(result.inserted_id)

        return JSONResponse({
            "message": "✅ Item uploaded successfully!",
            "item": new_item
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")


# ---------------- GET WARDROBE ----------------
@router.get("/wardrobe")
async def get_wardrobe(user_id: str = Depends(get_current_user)):
    try:
        items = list(wardrobe_collection.find({"user_id": user_id}))

        for item in items:
            item["_id"] = str(item["_id"])

        return {"user_id": user_id, "wardrobe": items}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch wardrobe: {e}")


# ---------------- DELETE ----------------
@router.delete("/wardrobe/{item_id}")
async def delete_wardrobe_item(
    item_id: str,
    user_id: str = Depends(get_current_user)
):
    try:
        if not ObjectId.is_valid(item_id):
            raise HTTPException(status_code=400, detail="Invalid item_id")

        item = wardrobe_collection.find_one({
            "_id": ObjectId(item_id),
            "user_id": user_id
        })

        if not item:
            raise HTTPException(status_code=404, detail="Item not found")

        image_path = item.get("image_url", "").lstrip("/")

        if image_path and os.path.exists(image_path):
            os.remove(image_path)

        wardrobe_collection.delete_one({"_id": ObjectId(item_id)})

        return {"message": "🗑️ Item deleted successfully!"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {e}")


# ---------------- CLEAR ALL WARDROBE ----------------
@router.delete("/wardrobe")
async def clear_wardrobe(user_id: str = Depends(get_current_user)):
    try:
        # Get all items to delete their image files too
        items = list(wardrobe_collection.find({"user_id": user_id}))

        # Delete image files from disk
        for item in items:
            image_path = item.get("image_url", "").lstrip("/")
            if image_path and os.path.exists(image_path):
                try:
                    os.remove(image_path)
                except Exception:
                    pass

        # Delete all from MongoDB
        result = wardrobe_collection.delete_many({"user_id": user_id})

        return {
            "message": f"🗑️ Wardrobe cleared! {result.deleted_count} item(s) removed.",
            "deleted_count": result.deleted_count
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Clear wardrobe failed: {e}")



# ---------------- UPDATE ----------------
@router.put("/wardrobe/{item_id}")
async def update_wardrobe_item(
    item_id: str,
    data: dict,
    user_id: str = Depends(get_current_user)
):
    try:
        if not ObjectId.is_valid(item_id):
            raise HTTPException(status_code=400, detail="Invalid item_id")

        result = wardrobe_collection.update_one(
            {"_id": ObjectId(item_id), "user_id": user_id},
            {"$set": data}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Item not found")

        updated_item = wardrobe_collection.find_one({"_id": ObjectId(item_id)})
        updated_item["_id"] = str(updated_item["_id"])

        return {
            "message": "✅ Item updated successfully!",
            "item": updated_item
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Update failed: {e}")


# ---------------- RECOMMEND ----------------
@router.get("/wardrobe/recommend/{item_id}")
async def recommend_outfit(item_id: str, user_id: str = Depends(get_current_user)):
    try:
        input_item = wardrobe_collection.find_one({
            "_id": ObjectId(item_id),
            "user_id": user_id
        })

        wardrobe_items = list(wardrobe_collection.find({"user_id": user_id}))
        feedbacks = list(feedback_collection.find({"user_id": user_id}))

        recommendations = recommend_items(input_item, wardrobe_items, feedbacks)

        for item in recommendations:
            item["_id"] = str(item["_id"])

        return {"recommendations": recommendations}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------- OUTFIT ----------------
@router.get("/wardrobe/outfit/{item_id}")
async def get_outfit(item_id: str, user_id: str = Depends(get_current_user)):
    try:
        input_item = wardrobe_collection.find_one({
            "_id": ObjectId(item_id),
            "user_id": user_id
        })

        wardrobe_items = list(wardrobe_collection.find({"user_id": user_id}))
        outfit = generate_outfit(input_item, wardrobe_items)

        return {"outfit": outfit}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))