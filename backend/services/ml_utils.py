# /services/ml_utils.py

from sentence_transformers import SentenceTransformer
import numpy as np
import cv2
from sklearn.preprocessing import normalize

# Load a pre-trained model for text embeddings
text_model = SentenceTransformer('paraphrase-MiniLM-L6-v2')


def extract_text_features(text: str):
    """
    Convert text (like 'red cotton shirt') into semantic embeddings.
    """
    if not text or text.strip() == "":
        return np.zeros((384,))
    embedding = text_model.encode(text)
    return embedding


def extract_image_features(image_path: str):
    """
    Extract basic color and texture features from clothing images using OpenCV.
    """
    try:
        img = cv2.imread(image_path)
        if img is None:
            return np.zeros((256,))
        img = cv2.resize(img, (128, 128))

        # Extract color histogram
        hist = cv2.calcHist([img], [0, 1, 2], None, [8, 8, 8],
                            [0, 256, 0, 256, 0, 256])
        hist = cv2.normalize(hist, hist).flatten()

        # Basic texture features (using Laplacian variance)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        texture = cv2.Laplacian(gray, cv2.CV_64F).var()

        # Combine histogram + texture
        features = np.append(hist, texture)
        return features

    except Exception as e:
        print(f"Error processing image {image_path}: {e}")
        return np.zeros((256,))


def combine_features(text_features, image_features):
    """
    Combine text and image embeddings into a unified feature vector.
    """
    combined = np.concatenate([text_features, image_features])
    return normalize(combined.reshape(1, -1))[0]
