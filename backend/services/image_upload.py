import os
from fastapi import UploadFile

UPLOAD_FOLDER = "static/uploads"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def save_image(file: UploadFile):

    file_location = os.path.join(UPLOAD_FOLDER, file.filename)

    with open(file_location, "wb") as f:
        f.write(file.file.read())

    return file_location