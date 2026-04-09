from pydantic import BaseModel

class SignupSchema(BaseModel):
    full_name: str
    email: str
    phone: str
    password: str

class LoginSchema(BaseModel):
    email: str
    password: str