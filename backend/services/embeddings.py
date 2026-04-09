from sentence_transformers import SentenceTransformer
from PIL import Image
import torch
import torchvision.models as models
import numpy as np

# ==============================
# ⚙️ DEVICE CONFIG
# ==============================
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


# ==============================
# 🧠 TEXT EMBEDDING MODEL
# ==============================
text_model = SentenceTransformer('all-MiniLM-L6-v2', device=DEVICE)


def create_style_embedding(answers: list):
    """
    Convert user style quiz answers → embedding
    """
    if not answers:
        return []

    embedding = text_model.encode(answers, normalize_embeddings=True)

    # Average all answers into one vector
    final_embedding = np.mean(embedding, axis=0)

    return final_embedding.tolist()


# ==============================
# 🖼️ IMAGE EMBEDDING MODEL (FIXED)
# ==============================

# ✅ Use new weights API
weights = models.ResNet18_Weights.DEFAULT

# ✅ Load model with weights
image_model = models.resnet18(weights=weights)

# ✅ Remove classification layer
image_model = torch.nn.Sequential(*list(image_model.children())[:-1])
image_model.to(DEVICE)
image_model.eval()

# ✅ CORRECT TRANSFORM (IMPORTANT FIX)
transform = weights.transforms()


# ==============================
# 🔥 GENERATE IMAGE EMBEDDING
# ==============================
def generate_image_embedding(image_path):
    """
    Convert image → normalized embedding vector
    """

    try:
        image = Image.open(image_path).convert("RGB")

        # Apply correct preprocessing
        img = transform(image).unsqueeze(0).to(DEVICE)

        with torch.no_grad():
            embedding = image_model(img)

        # Flatten
        embedding = embedding.view(-1).cpu().numpy()

        # Normalize (IMPORTANT for cosine similarity)
        norm = np.linalg.norm(embedding)
        if norm != 0:
            embedding = embedding / norm

        # Reduce size for DB storage
        return embedding[:128].tolist()

    except Exception as e:
        print(f"Embedding error: {e}")
        return []