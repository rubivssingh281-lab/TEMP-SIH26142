import asyncio
import logging
import smtplib
import uuid
import random
import datetime
from email.message import EmailMessage

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.db.models import User, OTP
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    organization: str = None
    password: str

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    code: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

def send_otp_email(email: str, code: str) -> None:
    if not settings.SMTP_PASSWORD:
        raise RuntimeError("SMTP_PASSWORD is not configured")
    msg = EmailMessage()
    msg.set_content(f"Your OTP code is: {code}")
    msg["Subject"] = "Your Verification Code"
    msg["From"] = settings.SMTP_FROM_EMAIL
    msg["To"] = email
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        refused = server.send_message(msg)
        if refused:
            raise smtplib.SMTPRecipientsRefused(refused)

# In-memory store for demo without Docker
mock_users = {}
mock_otps = {}

@router.post("/register")
async def register(req: RegisterRequest):
    mock_users[req.email] = {"name": req.name, "org": req.organization, "active": False}
    
    # Generate OTP
    code = str(random.randint(100000, 999999))
    mock_otps[req.email] = {"code": code, "expires": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=10)}
    
    try:
        await asyncio.to_thread(send_otp_email, req.email, code)
    except Exception:
        logger.exception("otp_email_delivery_failed", extra={"email": req.email})
        mock_users.pop(req.email, None)
        mock_otps.pop(req.email, None)
        raise HTTPException(status_code=503, detail="Unable to send verification email")
    
    return {"message": "Account created. OTP sent to email."}

@router.post("/verify-otp")
async def verify_otp(req: VerifyOTPRequest):
    otp = mock_otps.get(req.email)
    
    if not otp or otp["code"] != req.code:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    if otp["expires"] < datetime.datetime.now(datetime.timezone.utc):
        raise HTTPException(status_code=400, detail="OTP expired")
        
    if req.email in mock_users:
        mock_users[req.email]["active"] = True
        
    return {"message": "OTP verified successfully", "token": "dummy_jwt_token"}

@router.post("/login")
async def login(req: LoginRequest):
    if req.email not in mock_users:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {"message": "Logged in successfully", "token": "dummy_jwt_token"}
