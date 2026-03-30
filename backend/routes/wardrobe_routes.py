from fastapi import APIRouter, UploadFile, File, Form
from bson import ObjectId

from db.collections_setup import wardrobe
from models.wardrobe_model import WardrobeItem
from services.image_upload import save_image

router = APIRouter(prefix="/wardrobe", tags=["Wardrobe"])

@router.post("/upload")

async def upload_clothing(
    user_id: str = Form(...),
    category: str = Form(...),
    color: str = Form(...),
    pattern: str = Form(...),
    image: UploadFile = File(...)
):

    image_url = save_image(image)

    item = WardrobeItem(
        user_id=user_id,
        category=category,
        color=color,
        pattern=pattern,
        image_url=image_url
    )

    result = wardrobe.insert_one(item.to_dict())

    return {
        "message": "Wardrobe item added",
        "item_id": str(result.inserted_id)
    }
@router.get("/{user_id}")

def get_user_wardrobe(user_id: str):

    items = list(wardrobe.find({"user_id": user_id}))

    for item in items:
        item["_id"] = str(item["_id"])

    return items

@router.delete("/{item_id}")

def delete_item(item_id: str):

    wardrobe.delete_one({"_id": ObjectId(item_id)})

    return {"message": "Item deleted"}