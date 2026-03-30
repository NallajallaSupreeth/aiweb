import os
import shutil
import uuid
from fastapi import APIRouter, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
from bson import ObjectId

from db.connection import db

# AI modules
from services.vision import detect_category, detect_dominant_color, detect_pattern
from services.embeddings import generate_image_embedding
from services.recommendation import recommend_items, generate_outfit

router = APIRouter()

wardrobe_collection = db["wardrobe"]
feedback_collection = db["feedback"]   # 🔥 NEW

UPLOAD_FOLDER = "static/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ---------------- UPLOAD ----------------
@router.post("/wardrobe/upload")
async def upload_clothing(
    user_id: str = Form(...),
    category: str = Form(None),
    file: UploadFile = None
):
    if not file:
        raise HTTPException(status_code=400, detail="No image uploaded.")

    try:
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # AI pipeline
        detected_category = detect_category(file_path)
        final_category = category if category else detected_category

        color = detect_dominant_color(file_path)
        pattern = detect_pattern(file_path)
        embedding = generate_image_embedding(file_path)

        new_item = {
            "user_id": user_id,
            "category": final_category,
            "image_url": f"/{file_path}",
            "color": color,
            "pattern": pattern,
            "embedding": embedding,
            "status": "available"
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
@router.get("/wardrobe/{user_id}")
async def get_wardrobe(user_id: str):
    try:
        items = list(wardrobe_collection.find({"user_id": user_id}))
        for item in items:
            item["_id"] = str(item["_id"])
        return {"user_id": user_id, "wardrobe": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch wardrobe: {e}")


# ---------------- DELETE ----------------
@router.delete("/wardrobe/{item_id}")
async def delete_wardrobe_item(item_id: str):
    try:
        if not ObjectId.is_valid(item_id):
            raise HTTPException(status_code=400, detail="Invalid item_id")

        result = wardrobe_collection.find_one({"_id": ObjectId(item_id)})

        if not result:
            raise HTTPException(status_code=404, detail="Item not found")

        image_path = result.get("image_url", "").lstrip("/")
        if image_path and os.path.exists(image_path):
            os.remove(image_path)

        wardrobe_collection.delete_one({"_id": ObjectId(item_id)})

        return {"message": "🗑️ Item deleted successfully!"}

    except HTTPException as e:
        raise e

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {e}")


# ---------------- UPDATE ----------------
@router.put("/wardrobe/{item_id}")
async def update_wardrobe_item(item_id: str, data: dict):
    try:
        if not ObjectId.is_valid(item_id):
            raise HTTPException(status_code=400, detail="Invalid item_id")

        update_result = wardrobe_collection.update_one(
            {"_id": ObjectId(item_id)},
            {"$set": data}
        )

        if update_result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Item not found")

        updated_item = wardrobe_collection.find_one({"_id": ObjectId(item_id)})
        updated_item["_id"] = str(updated_item["_id"])

        return {
            "message": "✅ Item updated successfully!",
            "item": updated_item
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Update failed: {e}")


# ---------------- RECOMMEND ITEMS (WITH FEEDBACK 🔥) ----------------
@router.get("/wardrobe/recommend/{item_id}")
async def recommend_outfit(item_id: str):

    try:
        if not ObjectId.is_valid(item_id):
            raise HTTPException(status_code=400, detail="Invalid item_id")

        input_item = wardrobe_collection.find_one({"_id": ObjectId(item_id)})

        if not input_item:
            raise HTTPException(status_code=404, detail="Item not found")

        wardrobe_items = list(
            wardrobe_collection.find({"user_id": input_item["user_id"]})
        )

        # 🔥 FETCH FEEDBACK
        feedbacks = list(
            feedback_collection.find({"user_id": input_item["user_id"]})
        )

        # 🔥 PASS FEEDBACK TO ENGINE
        recommendations = recommend_items(input_item, wardrobe_items, feedbacks)

        for item in recommendations:
            item["_id"] = str(item["_id"])

        return {
            "input_item": str(input_item["_id"]),
            "recommendations": recommendations
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation failed: {e}")


# ---------------- GENERATE OUTFIT ----------------
@router.get("/wardrobe/outfit/{item_id}")
async def get_outfit(item_id: str):

    try:
        if not ObjectId.is_valid(item_id):
            raise HTTPException(status_code=400, detail="Invalid item_id")

        input_item = wardrobe_collection.find_one({"_id": ObjectId(item_id)})

        if not input_item:
            raise HTTPException(status_code=404, detail="Item not found")

        wardrobe_items = list(
            wardrobe_collection.find({"user_id": input_item["user_id"]})
        )

        outfit = generate_outfit(input_item, wardrobe_items)

        if outfit["top"]:
            outfit["top"]["_id"] = str(outfit["top"]["_id"])
        if outfit["bottom"]:
            outfit["bottom"]["_id"] = str(outfit["bottom"]["_id"])

        return {
            "input_item": str(input_item["_id"]),
            "outfit": outfit
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Outfit generation failed: {e}")