# services/embeddings.py

from sentence_transformers import SentenceTransformer
from PIL import Image
import torch
import torchvision.models as models
import torchvision.transforms as transforms

# ---------- TEXT EMBEDDING MODEL ----------
text_model = SentenceTransformer('all-MiniLM-L6-v2')


def create_style_embedding(answers: list):
    """
    For style quiz (text-based)
    """
    return text_model.encode(answers).tolist()


# ---------- IMAGE EMBEDDING MODEL ----------
# Use lightweight pretrained ResNet18 (faster than ResNet50)
image_model = models.resnet18(pretrained=True)

# Remove final classification layer → get feature vector
image_model = torch.nn.Sequential(*list(image_model.children())[:-1])
image_model.eval()

# Image preprocessing
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor()
])


def generate_image_embedding(image_path):
    """
    Convert image → embedding vector
    """

    image = Image.open(image_path).convert("RGB")
    img = transform(image).unsqueeze(0)

    with torch.no_grad():
        embedding = image_model(img)

    # Flatten vector
    embedding = embedding.view(-1)

    # Reduce size (important for DB storage)
    return embedding.tolist()[:128]