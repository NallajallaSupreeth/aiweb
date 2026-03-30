import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from PIL import Image
from routes import feedback

# ✅ Load environment variables
load_dotenv()

# ✅ Ensure 'static' and 'static/uploads' directories exist
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

# ✅ Initialize FastAPI app
app = FastAPI(title="Intelligent Personal Stylist API")

# ✅ Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Later replace with frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Serve static files
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# ✅ Favicon route
@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return FileResponse(favicon_path)

# ✅ Root route
@app.get("/")
def read_root():
    return {"message": "Welcome to the Intelligent Personal Stylist API 👗"}

# ✅ Import routes
from routes import user, wardrobe, style, recommendation, style_dna_routes, weather

# ✅ Include routers
app.include_router(user.router, prefix="/api", tags=["User"])
app.include_router(wardrobe.router, prefix="/api", tags=["Wardrobe"])
app.include_router(style.router, prefix="/api", tags=["Style"])
app.include_router(recommendation.router, prefix="/api/recommendations", tags=["Recommendations"])
app.include_router(style_dna_routes.router, prefix="/api/style-dna", tags=["Style DNA"])
app.include_router(weather.router, prefix="/api", tags=["Weather"])
app.include_router(feedback.router, prefix="/api", tags=["Feedback"])
print("🚀 FastAPI server initialized successfully!")