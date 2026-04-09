from datetime import datetime


class WardrobeItem:

    def __init__(
        self,
        user_id,
        category,
        color,
        pattern,
        image_url,
        status="clean",              # 🧺 Laundry system
        occasion="casual",           # 🎯 Event-based recommendations
        season="all"                 # 🌦️ Weather compatibility
    ):
        self.user_id = user_id
        self.category = category
        self.color = color
        self.pattern = pattern
        self.image_url = image_url

        # 🧺 Laundry tracking
        self.status = status  # clean / dirty

        # 🎯 Context fields
        self.occasion = occasion  # casual / formal / party
        self.season = season      # summer / winter / all

        # 📊 Usage tracking
        self.last_used = None

        # 🧠 Embedding placeholder (important for AI)
        self.embedding = []

        # 🕒 Metadata
        self.created_at = datetime.utcnow()

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "category": self.category,
            "color": self.color,
            "pattern": self.pattern,
            "image_url": self.image_url,

            # 🧺 Laundry
            "status": self.status,

            # 🎯 Context
            "occasion": self.occasion,
            "season": self.season,

            # 📊 Tracking
            "last_used": self.last_used,

            # 🧠 AI
            "embedding": self.embedding,

            # 🕒 Metadata
            "created_at": self.created_at
        }