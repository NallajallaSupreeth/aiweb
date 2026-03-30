from datetime import datetime

class WardrobeItem:

    def __init__(self, user_id, category, color, pattern, image_url, status="available"):
        self.user_id = user_id
        self.category = category
        self.color = color
        self.pattern = pattern
        self.image_url = image_url
        self.status = status
        self.created_at = datetime.utcnow()

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "category": self.category,
            "color": self.color,
            "pattern": self.pattern,
            "image_url": self.image_url,
            "status": self.status,
            "created_at": self.created_at
        }