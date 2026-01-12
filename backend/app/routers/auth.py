from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from typing import Optional
import jwt
import bcrypt
import os

from app.db import db

router = APIRouter()
security = HTTPBearer()

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

# === Models ===
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    user: dict
    token: str
    expiresAt: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: Optional[str]
    avatar: Optional[str]
    createdAt: datetime

# === Helper Functions ===
def hash_password(password: str) -> str:
    """Hash password with bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: int, email: str) -> tuple[str, datetime]:
    """Create JWT token"""
    expires = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": expires,
        "iat": datetime.utcnow()
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token, expires

def decode_token(token: str) -> dict:
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token 已過期")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="無效的 Token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from token"""
    payload = decode_token(credentials.credentials)
    user_id = int(payload.get("sub"))
    
    user = await db.user.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(status_code=401, detail="用戶不存在")
    
    return user

# === Endpoints ===
@router.post("/register", response_model=AuthResponse)
async def register(request: RegisterRequest):
    """
    註冊新用戶
    """
    # Check if email exists
    existing = await db.user.find_unique(where={"email": request.email})
    if existing:
        raise HTTPException(status_code=400, detail="此 Email 已被註冊")
    
    # Validate password
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="密碼需至少 6 個字元")
    
    # Create user
    hashed = hash_password(request.password)
    user = await db.user.create(
        data={
            "email": request.email,
            "password": hashed,
            "name": request.name,
            "provider": "email"
        }
    )
    
    # Create default memory
    await db.usermemory.create(
        data={
            "userId": user.id
        }
    )
    
    # Generate token
    token, expires = create_token(user.id, user.email)
    
    return AuthResponse(
        user={
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "avatar": user.avatar,
            "createdAt": user.createdAt.isoformat()
        },
        token=token,
        expiresAt=expires.isoformat()
    )


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """
    用戶登入
    """
    # Find user
    user = await db.user.find_unique(where={"email": request.email})
    if not user:
        raise HTTPException(status_code=401, detail="Email 或密碼錯誤")
    
    # Check password
    if not user.password:
        raise HTTPException(status_code=401, detail="請使用社交登入")
    
    if not verify_password(request.password, user.password):
        raise HTTPException(status_code=401, detail="Email 或密碼錯誤")
    
    # Generate token
    token, expires = create_token(user.id, user.email)
    
    return AuthResponse(
        user={
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "avatar": user.avatar,
            "createdAt": user.createdAt.isoformat()
        },
        token=token,
        expiresAt=expires.isoformat()
    )


@router.get("/me")
async def get_me(user = Depends(get_current_user)):
    """
    獲取當前用戶資訊
    """
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "avatar": user.avatar,
        "createdAt": user.createdAt.isoformat()
    }


@router.post("/refresh")
async def refresh_token(user = Depends(get_current_user)):
    """
    刷新 Token
    """
    token, expires = create_token(user.id, user.email)
    return {
        "token": token,
        "expiresAt": expires.isoformat()
    }


@router.put("/profile")
async def update_profile(
    name: Optional[str] = None,
    avatar: Optional[str] = None,
    user = Depends(get_current_user)
):
    """
    更新用戶資料
    """
    data = {}
    if name is not None:
        data["name"] = name
    if avatar is not None:
        data["avatar"] = avatar
    
    if data:
        updated = await db.user.update(
            where={"id": user.id},
            data=data
        )
        return {
            "id": updated.id,
            "email": updated.email,
            "name": updated.name,
            "avatar": updated.avatar
        }
    
    return {"message": "沒有更新任何欄位"}


@router.post("/change-password")
async def change_password(
    current_password: str,
    new_password: str,
    user = Depends(get_current_user)
):
    """
    修改密碼
    """
    if not user.password:
        raise HTTPException(status_code=400, detail="社交登入用戶無法修改密碼")
    
    if not verify_password(current_password, user.password):
        raise HTTPException(status_code=401, detail="目前密碼錯誤")
    
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="新密碼需至少 6 個字元")
    
    hashed = hash_password(new_password)
    await db.user.update(
        where={"id": user.id},
        data={"password": hashed}
    )
    
    return {"message": "密碼已更新"}


# === Google OAuth ===
class GoogleAuthRequest(BaseModel):
    credential: str  # ID Token from Google

@router.post("/google", response_model=AuthResponse)
async def google_auth(request: GoogleAuthRequest):
    """
    Google OAuth 登入/註冊
    
    前端使用 Google Identity Services 獲取 credential,
    然後發送到此端點進行驗證和登入/註冊
    """
    try:
        # In production, verify with Google's tokeninfo endpoint
        # For now, decode the JWT (in production use google-auth library)
        import base64
        import json
        
        # Decode payload (not secure - use google-auth in production)
        parts = request.credential.split('.')
        if len(parts) != 3:
            raise HTTPException(status_code=400, detail="無效的 Google Token")
        
        # Pad base64 string
        payload = parts[1]
        payload += '=' * (4 - len(payload) % 4)
        decoded = base64.urlsafe_b64decode(payload)
        google_data = json.loads(decoded)
        
        email = google_data.get("email")
        name = google_data.get("name")
        avatar = google_data.get("picture")
        
        if not email:
            raise HTTPException(status_code=400, detail="無法獲取 Email")
        
        # Check if user exists
        user = await db.user.find_unique(where={"email": email})
        
        if user:
            # Existing user - update avatar if changed
            if avatar and avatar != user.avatar:
                user = await db.user.update(
                    where={"id": user.id},
                    data={"avatar": avatar}
                )
        else:
            # New user - create account
            user = await db.user.create(
                data={
                    "email": email,
                    "name": name,
                    "avatar": avatar,
                    "provider": "google"
                }
            )
            
            # Create default memory
            await db.usermemory.create(
                data={"userId": user.id}
            )
        
        # Generate token
        token, expires = create_token(user.id, user.email)
        
        return AuthResponse(
            user={
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "avatar": user.avatar,
                "createdAt": user.createdAt.isoformat()
            },
            token=token,
            expiresAt=expires.isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Google 登入失敗: {str(e)}")

