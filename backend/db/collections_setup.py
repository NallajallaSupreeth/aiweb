from pymongo import MongoClient

# MongoDB Connection
MONGO_URL = "mongodb+srv://supreethnallajalla_db_user:q5S47oo8BZiRwz9o@cluster0.sget9jn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

client = MongoClient(MONGO_URL)

# Database
db = client["personal_stylist_db"]

# Collections
users_collection = db["users"]
wardrobe_collection = db["wardrobe"]
feedback_collection = db["feedback"]

print("✅ MongoDB connected successfully")