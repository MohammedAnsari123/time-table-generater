from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app.core.security import create_access_token, verify_password, get_password_hash
from app.core.config import settings
from app.models.schemas import Token, UserLogin
from app.core.database import get_database

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user: UserLogin):
    db = await get_database()
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = {
        "email": user.email,
        "hashed_password": hashed_password,
        "role": "user" # Default role
    }
    await db.users.insert_one(new_user)
    return {"message": "User created successfully"}

@router.post("/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    db = await get_database()
    print(f"Login attempt for: {form_data.username}")
    user = await db.users.find_one({"email": form_data.username})
    
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"], "role": user["role"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
