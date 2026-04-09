from fastapi import APIRouter, HTTPException
from schemas.auth_schema import SignupSchema, LoginSchema
from services.auth_service import create_user, authenticate_user
from utils.jwt_handler import create_token

router = APIRouter()


# 🔹 SIGNUP
@router.post("/auth/signup")
def signup(data: SignupSchema):
    user = create_user(data)

    if not user:
        raise HTTPException(status_code=400, detail="User already exists")

    return {
        "message": "✅ User created successfully"
    }


# 🔹 LOGIN
@router.post("/auth/login")
def login(data: LoginSchema):
    user = authenticate_user(data.email, data.password)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token({"user_id": user["_id"]})

    return {
        "access_token": token,
        "token_type": "bearer",   # 🔥 IMPORTANT (frontend expects this)
        "user": user
    }