import os
import shutil
import uuid
import traceback
from fastapi import APIRouter, UploadFile, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
from bson import ObjectId

from db.connection import db
from utils.dependencies import get_current_user
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
        # ── Save file ────────────────────────────────────────────────────────
        file_ext = os.path.splitext(file.filename)[1] or ".jpg"
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        image_url = f"{BASE_URL}/{file_path}"

        # ── AI Analysis ──────────────────────────────────────────────────────
        from services.vision import analyze_clothing_image

        # Use absolute path so PIL.Image.open() can find the file
        abs_file_path = os.path.abspath(file_path)
        analysis = analyze_clothing_image(image_url=image_url, file_path=abs_file_path)

        print(f"[Upload] Analysis result: {analysis}")

        # Override category if user specified
        final_category = category if category else analysis["category"]

        # ── Embedding ────────────────────────────────────────────────────────
        try:
            embedding = generate_image_embedding(file_path)
            if not embedding:
                embedding = []
        except:
            embedding = []

        # ── Build DB document ────────────────────────────────────────────────
        new_item = {
            "user_id": user_id,

            # Category info
            "category":    final_category,
            "subcategory": analysis["subcategory"],
            "style":       analysis["style"],

            # Dominant colour (flat for card display)
            "color":       analysis["color"],
            "color_hex":   analysis["color_hex"],
            "color_rgb":   analysis["color_rgb"],

            # Pattern & material
            "pattern":     analysis["pattern"],
            "material":    analysis["material"],

            # Context
            "season":      analysis["season"],
            "occasion":    analysis["occasion"],

            # Detailed sub-objects
            "topwear":     analysis.get("topwear"),
            "bottomwear":  analysis.get("bottomwear"),

            # Image
            "image_url":   f"/{file_path}",

            # ML
            "embedding":   embedding,

            # Status
            "status":      "clean",
            "last_used":   None,
        }

        result = wardrobe_collection.insert_one(new_item)
        new_item["_id"] = str(result.inserted_id)

        return JSONResponse({
            "message": "✅ Item uploaded and analyzed successfully!",
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
        print(f"🔍 Received item_id: {item_id}")

        # ✅ Validate ID
        if not ObjectId.is_valid(item_id):
            raise HTTPException(status_code=400, detail="Invalid item_id")

        input_item = wardrobe_collection.find_one({
            "_id": ObjectId(item_id),
            "user_id": user_id
        })

        print(f"🧥 Input item: {input_item}")

        if not input_item:
            raise HTTPException(status_code=404, detail="Item not found")

        wardrobe_items = list(wardrobe_collection.find({"user_id": user_id}))

        print(f"📦 Wardrobe count: {len(wardrobe_items)}")

        outfit = generate_outfit(input_item, wardrobe_items)

        print(f"👗 Generated outfit: {outfit}")

        if not outfit:
            return {"outfit": None, "message": "No outfit found"}

        return {"outfit": outfit}

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))