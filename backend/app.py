import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from PIL import Image

# ==============================
# ✅ LOAD ENV VARIABLES
# ==============================

load_dotenv()

# ==============================
# 📁 STATIC SETUP
# ==============================

STATIC_DIR = "static"
UPLOAD_DIR = os.path.join(STATIC_DIR, "uploads")

for directory in [STATIC_DIR, UPLOAD_DIR]:
    if not os.path.exists(directory):
        os.makedirs(directory)
        print(f"📁 Created directory: {directory}")

# ✅ Ensure favicon exists
favicon_path = os.path.join(STATIC_DIR, "favicon.ico")
if not os.path.exists(favicon_path):
    icon = Image.new("RGB", (64, 64), color="purple")
    icon.save(favicon_path)
    print("✨ Created default favicon at static/favicon.ico")

print("✅ Environment and static directories initialized!")

# ==============================
# 🚀 FASTAPI INITIALIZATION
# ==============================

app = FastAPI(
    title="Intelligent Personal Stylist API",
    version="1.0.0"
)

# ==============================
# 🌐 CORS CONFIGURATION
# ==============================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================
# 📂 STATIC FILES
# ==============================

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# ==============================
# 🔗 BASIC ROUTES
# ==============================

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return FileResponse(favicon_path)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Intelligent Personal Stylist API 👗"}

# ==============================
# 📦 IMPORT ROUTES
# ==============================

from routes import (
    auth,                  # 🔥 NEW (AUTH SYSTEM)
    user,
    wardrobe,
    style,
    recommendation,
    style_dna_routes,
    weather,
    feedback,
    google_calendar,
    quiz,
)

# ==============================
# 🔌 REGISTER ROUTES
# ==============================

# 🔐 AUTH ROUTES (MOST IMPORTANT)
app.include_router(auth.router, prefix="/api", tags=["Auth"])

# 👤 USER
app.include_router(user.router, prefix="/api", tags=["User"])

# 👕 WARDROBE
app.include_router(wardrobe.router, prefix="/api", tags=["Wardrobe"])

# 🎨 STYLE
app.include_router(style.router, prefix="/api", tags=["Style"])

# 🤖 RECOMMENDATIONS
app.include_router(
    recommendation.router,
    prefix="/api/recommendations",
    tags=["Recommendations"]
)

# 🧬 STYLE DNA
app.include_router(
    style_dna_routes.router,
    prefix="/api/style-dna",
    tags=["Style DNA"]
)

# 🌦️ WEATHER
app.include_router(weather.router, prefix="/api", tags=["Weather"])

# 💬 FEEDBACK
app.include_router(feedback.router, prefix="/api", tags=["Feedback"])

# 📅 GOOGLE CALENDAR
app.include_router(
    google_calendar.router,
    prefix="/api/calendar",
    tags=["Google Calendar"]
)

# 🧠 AI STYLE QUIZ (GEMINI)
app.include_router(
    quiz.router,
    prefix="/api",
    tags=["Style Quiz"]
)

# ==============================
# 🎯 STARTUP MESSAGE
# ==============================

print("🚀 FastAPI server initialized successfully!")
print("📌 Swagger UI: http://localhost:8000/docs")