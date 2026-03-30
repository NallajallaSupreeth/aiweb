from collections_setup import users_collection, wardrobe_collection, feedback_collection

user_doc = {
    "user_id": "U123",
    "name": "Supreeth",
    "height": 172,
    "weight": 65,
    "skin_tone": "medium",
    "body_shape": "athletic",
    "style_dna": [0.23, 0.45, 0.12]
}

wardrobe_doc = {
    "item_id": "I101",
    "user_id": "U123",
    "category": "t-shirt",
    "color": "blue",
    "pattern": "solid",
    "status": "available",
    "image_url": "https://example.com/image.jpg"
}

feedback_doc = {
    "user_id": "U123",
    "outfit_id": "O202",
    "rating": "like",
    "date": "2025-10-01"
}

users_collection.insert_one(user_doc)
wardrobe_collection.insert_one(wardrobe_doc)
feedback_collection.insert_one(feedback_doc)

print("✅ Sample data inserted")