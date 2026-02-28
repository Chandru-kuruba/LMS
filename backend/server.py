from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Query, Header, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import secrets
import hashlib
import pyotp
import random
import string
import json
import requests
import asyncio
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', secrets.token_hex(32))
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Storage Configuration
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "lumina-lms"
storage_key = None

# PayU Configuration
PAYU_MERCHANT_KEY = os.environ.get('PAYU_MERCHANT_KEY', '')
PAYU_MERCHANT_SALT = os.environ.get('PAYU_MERCHANT_SALT', '')
PAYU_TEST_ENV = os.environ.get('PAYU_TEST_ENV', 'true').lower() == 'true'

# SMTP Configuration
SMTP_HOST = os.environ.get('SMTP_HOST', '')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 465))
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')

# Cloudflare R2 Configuration
R2_ACCOUNT_ID = os.environ.get('R2_ACCOUNT_ID', '')
R2_ACCESS_KEY_ID = os.environ.get('R2_ACCESS_KEY_ID', '')
R2_SECRET_ACCESS_KEY = os.environ.get('R2_SECRET_ACCESS_KEY', '')
R2_BUCKET_NAME = os.environ.get('R2_BUCKET_NAME', 'course')
R2_ENDPOINT = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com" if R2_ACCOUNT_ID else ""

# Create the main app
app = FastAPI(title="LUMINA LMS API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize R2 Client (after logger is defined)
r2_client = None
if R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY and R2_ACCOUNT_ID:
    try:
        r2_client = boto3.client(
            's3',
            endpoint_url=R2_ENDPOINT,
            aws_access_key_id=R2_ACCESS_KEY_ID,
            aws_secret_access_key=R2_SECRET_ACCESS_KEY,
            config=Config(signature_version='s3v4'),
            region_name='auto'
        )
        logger.info("R2 client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize R2 client: {e}")

# ======================== STORAGE FUNCTIONS ========================

def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    if not EMERGENT_KEY:
        logger.warning("EMERGENT_LLM_KEY not set, storage disabled")
        return None
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        return storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not initialized")
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str) -> tuple:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not initialized")
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# ======================== MODELS ========================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class OTPVerify(BaseModel):
    email: EmailStr
    otp: str

class PasswordReset(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

class ProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    college_name: Optional[str] = None
    degree: Optional[str] = None
    branch: Optional[str] = None
    year_of_study: Optional[str] = None
    roll_number: Optional[str] = None

class UserRegisterWithReferral(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    referral_code: Optional[str] = None

class CourseCreate(BaseModel):
    title: str
    description: str
    short_description: str
    price: float
    discount_price: Optional[float] = None
    category: str
    level: str = "beginner"
    thumbnail_url: Optional[str] = None
    preview_video_url: Optional[str] = None
    is_published: bool = False
    drip_enabled: bool = False

class ModuleCreate(BaseModel):
    title: str
    description: Optional[str] = None
    order: int

class LessonCreate(BaseModel):
    title: str
    description: Optional[str] = None
    content_type: str = "video"  # video, text, pdf
    content: Optional[str] = None
    video_key: Optional[str] = None
    duration_minutes: int = 0
    order: int
    is_preview: bool = False

class QuizCreate(BaseModel):
    title: str
    description: Optional[str] = None
    passing_score: int = 70
    time_limit_minutes: Optional[int] = None

class QuestionCreate(BaseModel):
    question_text: str
    question_type: str = "multiple_choice"
    options: List[str]
    correct_answer: int
    points: int = 10

class CartItem(BaseModel):
    course_id: str

class CouponCreate(BaseModel):
    code: str
    discount_type: str = "percentage"  # percentage or fixed
    discount_value: float
    max_uses: Optional[int] = None
    valid_until: Optional[datetime] = None

class WithdrawalRequest(BaseModel):
    amount: float
    bank_details: str

class TicketCreate(BaseModel):
    subject: str
    message: str
    category: str

class MessageCreate(BaseModel):
    recipient_id: str
    content: str

class CMSUpdate(BaseModel):
    section: str
    content: Dict[str, Any]

class AssignmentCreate(BaseModel):
    title: str
    description: str
    course_id: str
    due_days: int = 7
    max_score: int = 100

class AssignmentSubmission(BaseModel):
    content: str
    file_key: Optional[str] = None

class ModuleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None

class LessonUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    content_type: Optional[str] = None
    content: Optional[str] = None
    video_key: Optional[str] = None
    duration_minutes: Optional[int] = None
    order: Optional[int] = None
    is_preview: Optional[bool] = None

# ======================== HELPER FUNCTIONS ========================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")
    user = await db.users.find_one({"id": payload.get("sub")}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.get("is_banned"):
        raise HTTPException(status_code=403, detail="User is banned")
    return user

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

def generate_referral_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

def generate_payu_hash(txnid: str, amount: str, productinfo: str, firstname: str, email: str):
    hash_string = f"{PAYU_MERCHANT_KEY}|{txnid}|{amount}|{productinfo}|{firstname}|{email}|||||||||||{PAYU_MERCHANT_SALT}"
    return hashlib.sha512(hash_string.encode('utf-8')).hexdigest()

# ======================== EMAIL FUNCTIONS ========================

def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """Send email using SMTP with SSL"""
    if not all([SMTP_HOST, SMTP_USER, SMTP_PASSWORD]):
        logger.warning("SMTP not configured, skipping email send")
        return False
    
    try:
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = f"LUMINA <{SMTP_USER}>"
        message["To"] = to_email
        
        html_part = MIMEText(html_content, "html")
        message.attach(html_part)
        
        # Create SSL context
        context = ssl.create_default_context()
        
        # Connect using SSL (port 465)
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, to_email, message.as_string())
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False

def send_otp_email(to_email: str, otp: str, user_name: str = "User"):
    """Send OTP verification email"""
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Inter', Arial, sans-serif; background-color: #0F172A; color: #F8FAFC; margin: 0; padding: 40px 20px; }}
            .container {{ max-width: 500px; margin: 0 auto; background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(139, 92, 246, 0.3); }}
            .logo {{ text-align: center; margin-bottom: 30px; }}
            .logo-text {{ font-size: 28px; font-weight: bold; background: linear-gradient(90deg, #00F5FF, #8B5CF6, #FF2E9F); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
            h1 {{ color: #F8FAFC; text-align: center; margin-bottom: 20px; }}
            .otp-box {{ background: rgba(139, 92, 246, 0.2); border: 1px solid #8B5CF6; border-radius: 12px; padding: 24px; text-align: center; margin: 30px 0; }}
            .otp-code {{ font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #8B5CF6; font-family: 'JetBrains Mono', monospace; }}
            p {{ color: #94A3B8; line-height: 1.6; }}
            .footer {{ text-align: center; margin-top: 30px; color: #64748B; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">
                <span class="logo-text">LUMINA</span>
            </div>
            <h1>Verify Your Email</h1>
            <p>Hi {user_name},</p>
            <p>Thank you for registering with LUMINA! Use the following OTP to verify your email address:</p>
            <div class="otp-box">
                <span class="otp-code">{otp}</span>
            </div>
            <p>This OTP is valid for 10 minutes. If you didn't request this, please ignore this email.</p>
            <div class="footer">
                <p>&copy; 2024 LUMINA. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email(to_email, "Verify Your LUMINA Account - OTP", html_content)

def send_password_reset_email(to_email: str, reset_token: str, user_name: str = "User"):
    """Send password reset email"""
    reset_link = f"{os.environ.get('FRONTEND_URL', 'https://skill-exchange-110.preview.emergentagent.com')}/reset-password?token={reset_token}"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Inter', Arial, sans-serif; background-color: #0F172A; color: #F8FAFC; margin: 0; padding: 40px 20px; }}
            .container {{ max-width: 500px; margin: 0 auto; background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(139, 92, 246, 0.3); }}
            .logo {{ text-align: center; margin-bottom: 30px; }}
            .logo-text {{ font-size: 28px; font-weight: bold; background: linear-gradient(90deg, #00F5FF, #8B5CF6, #FF2E9F); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
            h1 {{ color: #F8FAFC; text-align: center; margin-bottom: 20px; }}
            .btn {{ display: inline-block; background: linear-gradient(90deg, #8B5CF6, #7C3AED); color: white; padding: 14px 32px; text-decoration: none; border-radius: 50px; font-weight: 600; margin: 20px 0; }}
            p {{ color: #94A3B8; line-height: 1.6; }}
            .footer {{ text-align: center; margin-top: 30px; color: #64748B; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">
                <span class="logo-text">LUMINA</span>
            </div>
            <h1>Reset Your Password</h1>
            <p>Hi {user_name},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center;">
                <a href="{reset_link}" class="btn">Reset Password</a>
            </div>
            <p>This link is valid for 1 hour. If you didn't request this, please ignore this email.</p>
            <div class="footer">
                <p>&copy; 2024 LUMINA. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email(to_email, "Reset Your LUMINA Password", html_content)

def send_payment_confirmation_email(to_email: str, user_name: str, order_total: float, courses: list):
    """Send payment confirmation email"""
    course_list = "".join([f"<li>{c['title']}</li>" for c in courses])
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Inter', Arial, sans-serif; background-color: #0F172A; color: #F8FAFC; margin: 0; padding: 40px 20px; }}
            .container {{ max-width: 500px; margin: 0 auto; background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(16, 185, 129, 0.3); }}
            .logo {{ text-align: center; margin-bottom: 30px; }}
            .logo-text {{ font-size: 28px; font-weight: bold; background: linear-gradient(90deg, #00F5FF, #8B5CF6, #FF2E9F); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
            h1 {{ color: #10B981; text-align: center; margin-bottom: 20px; }}
            .amount {{ font-size: 32px; font-weight: bold; color: #10B981; text-align: center; }}
            ul {{ color: #94A3B8; }}
            li {{ padding: 8px 0; }}
            p {{ color: #94A3B8; line-height: 1.6; }}
            .footer {{ text-align: center; margin-top: 30px; color: #64748B; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">
                <span class="logo-text">LUMINA</span>
            </div>
            <h1>Payment Successful!</h1>
            <p>Hi {user_name},</p>
            <p>Thank you for your purchase! Your payment has been confirmed.</p>
            <p class="amount">₹{order_total:.2f}</p>
            <p><strong>Courses Purchased:</strong></p>
            <ul>{course_list}</ul>
            <p>You can now access your courses from your dashboard. Happy learning!</p>
            <div class="footer">
                <p>&copy; 2024 LUMINA. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email(to_email, "Payment Confirmed - LUMINA", html_content)

def send_order_success_email(to_email: str, user_name: str, order: dict, courses: list):
    """Send order success email with invoice details"""
    course_rows = ""
    for course in courses:
        price = course.get("discount_price") or course.get("price", 0)
        course_rows += f"""
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">{course['title']}</td>
            <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right;">${price:.2f}</td>
        </tr>
        """
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Inter', Arial, sans-serif; background-color: #0F172A; color: #F8FAFC; margin: 0; padding: 40px 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(16, 185, 129, 0.3); }}
            .logo {{ text-align: center; margin-bottom: 30px; }}
            .logo-text {{ font-size: 28px; font-weight: bold; background: linear-gradient(90deg, #00F5FF, #8B5CF6, #FF2E9F); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
            h1 {{ color: #10B981; text-align: center; margin-bottom: 10px; }}
            .invoice-box {{ background: rgba(30, 41, 59, 0.8); border-radius: 12px; padding: 20px; margin: 20px 0; }}
            .invoice-header {{ display: flex; justify-content: space-between; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); }}
            table {{ width: 100%; border-collapse: collapse; }}
            th {{ text-align: left; padding: 12px; color: #94A3B8; font-weight: 500; }}
            .total-row {{ background: rgba(16, 185, 129, 0.1); }}
            .total-row td {{ font-weight: bold; color: #10B981; }}
            p {{ color: #94A3B8; line-height: 1.6; }}
            .btn {{ display: inline-block; background: linear-gradient(90deg, #8B5CF6, #7C3AED); color: white; padding: 14px 32px; text-decoration: none; border-radius: 50px; font-weight: 600; }}
            .footer {{ text-align: center; margin-top: 30px; color: #64748B; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">
                <span class="logo-text">LUMINA</span>
            </div>
            <h1>Order Confirmed!</h1>
            <p style="text-align: center; margin-bottom: 30px;">Thank you for your purchase, {user_name}!</p>
            
            <div class="invoice-box">
                <div style="margin-bottom: 20px;">
                    <p style="margin: 0; color: #64748B; font-size: 14px;">Invoice Number</p>
                    <p style="margin: 5px 0; color: #F8FAFC; font-size: 18px; font-weight: bold;">{order['txn_id']}</p>
                </div>
                <div style="margin-bottom: 20px;">
                    <p style="margin: 0; color: #64748B; font-size: 14px;">Order Date</p>
                    <p style="margin: 5px 0; color: #F8FAFC;">{datetime.fromisoformat(order['created_at']).strftime('%B %d, %Y')}</p>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Course</th>
                            <th style="text-align: right;">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {course_rows}
                        <tr class="total-row">
                            <td style="padding: 12px;">Total Paid</td>
                            <td style="padding: 12px; text-align: right; font-size: 20px;">${order['total']:.2f}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <p style="text-align: center;">
                <a href="https://skill-exchange-110.preview.emergentagent.com/my-courses" class="btn">Start Learning</a>
            </p>
            
            <p style="text-align: center; margin-top: 30px;">
                Need help? Contact us at <a href="mailto:support@lumina.com" style="color: #8B5CF6;">support@lumina.com</a>
            </p>
            
            <div class="footer">
                <p>&copy; 2024 LUMINA. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email(to_email, f"Order Confirmed - Invoice #{order['txn_id']}", html_content)

def send_withdrawal_notification_email(to_email: str, user_name: str, amount: float, status: str):
    """Send withdrawal status notification"""
    status_color = "#10B981" if status == "approved" else "#EF4444"
    status_text = "approved and processed" if status == "approved" else "rejected"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Inter', Arial, sans-serif; background-color: #0F172A; color: #F8FAFC; margin: 0; padding: 40px 20px; }}
            .container {{ max-width: 500px; margin: 0 auto; background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(139, 92, 246, 0.3); }}
            .logo {{ text-align: center; margin-bottom: 30px; }}
            .logo-text {{ font-size: 28px; font-weight: bold; background: linear-gradient(90deg, #00F5FF, #8B5CF6, #FF2E9F); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
            h1 {{ color: {status_color}; text-align: center; }}
            .amount {{ font-size: 32px; font-weight: bold; color: {status_color}; text-align: center; }}
            p {{ color: #94A3B8; line-height: 1.6; }}
            .footer {{ text-align: center; margin-top: 30px; color: #64748B; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">
                <span class="logo-text">LUMINA</span>
            </div>
            <h1>Withdrawal {status.title()}</h1>
            <p>Hi {user_name},</p>
            <p>Your withdrawal request has been {status_text}.</p>
            <p class="amount">${amount:.2f}</p>
            {"<p>The amount will be transferred to your bank account within 3-5 business days.</p>" if status == "approved" else "<p>Please contact support if you have any questions.</p>"}
            <div class="footer">
                <p>&copy; 2024 LUMINA. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email(to_email, f"Withdrawal {status.title()} - LUMINA", html_content)

def send_certificate_email(to_email: str, user_name: str, course_title: str, certificate_id: str, verification_url: str):
    """Send certificate generation notification email"""
    html_content = f"""
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #0F172A; margin: 0; padding: 20px; color: #F8FAFC; }}
            .container {{ max-width: 600px; margin: 0 auto; background: linear-gradient(145deg, #1E293B, #0F172A); border-radius: 20px; padding: 40px; border: 1px solid #8B5CF6; }}
            .header {{ text-align: center; margin-bottom: 30px; }}
            .logo {{ font-size: 32px; font-weight: bold; background: linear-gradient(90deg, #00F5FF, #8B5CF6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
            .trophy {{ font-size: 60px; margin: 20px 0; }}
            h1 {{ color: #F8FAFC; font-size: 28px; margin: 0; }}
            .subtitle {{ color: #94A3B8; font-size: 16px; }}
            .content {{ margin: 30px 0; }}
            .course-box {{ background: #1E293B; border-radius: 12px; padding: 20px; border-left: 4px solid #8B5CF6; margin: 20px 0; }}
            .course-title {{ color: #8B5CF6; font-size: 18px; font-weight: bold; margin-bottom: 5px; }}
            .cert-id {{ font-family: monospace; background: #374151; padding: 8px 16px; border-radius: 8px; display: inline-block; margin: 10px 0; color: #00F5FF; }}
            .btn {{ display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8B5CF6, #6366F1); color: white; text-decoration: none; border-radius: 12px; font-weight: bold; margin: 10px 5px; }}
            .btn-outline {{ background: transparent; border: 2px solid #8B5CF6; color: #8B5CF6; }}
            .footer {{ text-align: center; margin-top: 30px; color: #64748B; font-size: 14px; border-top: 1px solid #374151; padding-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">CHAND WEB TECHNOLOGY</div>
                <div class="trophy">🏆</div>
                <h1>Congratulations, {user_name}!</h1>
                <p class="subtitle">You've earned a certificate!</p>
            </div>
            
            <div class="content">
                <p>We're thrilled to inform you that your certificate has been successfully generated for completing:</p>
                
                <div class="course-box">
                    <div class="course-title">{course_title}</div>
                    <p style="color: #94A3B8; margin: 0;">Certificate of Completion</p>
                </div>
                
                <p><strong>Certificate ID:</strong></p>
                <div class="cert-id">{certificate_id}</div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="{verification_url}" class="btn">View Certificate</a>
                    <a href="{verification_url.replace('/verify/', '/certificates')}" class="btn btn-outline">Download</a>
                </div>
            </div>
            
            <div class="footer">
                <p>This certificate is verifiable at any time using the Certificate ID above.</p>
                <p>ISO 9001:2015 Certified | MSME Registered</p>
                <p>&copy; 2026 Chand Web Technology. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email(to_email, f"🎉 Certificate Earned - {course_title}", html_content)

# ======================== R2 STORAGE FUNCTIONS ========================

def upload_to_r2(file_data: bytes, object_key: str, content_type: str = "application/octet-stream") -> bool:
    """Upload file to Cloudflare R2"""
    if not r2_client:
        logger.warning("R2 client not initialized")
        return False
    
    try:
        r2_client.put_object(
            Bucket=R2_BUCKET_NAME,
            Key=object_key,
            Body=file_data,
            ContentType=content_type
        )
        logger.info(f"Uploaded {object_key} to R2")
        return True
    except ClientError as e:
        logger.error(f"Failed to upload to R2: {e}")
        return False

def get_r2_signed_url(object_key: str, expiry_seconds: int = 3600) -> Optional[str]:
    """Generate a signed URL for R2 object"""
    if not r2_client:
        logger.warning("R2 client not initialized")
        return None
    
    try:
        url = r2_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': R2_BUCKET_NAME, 'Key': object_key},
            ExpiresIn=expiry_seconds
        )
        return url
    except ClientError as e:
        logger.error(f"Failed to generate signed URL: {e}")
        return None

def delete_from_r2(object_key: str) -> bool:
    """Delete file from R2"""
    if not r2_client:
        return False
    
    try:
        r2_client.delete_object(Bucket=R2_BUCKET_NAME, Key=object_key)
        logger.info(f"Deleted {object_key} from R2")
        return True
    except ClientError as e:
        logger.error(f"Failed to delete from R2: {e}")
        return False

# ======================== HEALTH CHECK ========================

@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "services": {
            "database": "connected",
            "smtp": "configured" if SMTP_HOST else "not_configured",
            "r2_storage": "configured" if r2_client else "not_configured",
            "payu": "configured" if PAYU_MERCHANT_KEY else "not_configured"
        }
    }

# ======================== AUTH ROUTES ========================

@api_router.post("/auth/register")
async def register(data: UserRegisterWithReferral):
    # Check if user exists
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate referral code if provided
    referred_by_id = None
    if data.referral_code:
        referrer = await db.users.find_one({"referral_code": data.referral_code}, {"_id": 0})
        if not referrer:
            raise HTTPException(status_code=400, detail="Invalid referral code")
        referred_by_id = referrer["id"]
    
    # Generate OTP
    otp = generate_otp()
    otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    # Create user
    user_id = str(uuid.uuid4())
    referral_code = generate_referral_code()
    
    # Prevent self-referral
    if data.referral_code and data.referral_code == referral_code:
        raise HTTPException(status_code=400, detail="Cannot use own referral code")
    
    user_doc = {
        "id": user_id,
        "email": data.email,
        "password": hash_password(data.password),
        "first_name": data.first_name,
        "last_name": data.last_name,
        "role": "student",
        "is_verified": False,
        "is_banned": False,
        "is_paused": False,
        "otp": otp,
        "otp_expiry": otp_expiry.isoformat(),
        "referral_code": referral_code,
        "referred_by": referred_by_id,  # Store referrer's user ID (permanent)
        "wallet_balance": 0.0,
        "total_earnings": 0.0,
        "pending_earnings": 0.0,
        "points": 0,
        "badges": [],
        "avatar_url": f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_id}",
        "profile_image_key": None,
        "phone": None,
        "bio": None,
        "college_details": {
            "college_name": None,
            "degree": None,
            "branch": None,
            "year_of_study": None,
            "roll_number": None
        },
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # Send OTP via SMTP
    send_otp_email(data.email, otp, data.first_name)
    logger.info(f"OTP for {data.email}: {otp}")
    
    return {"message": "Registration successful. Please verify your email with OTP.", "email": data.email}

@api_router.post("/auth/verify-otp")
async def verify_otp(data: OTPVerify):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("is_verified"):
        return {"message": "Email already verified"}
    
    if user.get("otp") != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    otp_expiry = datetime.fromisoformat(user.get("otp_expiry"))
    if datetime.now(timezone.utc) > otp_expiry:
        raise HTTPException(status_code=400, detail="OTP expired")
    
    await db.users.update_one(
        {"email": data.email},
        {"$set": {"is_verified": True, "otp": None, "otp_expiry": None}}
    )
    
    return {"message": "Email verified successfully"}

@api_router.post("/auth/resend-otp")
async def resend_otp(data: PasswordReset):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    otp = generate_otp()
    otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    await db.users.update_one(
        {"email": data.email},
        {"$set": {"otp": otp, "otp_expiry": otp_expiry.isoformat()}}
    )
    
    # Send OTP email
    send_otp_email(data.email, otp, user.get("first_name", "User"))
    logger.info(f"New OTP for {data.email}: {otp}")
    
    return {"message": "OTP sent successfully"}

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(data.password, user.get("password")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("is_verified"):
        raise HTTPException(status_code=403, detail="Please verify your email first")
    
    if user.get("is_banned"):
        raise HTTPException(status_code=403, detail="Your account has been banned")
    
    # Create tokens
    access_token = create_access_token({"sub": user["id"], "role": user["role"]})
    refresh_token = create_refresh_token({"sub": user["id"]})
    
    # Log login
    await db.login_logs.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ip_address": "unknown"
    })
    
    user_response = {k: v for k, v in user.items() if k != "password"}
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user_response
    }

@api_router.post("/auth/refresh")
async def refresh_token(refresh_token: str):
    payload = decode_token(refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")
    
    user = await db.users.find_one({"id": payload.get("sub")}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    access_token = create_access_token({"sub": user["id"], "role": user["role"]})
    
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.post("/auth/forgot-password")
async def forgot_password(data: PasswordReset):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user:
        return {"message": "If email exists, reset link will be sent"}
    
    reset_token = secrets.token_urlsafe(32)
    expiry = datetime.now(timezone.utc) + timedelta(hours=1)
    
    await db.password_resets.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "token": reset_token,
        "expiry": expiry.isoformat(),
        "used": False
    })
    
    logger.info(f"Password reset token for {data.email}: {reset_token}")
    
    return {"message": "If email exists, reset link will be sent"}

@api_router.post("/auth/reset-password")
async def reset_password(data: PasswordResetConfirm):
    reset = await db.password_resets.find_one({"token": data.token, "used": False}, {"_id": 0})
    if not reset:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    expiry = datetime.fromisoformat(reset["expiry"])
    if datetime.now(timezone.utc) > expiry:
        raise HTTPException(status_code=400, detail="Token expired")
    
    await db.users.update_one(
        {"id": reset["user_id"]},
        {"$set": {"password": hash_password(data.new_password)}}
    )
    
    await db.password_resets.update_one(
        {"token": data.token},
        {"$set": {"used": True}}
    )
    
    return {"message": "Password reset successful"}

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    user_data = {k: v for k, v in current_user.items() if k not in ["password", "profile_image"]}
    
    # Generate profile image URL if exists (stored in MongoDB)
    if current_user.get("profile_image") and current_user["profile_image"].get("data"):
        content_type = current_user["profile_image"].get("content_type", "image/jpeg")
        user_data["profile_image_url"] = f"data:{content_type};base64,{current_user['profile_image']['data']}"
    # Fallback to R2 if using that storage
    elif user_data.get("profile_image_key"):
        signed_url = get_r2_signed_url(user_data["profile_image_key"], expiry_seconds=600)
        if signed_url:
            user_data["profile_image_url"] = signed_url
    
    return user_data

@api_router.put("/auth/profile")
async def update_profile(data: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {}
    
    # Handle regular fields
    for field in ["first_name", "last_name", "phone", "bio"]:
        value = getattr(data, field)
        if value is not None:
            update_data[field] = value
    
    # Handle college details
    college_fields = ["college_name", "degree", "branch", "year_of_study", "roll_number"]
    college_update = {}
    for field in college_fields:
        value = getattr(data, field)
        if value is not None:
            college_update[f"college_details.{field}"] = value
    
    if college_update:
        update_data.update(college_update)
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": update_data}
    )
    
    return {"message": "Profile updated successfully"}

@api_router.post("/user/upload-profile-image")
async def upload_profile_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPG, PNG, WEBP allowed")
    
    # Read file
    data = await file.read()
    
    # Validate file size (max 2MB for MongoDB storage)
    if len(data) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 2MB allowed")
    
    # Convert to Base64 for MongoDB storage
    import base64
    base64_data = base64.b64encode(data).decode('utf-8')
    
    # Update user profile with image stored in MongoDB
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {
            "profile_image": {
                "data": base64_data,
                "content_type": file.content_type
            },
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Profile image uploaded successfully"}

@api_router.get("/user/profile-image")
async def get_profile_image(current_user: dict = Depends(get_current_user)):
    """Get profile image from MongoDB"""
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    
    if not user.get("profile_image") or not user["profile_image"].get("data"):
        return {"image_url": None}
    
    # Return as data URL
    content_type = user["profile_image"].get("content_type", "image/jpeg")
    data_url = f"data:{content_type};base64,{user['profile_image']['data']}"
    return {"image_url": data_url}

@api_router.get("/user/profile-image-raw")
async def get_profile_image_raw(user_id: str):
    """Get profile image as raw binary for public access"""
    import base64
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    
    if not user or not user.get("profile_image") or not user["profile_image"].get("data"):
        raise HTTPException(status_code=404, detail="Image not found")
    
    image_data = base64.b64decode(user["profile_image"]["data"])
    content_type = user["profile_image"].get("content_type", "image/jpeg")
    
    return Response(content=image_data, media_type=content_type)

@api_router.post("/auth/change-password")
async def change_password(old_password: str, new_password: str, current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    if not verify_password(old_password, user.get("password")):
        raise HTTPException(status_code=400, detail="Invalid current password")
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"password": hash_password(new_password)}}
    )
    
    return {"message": "Password changed successfully"}

# ======================== COURSE ROUTES ========================

@api_router.get("/courses")
async def get_courses(
    category: Optional[str] = None,
    level: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    page: int = 1,
    limit: int = 12
):
    query = {"is_published": True}
    
    if category:
        query["category"] = category
    if level:
        query["level"] = level
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    sort_direction = -1 if sort_order == "desc" else 1
    
    total = await db.courses.count_documents(query)
    courses = await db.courses.find(query, {"_id": 0}).sort(sort_by, sort_direction).skip((page - 1) * limit).limit(limit).to_list(limit)
    
    # Get ratings for each course
    for course in courses:
        reviews = await db.reviews.find({"course_id": course["id"]}, {"_id": 0}).to_list(1000)
        if reviews:
            course["average_rating"] = sum(r["rating"] for r in reviews) / len(reviews)
            course["review_count"] = len(reviews)
        else:
            course["average_rating"] = 0
            course["review_count"] = 0
        
        # Get enrollment count
        enrollments = await db.enrollments.count_documents({"course_id": course["id"]})
        course["enrollment_count"] = enrollments
    
    return {
        "courses": courses,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@api_router.get("/courses/categories")
async def get_categories():
    categories = await db.courses.distinct("category", {"is_published": True})
    return {"categories": categories}

@api_router.get("/courses/{course_id}")
async def get_course(course_id: str):
    course = await db.courses.find_one({"id": course_id}, {"_id": 0})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Get modules with lessons
    modules = await db.modules.find({"course_id": course_id}, {"_id": 0}).sort("order", 1).to_list(100)
    for module in modules:
        lessons = await db.lessons.find({"module_id": module["id"]}, {"_id": 0}).sort("order", 1).to_list(100)
        # Don't expose video keys to non-enrolled users
        for lesson in lessons:
            if lesson.get("video_key"):
                lesson["has_video"] = True
                del lesson["video_key"]
        module["lessons"] = lessons
        
        # Get quiz if exists
        quiz = await db.quizzes.find_one({"module_id": module["id"]}, {"_id": 0})
        if quiz:
            questions = await db.questions.find({"quiz_id": quiz["id"]}, {"_id": 0}).to_list(100)
            # Don't expose correct answers
            for q in questions:
                del q["correct_answer"]
            quiz["questions"] = questions
            module["quiz"] = quiz
    
    course["modules"] = modules
    
    # Get reviews
    reviews = await db.reviews.find({"course_id": course_id}, {"_id": 0}).sort("created_at", -1).limit(10).to_list(10)
    for review in reviews:
        user = await db.users.find_one({"id": review["user_id"]}, {"_id": 0, "first_name": 1, "last_name": 1, "avatar_url": 1})
        review["user"] = user
    
    course["reviews"] = reviews
    
    # Get stats
    all_reviews = await db.reviews.find({"course_id": course_id}, {"_id": 0}).to_list(1000)
    if all_reviews:
        course["average_rating"] = sum(r["rating"] for r in all_reviews) / len(all_reviews)
        course["review_count"] = len(all_reviews)
    else:
        course["average_rating"] = 0
        course["review_count"] = 0
    
    course["enrollment_count"] = await db.enrollments.count_documents({"course_id": course_id})
    
    # Get instructor info
    instructor = await db.users.find_one({"id": course.get("instructor_id", "")}, {"_id": 0, "password": 0})
    course["instructor"] = instructor
    
    return course

@api_router.get("/courses/{course_id}/enrolled")
async def get_enrolled_course(course_id: str, current_user: dict = Depends(get_current_user)):
    enrollment = await db.enrollments.find_one(
        {"course_id": course_id, "user_id": current_user["id"]},
        {"_id": 0}
    )
    if not enrollment:
        raise HTTPException(status_code=403, detail="Not enrolled in this course")
    
    course = await db.courses.find_one({"id": course_id}, {"_id": 0})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Get modules with full lesson data
    modules = await db.modules.find({"course_id": course_id}, {"_id": 0}).sort("order", 1).to_list(100)
    for module in modules:
        lessons = await db.lessons.find({"module_id": module["id"]}, {"_id": 0}).sort("order", 1).to_list(100)
        
        for lesson in lessons:
            # Get progress
            progress = await db.lesson_progress.find_one(
                {"lesson_id": lesson["id"], "user_id": current_user["id"]},
                {"_id": 0}
            )
            lesson["progress"] = progress
        
        module["lessons"] = lessons
        
        # Get quiz with answers for grading
        quiz = await db.quizzes.find_one({"module_id": module["id"]}, {"_id": 0})
        if quiz:
            questions = await db.questions.find({"quiz_id": quiz["id"]}, {"_id": 0}).to_list(100)
            quiz["questions"] = questions
            
            # Get quiz attempt
            attempt = await db.quiz_attempts.find_one(
                {"quiz_id": quiz["id"], "user_id": current_user["id"]},
                {"_id": 0}
            )
            quiz["attempt"] = attempt
            module["quiz"] = quiz
    
    course["modules"] = modules
    course["enrollment"] = enrollment
    
    return course

# ======================== ENROLLED COURSES ROUTE ========================

@api_router.get("/enrolled-courses")
async def get_enrolled_courses(current_user: dict = Depends(get_current_user)):
    """Get all courses the user is enrolled in"""
    enrollments = await db.enrollments.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).to_list(100)
    
    courses = []
    for enrollment in enrollments:
        course = await db.courses.find_one({"id": enrollment["course_id"]}, {"_id": 0})
        if course:
            course["enrollment"] = enrollment
            
            # Get module/lesson counts
            modules = await db.modules.find({"course_id": course["id"]}, {"_id": 0}).to_list(100)
            total_lessons = 0
            for module in modules:
                lesson_count = await db.lessons.count_documents({"module_id": module["id"]})
                total_lessons += lesson_count
            course["total_modules"] = len(modules)
            course["total_lessons"] = total_lessons
            courses.append(course)
    
    return {"courses": courses}

# ======================== CART & WISHLIST ROUTES ========================

@api_router.get("/cart")
async def get_cart(current_user: dict = Depends(get_current_user)):
    cart_items = await db.cart.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(100)
    
    items = []
    total = 0
    for item in cart_items:
        course = await db.courses.find_one({"id": item["course_id"]}, {"_id": 0})
        if course:
            price = course.get("discount_price") or course.get("price", 0)
            items.append({
                "id": item["id"],
                "course": course,
                "price": price
            })
            total += price
    
    return {"items": items, "total": total}

@api_router.post("/cart")
async def add_to_cart(data: CartItem, current_user: dict = Depends(get_current_user)):
    # Check if already enrolled
    enrollment = await db.enrollments.find_one(
        {"course_id": data.course_id, "user_id": current_user["id"]}
    )
    if enrollment:
        raise HTTPException(status_code=400, detail="Already enrolled in this course")
    
    # Check if already in cart
    existing = await db.cart.find_one(
        {"course_id": data.course_id, "user_id": current_user["id"]}
    )
    if existing:
        raise HTTPException(status_code=400, detail="Course already in cart")
    
    cart_item = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "course_id": data.course_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.cart.insert_one(cart_item)
    
    return {"message": "Added to cart", "id": cart_item["id"]}

@api_router.delete("/cart/{item_id}")
async def remove_from_cart(item_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.cart.delete_one({"id": item_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    return {"message": "Removed from cart"}

@api_router.get("/wishlist")
async def get_wishlist(current_user: dict = Depends(get_current_user)):
    wishlist_items = await db.wishlist.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(100)
    
    items = []
    for item in wishlist_items:
        course = await db.courses.find_one({"id": item["course_id"]}, {"_id": 0})
        if course:
            items.append({
                "id": item["id"],
                "course": course
            })
    
    return {"items": items}

@api_router.post("/wishlist")
async def add_to_wishlist(data: CartItem, current_user: dict = Depends(get_current_user)):
    existing = await db.wishlist.find_one(
        {"course_id": data.course_id, "user_id": current_user["id"]}
    )
    if existing:
        raise HTTPException(status_code=400, detail="Course already in wishlist")
    
    wishlist_item = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "course_id": data.course_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.wishlist.insert_one(wishlist_item)
    
    return {"message": "Added to wishlist", "id": wishlist_item["id"]}

@api_router.delete("/wishlist/{item_id}")
async def remove_from_wishlist(item_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.wishlist.delete_one({"id": item_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Wishlist item not found")
    return {"message": "Removed from wishlist"}

# ======================== PAYMENT ROUTES ========================

@api_router.post("/payments/initiate")
async def initiate_payment(
    coupon_code: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    cart_items = await db.cart.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(100)
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    course_ids = [item["course_id"] for item in cart_items]
    courses = await db.courses.find({"id": {"$in": course_ids}}, {"_id": 0}).to_list(100)
    
    total = sum(c.get("discount_price") or c.get("price", 0) for c in courses)
    discount = 0
    
    # Apply coupon if provided
    if coupon_code:
        coupon = await db.coupons.find_one({"code": coupon_code, "is_active": True}, {"_id": 0})
        if coupon:
            if coupon.get("valid_until"):
                expiry = datetime.fromisoformat(coupon["valid_until"])
                if datetime.now(timezone.utc) > expiry:
                    raise HTTPException(status_code=400, detail="Coupon expired")
            
            if coupon.get("max_uses"):
                uses = await db.coupon_uses.count_documents({"coupon_id": coupon["id"]})
                if uses >= coupon["max_uses"]:
                    raise HTTPException(status_code=400, detail="Coupon usage limit reached")
            
            if coupon["discount_type"] == "percentage":
                discount = total * (coupon["discount_value"] / 100)
            else:
                discount = coupon["discount_value"]
    
    final_amount = max(0, total - discount)
    
    # Create order
    txn_id = f"TXN{datetime.now().strftime('%Y%m%d%H%M%S')}{secrets.token_hex(4).upper()}"
    
    order = {
        "id": str(uuid.uuid4()),
        "txn_id": txn_id,
        "user_id": current_user["id"],
        "course_ids": course_ids,
        "subtotal": total,
        "discount": discount,
        "coupon_code": coupon_code,
        "total": final_amount,
        "status": "pending",
        "payment_method": "payu",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(order)
    
    # Generate PayU hash
    product_info = f"Courses: {', '.join(c['title'] for c in courses)}"
    hash_value = generate_payu_hash(
        txn_id,
        str(final_amount),
        product_info,
        current_user["first_name"],
        current_user["email"]
    )
    
    return {
        "order_id": order["id"],
        "txn_id": txn_id,
        "amount": final_amount,
        "merchant_key": PAYU_MERCHANT_KEY,
        "hash": hash_value,
        "product_info": product_info,
        "firstname": current_user["first_name"],
        "email": current_user["email"],
        "phone": current_user.get("phone", ""),
        "payu_url": "https://test.payu.in/_payment" if PAYU_TEST_ENV else "https://secure.payu.in/_payment"
    }

@api_router.post("/payments/success")
async def payment_success(
    txnid: str,
    status: str,
    hash: str,
    mihpayid: str = None,
    mode: str = None
):
    order = await db.orders.find_one({"txn_id": txnid}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if status == "success":
        # Update order
        await db.orders.update_one(
            {"txn_id": txnid},
            {"$set": {
                "status": "completed",
                "payment_id": mihpayid,
                "payment_mode": mode,
                "completed_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Create enrollments
        for course_id in order["course_ids"]:
            enrollment = {
                "id": str(uuid.uuid4()),
                "user_id": order["user_id"],
                "course_id": course_id,
                "order_id": order["id"],
                "progress_percentage": 0,
                "completed_lessons": [],
                "is_completed": False,
                "enrolled_at": datetime.now(timezone.utc).isoformat()
            }
            await db.enrollments.insert_one(enrollment)
        
        # Clear cart
        await db.cart.delete_many({"user_id": order["user_id"]})
        
        # Process referral commission - LIFETIME 20%
        user = await db.users.find_one({"id": order["user_id"]}, {"_id": 0})
        if user and user.get("referred_by"):
            # referred_by stores the referrer's user ID (permanent relationship)
            referrer = await db.users.find_one({"id": user["referred_by"]}, {"_id": 0})
            if referrer:
                # Get course details for each course in order
                for course_id in order["course_ids"]:
                    course = await db.courses.find_one({"id": course_id}, {"_id": 0})
                    if course:
                        course_price = course.get("discount_price") or course.get("price", 0)
                        commission_amount = course_price * 0.20  # 20% lifetime commission
                        
                        # Create referral earnings record
                        earning_record = {
                            "id": str(uuid.uuid4()),
                            "referrer_id": referrer["id"],
                            "buyer_id": order["user_id"],
                            "course_id": course_id,
                            "course_title": course.get("title"),
                            "course_price": course_price,
                            "commission_amount": commission_amount,
                            "order_id": order["id"],
                            "status": "available",  # Immediately available
                            "created_at": datetime.now(timezone.utc).isoformat()
                        }
                        await db.referral_earnings.insert_one(earning_record)
                        
                        # Update referrer's wallet balance immediately
                        await db.users.update_one(
                            {"id": referrer["id"]},
                            {
                                "$inc": {
                                    "wallet_balance": commission_amount,
                                    "total_earnings": commission_amount
                                }
                            }
                        )
                        
                        logger.info(f"Referral commission: ${commission_amount:.2f} to {referrer['email']} for course {course['title']}")
        
        # Record coupon use
        if order.get("coupon_code"):
            coupon = await db.coupons.find_one({"code": order["coupon_code"]}, {"_id": 0})
            if coupon:
                await db.coupon_uses.insert_one({
                    "id": str(uuid.uuid4()),
                    "coupon_id": coupon["id"],
                    "user_id": order["user_id"],
                    "order_id": order["id"],
                    "used_at": datetime.now(timezone.utc).isoformat()
                })
        
        # Send order confirmation email
        user = await db.users.find_one({"id": order["user_id"]}, {"_id": 0})
        courses = await db.courses.find({"id": {"$in": order["course_ids"]}}, {"_id": 0}).to_list(100)
        if user:
            send_order_success_email(
                user["email"],
                user.get("first_name", "User"),
                order,
                courses
            )
            logger.info(f"Order confirmation email sent to {user['email']}")
        
        return {"message": "Payment successful", "order_id": order["id"]}
    else:
        await db.orders.update_one(
            {"txn_id": txnid},
            {"$set": {"status": "failed"}}
        )
        raise HTTPException(status_code=400, detail="Payment failed")

@api_router.post("/payments/webhook")
async def payment_webhook(payload: dict):
    # PayU webhook handler
    txnid = payload.get("txnid")
    status = payload.get("status")
    
    if not txnid:
        return {"status": "ok"}
    
    # Verify and process similar to success endpoint
    order = await db.orders.find_one({"txn_id": txnid}, {"_id": 0})
    if order and order["status"] == "pending":
        if status == "success":
            # Process same as success endpoint
            pass
    
    return {"status": "ok"}

@api_router.get("/orders")
async def get_orders(current_user: dict = Depends(get_current_user)):
    orders = await db.orders.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    for order in orders:
        courses = await db.courses.find(
            {"id": {"$in": order["course_ids"]}},
            {"_id": 0}
        ).to_list(100)
        order["courses"] = courses
    
    return {"orders": orders}

# ======================== LESSON & PROGRESS ROUTES ========================

@api_router.get("/lessons/{lesson_id}/video")
async def get_lesson_video(
    lesson_id: str,
    current_user: dict = Depends(get_current_user)
):
    lesson = await db.lessons.find_one({"id": lesson_id}, {"_id": 0})
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    module = await db.modules.find_one({"id": lesson["module_id"]}, {"_id": 0})
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Check enrollment
    enrollment = await db.enrollments.find_one(
        {"course_id": module["course_id"], "user_id": current_user["id"]}
    )
    if not enrollment and not lesson.get("is_preview"):
        raise HTTPException(status_code=403, detail="Not enrolled in this course")
    
    if not lesson.get("video_key"):
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Log access
    await db.video_access_logs.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "lesson_id": lesson_id,
        "accessed_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Try R2 first (signed URL)
    if r2_client:
        signed_url = get_r2_signed_url(lesson["video_key"], expiry_seconds=3600)
        if signed_url:
            return {"video_url": signed_url, "expires_in": 3600}
    
    # Fallback to emergent storage
    try:
        video_data, content_type = get_object(lesson["video_key"])
        return Response(content=video_data, media_type=content_type)
    except Exception as e:
        logger.error(f"Error fetching video: {e}")
        raise HTTPException(status_code=500, detail="Error fetching video")

@api_router.post("/lessons/{lesson_id}/progress")
async def update_lesson_progress(
    lesson_id: str,
    watch_percentage: float,
    current_user: dict = Depends(get_current_user)
):
    lesson = await db.lessons.find_one({"id": lesson_id}, {"_id": 0})
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    module = await db.modules.find_one({"id": lesson["module_id"]}, {"_id": 0})
    
    # Check enrollment
    enrollment = await db.enrollments.find_one(
        {"course_id": module["course_id"], "user_id": current_user["id"]}
    )
    if not enrollment:
        raise HTTPException(status_code=403, detail="Not enrolled in this course")
    
    is_completed = watch_percentage >= 80
    
    # Update or create progress
    existing = await db.lesson_progress.find_one(
        {"lesson_id": lesson_id, "user_id": current_user["id"]}
    )
    
    if existing:
        await db.lesson_progress.update_one(
            {"lesson_id": lesson_id, "user_id": current_user["id"]},
            {"$set": {
                "watch_percentage": max(existing.get("watch_percentage", 0), watch_percentage),
                "is_completed": is_completed or existing.get("is_completed", False),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    else:
        await db.lesson_progress.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "lesson_id": lesson_id,
            "watch_percentage": watch_percentage,
            "is_completed": is_completed,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
    
    # Update enrollment progress
    if is_completed and lesson_id not in enrollment.get("completed_lessons", []):
        completed_lessons = enrollment.get("completed_lessons", []) + [lesson_id]
        
        # Calculate total lessons in course
        modules = await db.modules.find({"course_id": module["course_id"]}, {"_id": 0}).to_list(100)
        total_lessons = 0
        for m in modules:
            lesson_count = await db.lessons.count_documents({"module_id": m["id"]})
            total_lessons += lesson_count
        
        progress = (len(completed_lessons) / total_lessons * 100) if total_lessons > 0 else 0
        is_course_completed = len(completed_lessons) == total_lessons
        
        await db.enrollments.update_one(
            {"id": enrollment["id"]},
            {"$set": {
                "completed_lessons": completed_lessons,
                "progress_percentage": progress,
                "is_completed": is_course_completed,
                "completed_at": datetime.now(timezone.utc).isoformat() if is_course_completed else None
            }}
        )
        
        # Award points
        if is_completed:
            await db.users.update_one(
                {"id": current_user["id"]},
                {"$inc": {"points": 10}}
            )
    
    return {"message": "Progress updated", "is_completed": is_completed}

# ======================== QUIZ ROUTES ========================

@api_router.post("/quizzes/{quiz_id}/submit")
async def submit_quiz(
    quiz_id: str,
    answers: Dict[str, int],  # question_id -> selected_option_index
    current_user: dict = Depends(get_current_user)
):
    quiz = await db.quizzes.find_one({"id": quiz_id}, {"_id": 0})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    module = await db.modules.find_one({"id": quiz["module_id"]}, {"_id": 0})
    
    # Check enrollment
    enrollment = await db.enrollments.find_one(
        {"course_id": module["course_id"], "user_id": current_user["id"]}
    )
    if not enrollment:
        raise HTTPException(status_code=403, detail="Not enrolled in this course")
    
    # Check if already attempted
    existing_attempt = await db.quiz_attempts.find_one(
        {"quiz_id": quiz_id, "user_id": current_user["id"]}
    )
    if existing_attempt and existing_attempt.get("is_passed"):
        raise HTTPException(status_code=400, detail="Quiz already passed")
    
    # Grade quiz
    questions = await db.questions.find({"quiz_id": quiz_id}, {"_id": 0}).to_list(100)
    
    total_points = sum(q["points"] for q in questions)
    earned_points = 0
    results = []
    
    for question in questions:
        selected = answers.get(question["id"])
        is_correct = selected == question["correct_answer"]
        if is_correct:
            earned_points += question["points"]
        results.append({
            "question_id": question["id"],
            "selected": selected,
            "correct": question["correct_answer"],
            "is_correct": is_correct,
            "points_earned": question["points"] if is_correct else 0
        })
    
    score = (earned_points / total_points * 100) if total_points > 0 else 0
    is_passed = score >= quiz["passing_score"]
    
    # Save attempt
    attempt = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "quiz_id": quiz_id,
        "answers": answers,
        "results": results,
        "score": score,
        "is_passed": is_passed,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    if existing_attempt:
        await db.quiz_attempts.update_one(
            {"id": existing_attempt["id"]},
            {"$set": attempt}
        )
    else:
        await db.quiz_attempts.insert_one(attempt)
    
    # Award points for passing
    if is_passed:
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$inc": {"points": 50}}
        )
    
    return {
        "score": score,
        "is_passed": is_passed,
        "results": results,
        "passing_score": quiz["passing_score"]
    }

# ======================== REFERRAL ROUTES ========================

@api_router.get("/referrals/stats")
async def get_referral_stats(current_user: dict = Depends(get_current_user)):
    # Get all referral earnings
    earnings = await db.referral_earnings.find(
        {"referrer_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    total_earnings = sum(e["commission_amount"] for e in earnings)
    
    # Get referred users count (users who signed up with this user's referral code)
    referred_users_count = await db.users.count_documents({"referred_by": current_user["id"]})
    
    # Get referred users details
    referred_users = await db.users.find(
        {"referred_by": current_user["id"]},
        {"_id": 0, "id": 1, "first_name": 1, "last_name": 1, "email": 1, "created_at": 1}
    ).to_list(100)
    
    return {
        "referral_code": current_user["referral_code"],
        "referral_link": f"https://skill-exchange-110.preview.emergentagent.com/register?ref={current_user['referral_code']}",
        "total_earnings": total_earnings,
        "wallet_balance": current_user.get("wallet_balance", 0),
        "referred_users_count": referred_users_count,
        "referred_users": referred_users,
        "earnings_history": earnings
    }

@api_router.get("/referrals/earnings")
async def get_referral_earnings(current_user: dict = Depends(get_current_user)):
    """Get detailed earnings history"""
    earnings = await db.referral_earnings.find(
        {"referrer_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    # Enrich with buyer details
    for earning in earnings:
        buyer = await db.users.find_one(
            {"id": earning["buyer_id"]},
            {"_id": 0, "first_name": 1, "last_name": 1, "email": 1}
        )
        earning["buyer"] = buyer
    
    return {"earnings": earnings}

@api_router.post("/referrals/apply/{code}")
async def apply_referral_code(code: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("referred_by"):
        raise HTTPException(status_code=400, detail="Referral code already applied")
    
    referrer = await db.users.find_one({"referral_code": code}, {"_id": 0})
    if not referrer:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    
    if referrer["id"] == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot use own referral code")
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"referred_by": code}}
    )
    
    return {"message": "Referral code applied successfully"}

@api_router.post("/referrals/withdraw")
async def request_withdrawal(
    data: WithdrawalRequest,
    current_user: dict = Depends(get_current_user)
):
    # Check wallet balance
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    wallet_balance = user.get("wallet_balance", 0)
    
    if data.amount > wallet_balance:
        raise HTTPException(status_code=400, detail="Insufficient wallet balance")
    
    if data.amount < 10:
        raise HTTPException(status_code=400, detail="Minimum withdrawal amount is $10")
    
    # Create withdrawal request
    withdrawal = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "amount": data.amount,
        "bank_details": data.bank_details,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.withdrawals.insert_one(withdrawal)
    
    # Deduct from wallet balance (pending state - will be returned if rejected)
    await db.users.update_one(
        {"id": current_user["id"]},
        {
            "$inc": {"wallet_balance": -data.amount},
            "$set": {"pending_earnings": user.get("pending_earnings", 0) + data.amount}
        }
    )
    
    # Notify admin
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": "admin",  # Admin notification
        "type": "withdrawal_request",
        "title": "New Withdrawal Request",
        "message": f"{user.get('first_name')} {user.get('last_name')} requested withdrawal of ${data.amount:.2f}",
        "data": {"withdrawal_id": withdrawal["id"]},
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Withdrawal request submitted", "withdrawal_id": withdrawal["id"]}

@api_router.get("/referrals/withdrawals")
async def get_withdrawals(current_user: dict = Depends(get_current_user)):
    withdrawals = await db.withdrawals.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return {"withdrawals": withdrawals}

# ======================== TICKET ROUTES ========================

@api_router.post("/tickets")
async def create_ticket(data: TicketCreate, current_user: dict = Depends(get_current_user)):
    ticket = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "subject": data.subject,
        "category": data.category,
        "status": "open",
        "messages": [{
            "id": str(uuid.uuid4()),
            "sender_id": current_user["id"],
            "sender_role": "student",
            "content": data.message,
            "created_at": datetime.now(timezone.utc).isoformat()
        }],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.tickets.insert_one(ticket)
    
    return {"message": "Ticket created", "ticket_id": ticket["id"]}

@api_router.get("/tickets")
async def get_tickets(current_user: dict = Depends(get_current_user)):
    query = {"user_id": current_user["id"]}
    if current_user["role"] == "admin":
        query = {}
    
    tickets = await db.tickets.find(query, {"_id": 0}).sort("updated_at", -1).to_list(100)
    
    return {"tickets": tickets}

@api_router.get("/tickets/{ticket_id}")
async def get_ticket(ticket_id: str, current_user: dict = Depends(get_current_user)):
    ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    if ticket["user_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    return ticket

@api_router.post("/tickets/{ticket_id}/reply")
async def reply_to_ticket(
    ticket_id: str,
    content: str,
    current_user: dict = Depends(get_current_user)
):
    ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    if ticket["user_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    message = {
        "id": str(uuid.uuid4()),
        "sender_id": current_user["id"],
        "sender_role": current_user["role"],
        "content": content,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Update status to in-progress if admin replies
    update_ops = {
        "$push": {"messages": message},
        "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
    }
    
    if current_user["role"] == "admin" and ticket["status"] == "open":
        update_ops["$set"]["status"] = "in-progress"
    
    await db.tickets.update_one({"id": ticket_id}, update_ops)
    
    return {"message": "Reply added"}

@api_router.put("/tickets/{ticket_id}/status")
async def update_ticket_status(
    ticket_id: str,
    status: str,
    current_user: dict = Depends(get_current_user)
):
    """Update ticket status - open, in-progress, closed"""
    if status not in ["open", "in-progress", "closed"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Only admin can change status, or user can mark as solved (closed)
    if current_user["role"] != "admin":
        if ticket["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        if status != "closed":
            raise HTTPException(status_code=403, detail="Users can only close their own tickets")
    
    await db.tickets.update_one(
        {"id": ticket_id},
        {"$set": {
            "status": status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": f"Ticket status updated to {status}"}

@api_router.post("/tickets/{ticket_id}/close")
async def close_ticket(ticket_id: str, current_user: dict = Depends(get_current_user)):
    """Close a ticket"""
    ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    if ticket["user_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.tickets.update_one(
        {"id": ticket_id},
        {"$set": {
            "status": "closed",
            "closed_at": datetime.now(timezone.utc).isoformat(),
            "closed_by": current_user["id"],
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Ticket closed"}

@api_router.post("/tickets/{ticket_id}/reopen")
async def reopen_ticket(ticket_id: str, current_user: dict = Depends(get_current_user)):
    """Reopen a closed ticket - admin only"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    await db.tickets.update_one(
        {"id": ticket_id},
        {
            "$set": {
                "status": "open",
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$unset": {"closed_at": "", "closed_by": ""}
        }
    )
    
    return {"message": "Ticket reopened"}

# ======================== CHAT/MESSAGING ROUTES ========================

@api_router.get("/friends")
async def get_friends(current_user: dict = Depends(get_current_user)):
    friendships = await db.friendships.find(
        {"$or": [
            {"user_id": current_user["id"], "status": "accepted"},
            {"friend_id": current_user["id"], "status": "accepted"}
        ]},
        {"_id": 0}
    ).to_list(100)
    
    friends = []
    for f in friendships:
        friend_id = f["friend_id"] if f["user_id"] == current_user["id"] else f["user_id"]
        friend = await db.users.find_one(
            {"id": friend_id},
            {"_id": 0, "password": 0}
        )
        if friend:
            friends.append(friend)
    
    return {"friends": friends}

@api_router.post("/friends/request/{user_id}")
async def send_friend_request(user_id: str, current_user: dict = Depends(get_current_user)):
    if user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot send friend request to yourself")
    
    existing = await db.friendships.find_one({
        "$or": [
            {"user_id": current_user["id"], "friend_id": user_id},
            {"user_id": user_id, "friend_id": current_user["id"]}
        ]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Friend request already exists")
    
    friendship = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "friend_id": user_id,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.friendships.insert_one(friendship)
    
    return {"message": "Friend request sent"}

@api_router.post("/friends/accept/{friendship_id}")
async def accept_friend_request(friendship_id: str, current_user: dict = Depends(get_current_user)):
    friendship = await db.friendships.find_one(
        {"id": friendship_id, "friend_id": current_user["id"], "status": "pending"},
        {"_id": 0}
    )
    if not friendship:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    await db.friendships.update_one(
        {"id": friendship_id},
        {"$set": {"status": "accepted"}}
    )
    
    return {"message": "Friend request accepted"}

@api_router.get("/messages/{friend_id}")
async def get_messages(friend_id: str, current_user: dict = Depends(get_current_user)):
    messages = await db.messages.find(
        {"$or": [
            {"sender_id": current_user["id"], "recipient_id": friend_id},
            {"sender_id": friend_id, "recipient_id": current_user["id"]}
        ]},
        {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    
    return {"messages": messages}

@api_router.post("/messages")
async def send_message(data: MessageCreate, current_user: dict = Depends(get_current_user)):
    message = {
        "id": str(uuid.uuid4()),
        "sender_id": current_user["id"],
        "recipient_id": data.recipient_id,
        "content": data.content,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.messages.insert_one(message)
    
    return {"message": "Message sent", "message_id": message["id"]}

# ======================== NOTIFICATION ROUTES ========================

@api_router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    notifications = await db.notifications.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    unread_count = await db.notifications.count_documents(
        {"user_id": current_user["id"], "is_read": False}
    )
    
    return {"notifications": notifications, "unread_count": unread_count}

@api_router.post("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user["id"]},
        {"$set": {"is_read": True}}
    )
    return {"message": "Notification marked as read"}

@api_router.delete("/notifications/{notification_id}")
async def delete_notification(notification_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a notification"""
    result = await db.notifications.delete_one(
        {"id": notification_id, "user_id": current_user["id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification deleted"}

@api_router.post("/notifications/read-all")
async def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    await db.notifications.update_many(
        {"user_id": current_user["id"], "is_read": False},
        {"$set": {"is_read": True}}
    )
    return {"message": "All notifications marked as read"}

# ======================== FAQ ROUTES ========================

@api_router.get("/faqs")
async def get_faqs(search: Optional[str] = None):
    query = {"is_published": True}
    if search:
        query["$or"] = [
            {"question": {"$regex": search, "$options": "i"}},
            {"answer": {"$regex": search, "$options": "i"}}
        ]
    
    faqs = await db.faqs.find(query, {"_id": 0}).sort("order", 1).to_list(100)
    return {"faqs": faqs}

# ======================== CMS ROUTES ========================

@api_router.get("/cms/{section}")
async def get_cms_section(section: str):
    cms = await db.cms.find_one({"section": section}, {"_id": 0})
    if not cms:
        # Return defaults
        defaults = {
            "hero": {
                "title": "Master New Skills with LUMINA",
                "subtitle": "Join thousands of students learning from industry experts",
                "cta_text": "Get Started",
                "image_url": "https://images.unsplash.com/photo-1764258560295-21e74c3d0d15"
            },
            "testimonials": [],
            "theme": {
                "primary_color": "#8B5CF6",
                "accent_color": "#00F5FF",
                "logo_url": ""
            }
        }
        return {"section": section, "content": defaults.get(section, {})}
    return cms

@api_router.get("/cms")
async def get_all_cms():
    cms_sections = await db.cms.find({}, {"_id": 0}).to_list(100)
    # Handle both 'section' and 'slug' keys for backwards compatibility
    sections = {}
    for c in cms_sections:
        key = c.get("section") or c.get("slug", "unknown")
        sections[key] = c.get("content", {})
    return {"sections": sections}

# ======================== ADMIN ROUTES ========================

@api_router.get("/admin/dashboard")
async def admin_dashboard(current_user: dict = Depends(get_admin_user)):
    # Get stats
    total_users = await db.users.count_documents({"role": "student"})
    total_courses = await db.courses.count_documents({})
    total_enrollments = await db.enrollments.count_documents({})
    
    # Revenue
    completed_orders = await db.orders.find({"status": "completed"}, {"_id": 0}).to_list(10000)
    total_revenue = sum(o.get("total", 0) for o in completed_orders)
    
    # Pending withdrawals
    pending_withdrawals = await db.withdrawals.count_documents({"status": "pending"})
    pending_withdrawal_amount = 0
    pending_w = await db.withdrawals.find({"status": "pending"}, {"_id": 0}).to_list(1000)
    pending_withdrawal_amount = sum(w.get("amount", 0) for w in pending_w)
    
    # Recent orders
    recent_orders = await db.orders.find(
        {"status": "completed"},
        {"_id": 0}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    # Sales by date (last 30 days)
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    recent_sales = await db.orders.find(
        {"status": "completed", "created_at": {"$gte": thirty_days_ago}},
        {"_id": 0}
    ).to_list(10000)
    
    sales_by_date = {}
    for order in recent_sales:
        date = order["created_at"][:10]
        sales_by_date[date] = sales_by_date.get(date, 0) + order.get("total", 0)
    
    # Active users (logged in last 7 days)
    seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    active_users = await db.login_logs.distinct("user_id", {"timestamp": {"$gte": seven_days_ago}})
    
    # Total commissions
    all_commissions = await db.commissions.find({}, {"_id": 0}).to_list(10000)
    total_commissions = sum(c.get("commission", 0) for c in all_commissions)
    
    return {
        "total_users": total_users,
        "total_courses": total_courses,
        "total_enrollments": total_enrollments,
        "total_revenue": total_revenue,
        "pending_withdrawals": pending_withdrawals,
        "pending_withdrawal_amount": pending_withdrawal_amount,
        "active_users": len(active_users),
        "total_commissions": total_commissions,
        "recent_orders": recent_orders,
        "sales_by_date": sales_by_date
    }

@api_router.get("/admin/users")
async def admin_get_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_admin_user)
):
    query = {}
    if search:
        query["$or"] = [
            {"email": {"$regex": search, "$options": "i"}},
            {"first_name": {"$regex": search, "$options": "i"}},
            {"last_name": {"$regex": search, "$options": "i"}}
        ]
    if role:
        query["role"] = role
    
    total = await db.users.count_documents(query)
    users = await db.users.find(
        query,
        {"_id": 0, "password": 0}
    ).skip((page - 1) * limit).limit(limit).to_list(limit)
    
    return {
        "users": users,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@api_router.get("/admin/users/{user_id}")
async def admin_get_user(user_id: str, current_user: dict = Depends(get_admin_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get login history
    login_logs = await db.login_logs.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(20).to_list(20)
    
    # Get purchase history
    orders = await db.orders.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Get enrollments
    enrollments = await db.enrollments.find(
        {"user_id": user_id},
        {"_id": 0}
    ).to_list(100)
    
    return {
        "user": user,
        "login_logs": login_logs,
        "orders": orders,
        "enrollments": enrollments
    }

@api_router.put("/admin/users/{user_id}")
async def admin_update_user(
    user_id: str,
    is_banned: Optional[bool] = None,
    is_paused: Optional[bool] = None,
    wallet_balance: Optional[float] = None,
    role: Optional[str] = None,
    current_user: dict = Depends(get_admin_user)
):
    update_data = {}
    if is_banned is not None:
        update_data["is_banned"] = is_banned
    if is_paused is not None:
        update_data["is_paused"] = is_paused
    if wallet_balance is not None:
        update_data["wallet_balance"] = wallet_balance
    if role is not None:
        update_data["role"] = role
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    return {"message": "User updated"}

@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, current_user: dict = Depends(get_admin_user)):
    await db.users.delete_one({"id": user_id})
    return {"message": "User deleted"}

# Admin User Performance Analytics
@api_router.get("/admin/users/{user_id}/performance")
async def admin_get_user_performance(user_id: str, current_user: dict = Depends(get_admin_user)):
    """Get comprehensive user performance data"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get all orders for this user
    orders = await db.orders.find(
        {"user_id": user_id, "status": "completed"},
        {"_id": 0}
    ).to_list(1000)
    
    total_purchases = len(orders)
    total_spent = sum(o.get("total", 0) for o in orders)
    
    # Get all enrollments
    enrollments = await db.enrollments.find(
        {"user_id": user_id},
        {"_id": 0}
    ).to_list(1000)
    
    courses_enrolled = len(enrollments)
    
    # Get progress per course
    course_progress = []
    for enrollment in enrollments:
        course = await db.courses.find_one({"id": enrollment["course_id"]}, {"_id": 0})
        if course:
            # Get lessons for this course
            modules = await db.modules.find({"course_id": course["id"]}, {"_id": 0}).to_list(100)
            total_lessons = 0
            completed_lessons = 0
            for module in modules:
                lessons = await db.lessons.find({"module_id": module["id"]}, {"_id": 0}).to_list(100)
                total_lessons += len(lessons)
                for lesson in lessons:
                    progress = await db.lesson_progress.find_one({
                        "user_id": user_id,
                        "lesson_id": lesson["id"],
                        "is_completed": True
                    })
                    if progress:
                        completed_lessons += 1
            
            progress_percentage = (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0
            
            course_progress.append({
                "course_id": course["id"],
                "course_title": course["title"],
                "enrolled_at": enrollment.get("enrolled_at"),
                "total_lessons": total_lessons,
                "completed_lessons": completed_lessons,
                "progress_percentage": round(progress_percentage, 1)
            })
    
    # Get referral earnings generated by this user's referrals
    referral_earnings = await db.referral_earnings.find(
        {"referrer_id": user_id},
        {"_id": 0}
    ).to_list(1000)
    
    total_referral_earnings = sum(e.get("commission_amount", 0) for e in referral_earnings)
    
    # Get users referred by this user
    referred_users = await db.users.count_documents({"referred_by": user_id})
    
    return {
        "user": user,
        "performance": {
            "total_purchases": total_purchases,
            "total_spent": total_spent,
            "courses_enrolled": courses_enrolled,
            "course_progress": course_progress,
            "referral_stats": {
                "total_earnings": total_referral_earnings,
                "users_referred": referred_users,
                "earnings_history": referral_earnings
            },
            "wallet_balance": user.get("wallet_balance", 0)
        }
    }

# Admin Course Management
@api_router.get("/admin/courses")
async def admin_get_all_courses(current_user: dict = Depends(get_admin_user)):
    """Get all courses including unpublished for admin"""
    courses = await db.courses.find({}, {"_id": 0}).to_list(1000)
    return {"courses": courses}

@api_router.post("/admin/courses")
async def admin_create_course(data: CourseCreate, current_user: dict = Depends(get_admin_user)):
    course = {
        "id": str(uuid.uuid4()),
        "instructor_id": current_user["id"],
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.courses.insert_one(course)
    return {"message": "Course created", "course_id": course["id"]}

@api_router.put("/admin/courses/{course_id}")
async def admin_update_course(
    course_id: str,
    data: dict,
    current_user: dict = Depends(get_admin_user)
):
    """Update course - accepts partial updates"""
    # Filter out None values and prepare update
    update_data = {k: v for k, v in data.items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.courses.update_one({"id": course_id}, {"$set": update_data})
    return {"message": "Course updated"}

@api_router.delete("/admin/courses/{course_id}")
async def admin_delete_course(course_id: str, current_user: dict = Depends(get_admin_user)):
    await db.courses.delete_one({"id": course_id})
    await db.modules.delete_many({"course_id": course_id})
    return {"message": "Course deleted"}

@api_router.post("/admin/courses/{course_id}/modules")
async def admin_create_module(
    course_id: str,
    data: ModuleCreate,
    current_user: dict = Depends(get_admin_user)
):
    module = {
        "id": str(uuid.uuid4()),
        "course_id": course_id,
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.modules.insert_one(module)
    return {"message": "Module created", "module_id": module["id"]}

@api_router.post("/admin/modules/{module_id}/lessons")
async def admin_create_lesson(
    module_id: str,
    data: LessonCreate,
    current_user: dict = Depends(get_admin_user)
):
    lesson = {
        "id": str(uuid.uuid4()),
        "module_id": module_id,
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.lessons.insert_one(lesson)
    return {"message": "Lesson created", "lesson_id": lesson["id"]}

@api_router.post("/admin/modules/{module_id}/quiz")
async def admin_create_quiz(
    module_id: str,
    data: QuizCreate,
    current_user: dict = Depends(get_admin_user)
):
    quiz = {
        "id": str(uuid.uuid4()),
        "module_id": module_id,
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.quizzes.insert_one(quiz)
    return {"message": "Quiz created", "quiz_id": quiz["id"]}

@api_router.post("/admin/quizzes/{quiz_id}/questions")
async def admin_add_question(
    quiz_id: str,
    data: QuestionCreate,
    current_user: dict = Depends(get_admin_user)
):
    question = {
        "id": str(uuid.uuid4()),
        "quiz_id": quiz_id,
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.questions.insert_one(question)
    return {"message": "Question added", "question_id": question["id"]}

# ======================== ADMIN MODULE/LESSON UPDATE ROUTES ========================

@api_router.put("/admin/modules/{module_id}")
async def admin_update_module(
    module_id: str,
    data: ModuleUpdate,
    current_user: dict = Depends(get_admin_user)
):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_data:
        await db.modules.update_one({"id": module_id}, {"$set": update_data})
    return {"message": "Module updated"}

@api_router.delete("/admin/modules/{module_id}")
async def admin_delete_module(
    module_id: str,
    current_user: dict = Depends(get_admin_user)
):
    # Delete all lessons in module
    await db.lessons.delete_many({"module_id": module_id})
    # Delete all quizzes in module
    quiz = await db.quizzes.find_one({"module_id": module_id})
    if quiz:
        await db.questions.delete_many({"quiz_id": quiz["id"]})
        await db.quizzes.delete_one({"id": quiz["id"]})
    # Delete module
    await db.modules.delete_one({"id": module_id})
    return {"message": "Module deleted"}

@api_router.put("/admin/lessons/{lesson_id}")
async def admin_update_lesson(
    lesson_id: str,
    data: LessonUpdate,
    current_user: dict = Depends(get_admin_user)
):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_data:
        await db.lessons.update_one({"id": lesson_id}, {"$set": update_data})
    return {"message": "Lesson updated"}

@api_router.delete("/admin/lessons/{lesson_id}")
async def admin_delete_lesson(
    lesson_id: str,
    current_user: dict = Depends(get_admin_user)
):
    await db.lessons.delete_one({"id": lesson_id})
    return {"message": "Lesson deleted"}

@api_router.put("/admin/quizzes/{quiz_id}")
async def admin_update_quiz(
    quiz_id: str,
    data: QuizCreate,
    current_user: dict = Depends(get_admin_user)
):
    update_data = data.model_dump()
    await db.quizzes.update_one({"id": quiz_id}, {"$set": update_data})
    return {"message": "Quiz updated"}

@api_router.delete("/admin/quizzes/{quiz_id}")
async def admin_delete_quiz(
    quiz_id: str,
    current_user: dict = Depends(get_admin_user)
):
    await db.questions.delete_many({"quiz_id": quiz_id})
    await db.quizzes.delete_one({"id": quiz_id})
    return {"message": "Quiz deleted"}

@api_router.put("/admin/questions/{question_id}")
async def admin_update_question(
    question_id: str,
    data: QuestionCreate,
    current_user: dict = Depends(get_admin_user)
):
    update_data = data.model_dump()
    await db.questions.update_one({"id": question_id}, {"$set": update_data})
    return {"message": "Question updated"}

@api_router.delete("/admin/questions/{question_id}")
async def admin_delete_question(
    question_id: str,
    current_user: dict = Depends(get_admin_user)
):
    await db.questions.delete_one({"id": question_id})
    return {"message": "Question deleted"}

# ======================== ASSIGNMENT ROUTES ========================

@api_router.post("/admin/assignments")
async def admin_create_assignment(
    data: AssignmentCreate,
    current_user: dict = Depends(get_admin_user)
):
    assignment = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.assignments.insert_one(assignment)
    return {"message": "Assignment created", "assignment_id": assignment["id"]}

@api_router.get("/admin/assignments")
async def admin_get_assignments(current_user: dict = Depends(get_admin_user)):
    assignments = await db.assignments.find({}, {"_id": 0}).to_list(100)
    return {"assignments": assignments}

@api_router.get("/admin/assignments/{assignment_id}/submissions")
async def admin_get_submissions(
    assignment_id: str,
    current_user: dict = Depends(get_admin_user)
):
    submissions = await db.assignment_submissions.find(
        {"assignment_id": assignment_id},
        {"_id": 0}
    ).to_list(1000)
    
    for sub in submissions:
        user = await db.users.find_one({"id": sub["user_id"]}, {"_id": 0, "password": 0})
        sub["user"] = user
    
    return {"submissions": submissions}

@api_router.put("/admin/submissions/{submission_id}/grade")
async def admin_grade_submission(
    submission_id: str,
    score: int,
    feedback: str = "",
    current_user: dict = Depends(get_admin_user)
):
    await db.assignment_submissions.update_one(
        {"id": submission_id},
        {"$set": {
            "score": score,
            "feedback": feedback,
            "graded_by": current_user["id"],
            "graded_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "Submission graded"}

@api_router.get("/assignments/{course_id}")
async def get_course_assignments(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    assignments = await db.assignments.find(
        {"course_id": course_id},
        {"_id": 0}
    ).to_list(100)
    
    # Get user's submissions
    for assignment in assignments:
        submission = await db.assignment_submissions.find_one(
            {"assignment_id": assignment["id"], "user_id": current_user["id"]},
            {"_id": 0}
        )
        assignment["submission"] = submission
    
    return {"assignments": assignments}

@api_router.post("/assignments/{assignment_id}/submit")
async def submit_assignment(
    assignment_id: str,
    data: AssignmentSubmission,
    current_user: dict = Depends(get_current_user)
):
    # Check if already submitted
    existing = await db.assignment_submissions.find_one(
        {"assignment_id": assignment_id, "user_id": current_user["id"]}
    )
    
    submission = {
        "id": str(uuid.uuid4()),
        "assignment_id": assignment_id,
        "user_id": current_user["id"],
        "content": data.content,
        "file_key": data.file_key,
        "score": None,
        "feedback": None,
        "submitted_at": datetime.now(timezone.utc).isoformat()
    }
    
    if existing:
        await db.assignment_submissions.update_one(
            {"id": existing["id"]},
            {"$set": submission}
        )
        return {"message": "Submission updated", "submission_id": existing["id"]}
    else:
        await db.assignment_submissions.insert_one(submission)
        return {"message": "Assignment submitted", "submission_id": submission["id"]}

@api_router.post("/admin/upload/video")
async def admin_upload_video(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_admin_user)
):
    ext = file.filename.split(".")[-1] if "." in file.filename else "mp4"
    object_key = f"videos/{uuid.uuid4()}.{ext}"
    
    data = await file.read()
    
    # Try R2 first
    if r2_client:
        success = upload_to_r2(data, object_key, file.content_type or "video/mp4")
        if success:
            return {"video_key": object_key, "size": len(data), "storage": "r2"}
    
    # Fallback to emergent storage
    path = f"{APP_NAME}/{object_key}"
    result = put_object(path, data, file.content_type or "video/mp4")
    return {"video_key": result["path"], "size": result["size"], "storage": "emergent"}

@api_router.post("/admin/upload/image")
async def admin_upload_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_admin_user)
):
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    object_key = f"images/{uuid.uuid4()}.{ext}"
    
    data = await file.read()
    
    # Try R2 first
    if r2_client:
        success = upload_to_r2(data, object_key, file.content_type or "image/jpeg")
        if success:
            # For images, we might want to return a signed URL immediately
            signed_url = get_r2_signed_url(object_key, expiry_seconds=86400)  # 24 hours
            return {"image_key": object_key, "image_url": signed_url, "size": len(data), "storage": "r2"}
    
    # Fallback to emergent storage
    path = f"{APP_NAME}/{object_key}"
    result = put_object(path, data, file.content_type or "image/jpeg")
    return {"image_key": result["path"], "size": result["size"], "storage": "emergent"}

# Admin Coupon Management
@api_router.get("/admin/coupons")
async def admin_get_coupons(current_user: dict = Depends(get_admin_user)):
    coupons = await db.coupons.find({}, {"_id": 0}).to_list(100)
    return {"coupons": coupons}

@api_router.post("/admin/coupons")
async def admin_create_coupon(data: CouponCreate, current_user: dict = Depends(get_admin_user)):
    coupon = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    if coupon.get("valid_until"):
        coupon["valid_until"] = coupon["valid_until"].isoformat()
    
    await db.coupons.insert_one(coupon)
    return {"message": "Coupon created", "coupon_id": coupon["id"]}

@api_router.delete("/admin/coupons/{coupon_id}")
async def admin_delete_coupon(coupon_id: str, current_user: dict = Depends(get_admin_user)):
    await db.coupons.update_one({"id": coupon_id}, {"$set": {"is_active": False}})
    return {"message": "Coupon deactivated"}

# Admin Withdrawal Management
@api_router.get("/admin/withdrawals")
async def admin_get_withdrawals(
    status: Optional[str] = None,
    current_user: dict = Depends(get_admin_user)
):
    query = {}
    if status:
        query["status"] = status
    
    withdrawals = await db.withdrawals.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for w in withdrawals:
        user = await db.users.find_one({"id": w["user_id"]}, {"_id": 0, "password": 0})
        w["user"] = user
    
    return {"withdrawals": withdrawals}

@api_router.put("/admin/withdrawals/{withdrawal_id}")
async def admin_update_withdrawal(
    withdrawal_id: str,
    status: str,
    current_user: dict = Depends(get_admin_user)
):
    withdrawal = await db.withdrawals.find_one({"id": withdrawal_id}, {"_id": 0})
    if not withdrawal:
        raise HTTPException(status_code=404, detail="Withdrawal not found")
    
    user = await db.users.find_one({"id": withdrawal["user_id"]}, {"_id": 0})
    
    await db.withdrawals.update_one(
        {"id": withdrawal_id},
        {"$set": {
            "status": status,
            "processed_by": current_user["id"],
            "processed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if status == "approved":
        # Wallet already deducted when request was made, just clear pending
        await db.users.update_one(
            {"id": withdrawal["user_id"]},
            {"$inc": {"pending_earnings": -withdrawal["amount"]}}
        )
    elif status == "rejected":
        # Return amount to wallet
        await db.users.update_one(
            {"id": withdrawal["user_id"]},
            {
                "$inc": {
                    "wallet_balance": withdrawal["amount"],
                    "pending_earnings": -withdrawal["amount"]
                }
            }
        )
    
    # Send email notification to user
    if user:
        send_withdrawal_notification_email(
            user["email"],
            user.get("first_name", "User"),
            withdrawal["amount"],
            status
        )
    
    return {"message": f"Withdrawal {status}"}

# Admin CMS Management - Full Dynamic CMS System
@api_router.get("/admin/cms")
async def admin_get_all_cms(current_user: dict = Depends(get_admin_user)):
    """Get all CMS sections for admin"""
    cms_sections = await db.cms.find({}, {"_id": 0}).to_list(100)
    return {"sections": cms_sections}

@api_router.get("/admin/cms/{slug}")
async def admin_get_cms_section(slug: str, current_user: dict = Depends(get_admin_user)):
    """Get specific CMS section by slug"""
    cms = await db.cms.find_one({"slug": slug}, {"_id": 0})
    if not cms:
        return {"slug": slug, "content": {}, "seo": {}}
    return cms

@api_router.put("/admin/cms/{slug}")
async def admin_update_cms_section(
    slug: str,
    data: dict,
    current_user: dict = Depends(get_admin_user)
):
    """Update CMS section by slug"""
    await db.cms.update_one(
        {"slug": slug},
        {"$set": {
            "slug": slug,
            "title": data.get("title", slug.title()),
            "content": data.get("content", {}),
            "seo": data.get("seo", {}),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    return {"message": f"CMS section '{slug}' updated"}

@api_router.post("/admin/cms")
async def admin_create_cms_section(
    data: dict,
    current_user: dict = Depends(get_admin_user)
):
    """Create new CMS section"""
    slug = data.get("slug")
    if not slug:
        raise HTTPException(status_code=400, detail="Slug is required")
    
    existing = await db.cms.find_one({"slug": slug})
    if existing:
        raise HTTPException(status_code=400, detail="Section already exists")
    
    cms = {
        "id": str(uuid.uuid4()),
        "slug": slug,
        "title": data.get("title", slug.title()),
        "content": data.get("content", {}),
        "seo": data.get("seo", {}),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.cms.insert_one(cms)
    return {"message": "CMS section created", "slug": slug}

@api_router.delete("/admin/cms/{slug}")
async def admin_delete_cms_section(slug: str, current_user: dict = Depends(get_admin_user)):
    """Delete CMS section"""
    await db.cms.delete_one({"slug": slug})
    return {"message": f"CMS section '{slug}' deleted"}

# Public CMS routes  
@api_router.get("/public/cms/{slug}")
async def get_public_cms_section(slug: str):
    """Get CMS section by slug for public consumption"""
    logger.info(f"Fetching CMS for slug: {slug}")
    cms = await db.cms.find_one({"slug": slug}, {"_id": 0})
    logger.info(f"CMS result: {cms is not None}, has content: {'content' in cms if cms else False}")
    if not cms:
        # Return sensible defaults
        defaults = {
            "home": {
                "hero": {
                    "title": "Master New Skills with LUMINA",
                    "subtitle": "Join thousands of students learning from industry experts",
                    "cta_text": "Get Started",
                    "cta_link": "/courses"
                },
                "features": [],
                "testimonials": []
            },
            "about": {
                "title": "About LUMINA",
                "description": "We are an online learning platform dedicated to helping you grow.",
                "mission": "Empowering learners worldwide",
                "team": []
            },
            "contact": {
                "title": "Contact Us",
                "email": "support@lumina.com",
                "phone": "",
                "address": ""
            },
            "footer": {
                "copyright": "© 2024 LUMINA. All rights reserved.",
                "links": [],
                "social": {}
            },
            "navbar": {
                "logo_text": "LUMINA",
                "logo_url": "",
                "links": [
                    {"label": "Home", "href": "/"},
                    {"label": "Courses", "href": "/courses"},
                    {"label": "About", "href": "/about"},
                    {"label": "Contact", "href": "/contact"}
                ]
            }
        }
        return {"slug": slug, "content": defaults.get(slug, {}), "seo": {}}
    return cms

@api_router.get("/public/cms")
async def get_all_public_cms():
    """Get all CMS sections"""
    cms_sections = await db.cms.find({}, {"_id": 0}).to_list(100)
    result = {}
    for section in cms_sections:
        slug = section.get("slug")
        if slug:  # Only include sections with valid slug
            result[slug] = section.get("content", {})
    return {"cms": result}

@api_router.put("/admin/cms")
async def admin_update_cms_legacy(data: CMSUpdate, current_user: dict = Depends(get_admin_user)):
    """Legacy update endpoint for backward compatibility"""
    await db.cms.update_one(
        {"slug": data.section},
        {"$set": {
            "slug": data.section,
            "content": data.content,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    return {"message": "CMS updated"}

# Admin FAQ Management
@api_router.post("/admin/faqs")
async def admin_create_faq(
    question: str,
    answer: str,
    order: int = 0,
    current_user: dict = Depends(get_admin_user)
):
    faq = {
        "id": str(uuid.uuid4()),
        "question": question,
        "answer": answer,
        "order": order,
        "is_published": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.faqs.insert_one(faq)
    return {"message": "FAQ created", "faq_id": faq["id"]}

@api_router.put("/admin/faqs/{faq_id}")
async def admin_update_faq(
    faq_id: str,
    question: Optional[str] = None,
    answer: Optional[str] = None,
    order: Optional[int] = None,
    is_published: Optional[bool] = None,
    current_user: dict = Depends(get_admin_user)
):
    update_data = {}
    if question:
        update_data["question"] = question
    if answer:
        update_data["answer"] = answer
    if order is not None:
        update_data["order"] = order
    if is_published is not None:
        update_data["is_published"] = is_published
    
    if update_data:
        await db.faqs.update_one({"id": faq_id}, {"$set": update_data})
    
    return {"message": "FAQ updated"}

@api_router.delete("/admin/faqs/{faq_id}")
async def admin_delete_faq(faq_id: str, current_user: dict = Depends(get_admin_user)):
    await db.faqs.delete_one({"id": faq_id})
    return {"message": "FAQ deleted"}

# Admin Ticket Management
@api_router.put("/admin/tickets/{ticket_id}/status")
async def admin_update_ticket_status(
    ticket_id: str,
    status: str,
    current_user: dict = Depends(get_admin_user)
):
    await db.tickets.update_one(
        {"id": ticket_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Ticket status updated"}

# ======================== LEADERBOARD ROUTES ========================

@api_router.get("/leaderboard")
async def get_leaderboard():
    users = await db.users.find(
        {"role": "student"},
        {"_id": 0, "password": 0}
    ).sort("points", -1).limit(50).to_list(50)
    
    return {"leaderboard": users}

# ======================== REVIEWS ROUTES ========================

@api_router.post("/courses/{course_id}/reviews")
async def create_review(
    course_id: str,
    rating: int,
    comment: str,
    current_user: dict = Depends(get_current_user)
):
    # Check enrollment
    enrollment = await db.enrollments.find_one(
        {"course_id": course_id, "user_id": current_user["id"]}
    )
    if not enrollment:
        raise HTTPException(status_code=403, detail="Must be enrolled to review")
    
    # Check existing review
    existing = await db.reviews.find_one(
        {"course_id": course_id, "user_id": current_user["id"]}
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already reviewed this course")
    
    review = {
        "id": str(uuid.uuid4()),
        "course_id": course_id,
        "user_id": current_user["id"],
        "rating": min(5, max(1, rating)),
        "comment": comment,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reviews.insert_one(review)
    
    return {"message": "Review created", "review_id": review["id"]}

# ======================== ENROLLED COURSES ROUTES ========================

# ======================== CERTIFICATE SYSTEM ========================

@api_router.get("/certificates")
async def get_user_certificates(current_user: dict = Depends(get_current_user)):
    """Get all certificates for the current user"""
    certificates = await db.certificates.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return {"certificates": certificates}

@api_router.get("/certificates/{course_id}")
async def get_certificate(course_id: str, current_user: dict = Depends(get_current_user)):
    """Get certificate for a specific course"""
    certificate = await db.certificates.find_one(
        {"user_id": current_user["id"], "course_id": course_id},
        {"_id": 0}
    )
    return {"certificate": certificate}

@api_router.post("/certificates/{course_id}/request")
async def request_certificate(
    course_id: str,
    name_on_certificate: str,
    current_user: dict = Depends(get_current_user)
):
    """Request certificate after completing course"""
    # Check enrollment and completion
    enrollment = await db.enrollments.find_one(
        {"user_id": current_user["id"], "course_id": course_id},
        {"_id": 0}
    )
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    if not enrollment.get("is_completed"):
        raise HTTPException(status_code=400, detail="Course not completed. Complete all lessons first.")
    
    # Check if certificate already exists
    existing = await db.certificates.find_one(
        {"user_id": current_user["id"], "course_id": course_id}
    )
    if existing:
        raise HTTPException(status_code=400, detail="Certificate already generated")
    
    # Get course details
    course = await db.courses.find_one({"id": course_id}, {"_id": 0})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Generate unique certificate ID
    cert_id = f"LUMINA-{course_id[:8].upper()}-{current_user['id'][:8].upper()}-{datetime.now().strftime('%Y%m%d')}"
    
    certificate = {
        "id": str(uuid.uuid4()),
        "certificate_id": cert_id,
        "user_id": current_user["id"],
        "course_id": course_id,
        "course_title": course["title"],
        "name_on_certificate": name_on_certificate,
        "name_locked": True,  # Name can only be set once
        "issue_date": datetime.now(timezone.utc).isoformat(),
        "completion_date": enrollment.get("completed_at", datetime.now(timezone.utc).isoformat()),
        "print_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.certificates.insert_one(certificate)
    
    # Send certificate email notification
    frontend_url = os.environ.get("FRONTEND_URL", "https://skill-exchange-110.preview.emergentagent.com")
    verification_url = f"{frontend_url}/verify/{cert_id}"
    
    try:
        send_certificate_email(
            to_email=current_user["email"],
            user_name=name_on_certificate,
            course_title=course["title"],
            certificate_id=cert_id,
            verification_url=verification_url
        )
    except Exception as e:
        logger.error(f"Failed to send certificate email: {e}")
    
    # Return without _id
    certificate.pop("_id", None)
    return {"message": "Certificate generated", "certificate": certificate}

@api_router.post("/certificates/{certificate_id}/print")
async def track_certificate_print(certificate_id: str, current_user: dict = Depends(get_current_user)):
    """Track certificate print"""
    result = await db.certificates.update_one(
        {"certificate_id": certificate_id, "user_id": current_user["id"]},
        {"$inc": {"print_count": 1}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return {"message": "Print tracked"}

# Public certificate verification
@api_router.get("/public/certificates/verify/{certificate_id}")
async def verify_certificate(certificate_id: str):
    """Public endpoint to verify a certificate"""
    certificate = await db.certificates.find_one(
        {"certificate_id": certificate_id},
        {"_id": 0, "user_id": 0}  # Don't expose user_id
    )
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return {"certificate": certificate, "verified": True}

# Admin certificate routes
@api_router.get("/admin/certificates")
async def admin_get_all_certificates(current_user: dict = Depends(get_admin_user)):
    """Get all certificates"""
    certificates = await db.certificates.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for cert in certificates:
        user = await db.users.find_one({"id": cert["user_id"]}, {"_id": 0, "password": 0})
        cert["user"] = user
    
    return {"certificates": certificates}

@api_router.get("/admin/certificate-templates")
async def admin_get_certificate_templates(current_user: dict = Depends(get_admin_user)):
    """Get all certificate templates"""
    templates = await db.certificate_templates.find({}, {"_id": 0}).to_list(100)
    return {"templates": templates}

@api_router.post("/admin/certificate-templates")
async def admin_create_certificate_template(
    data: dict,
    current_user: dict = Depends(get_admin_user)
):
    """Create certificate template"""
    template = {
        "id": str(uuid.uuid4()),
        "name": data.get("name"),
        "course_id": data.get("course_id"),
        "template_image_key": data.get("template_image_key"),
        "settings": {
            "name_position": data.get("name_position", {"x": 50, "y": 50}),
            "cert_id_position": data.get("cert_id_position", {"x": 50, "y": 80}),
            "font_family": data.get("font_family", "Arial"),
            "font_size": data.get("font_size", 24),
            "font_color": data.get("font_color", "#000000")
        },
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.certificate_templates.insert_one(template)
    return {"message": "Template created", "template_id": template["id"]}

@api_router.put("/admin/certificates/{certificate_id}/unlock-name")
async def admin_unlock_certificate_name(certificate_id: str, current_user: dict = Depends(get_admin_user)):
    """Unlock certificate name for correction (admin only)"""
    await db.certificates.update_one(
        {"certificate_id": certificate_id},
        {"$set": {"name_locked": False}}
    )
    return {"message": "Certificate name unlocked for editing"}

# Admin notifications management
@api_router.get("/admin/notifications")
async def admin_get_all_notifications(current_user: dict = Depends(get_admin_user)):
    """Get all sent notifications for admin"""
    notifications = await db.admin_notifications.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"notifications": notifications}

@api_router.post("/admin/notifications/send")
async def admin_send_notification(data: dict, current_user: dict = Depends(get_admin_user)):
    """Send notification to users with optional email"""
    title = data.get("title", "")
    message = data.get("message", "")
    notif_type = data.get("type", "announcement")
    send_email = data.get("send_email", False)
    user_ids = data.get("user_ids")  # None means all users
    
    if not title or not message:
        raise HTTPException(status_code=400, detail="Title and message are required")
    
    # Get target users
    if user_ids:
        users = await db.users.find({"id": {"$in": user_ids}}, {"_id": 0, "id": 1, "email": 1, "first_name": 1}).to_list(1000)
    else:
        users = await db.users.find({}, {"_id": 0, "id": 1, "email": 1, "first_name": 1}).to_list(10000)
    
    # Create notification record
    admin_notif = {
        "id": str(uuid.uuid4()),
        "title": title,
        "message": message,
        "type": notif_type,
        "recipient_count": len(users),
        "email_sent": send_email,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": current_user["id"]
    }
    await db.admin_notifications.insert_one(admin_notif)
    
    # Create individual notifications for each user
    for user in users:
        notif = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "title": title,
            "message": message,
            "type": notif_type,
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notif)
        
        # Send email if requested
        if send_email:
            try:
                html_content = f"""
                <html>
                <head>
                    <style>
                        body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #0F172A; color: #F8FAFC; margin: 0; padding: 20px; }}
                        .container {{ max-width: 600px; margin: 0 auto; background: #1E293B; border-radius: 16px; padding: 30px; }}
                        .header {{ text-align: center; margin-bottom: 20px; }}
                        .logo {{ font-size: 24px; font-weight: bold; color: #8B5CF6; }}
                        h1 {{ color: #F8FAFC; font-size: 22px; margin-top: 20px; }}
                        .message {{ color: #94A3B8; line-height: 1.6; }}
                        .footer {{ text-align: center; margin-top: 30px; color: #64748B; font-size: 12px; }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="logo">Chand Web Technology</div>
                        </div>
                        <h1>{title}</h1>
                        <div class="message">{message}</div>
                        <div class="footer">
                            <p>This notification was sent from Chand Web Technology</p>
                        </div>
                    </div>
                </body>
                </html>
                """
                send_email_func(user["email"], title, html_content)
            except Exception as e:
                logger.error(f"Failed to send email to {user['email']}: {e}")
    
    return {"message": f"Notification sent to {len(users)} users"}

@api_router.delete("/admin/notifications/{notif_id}")
async def admin_delete_notification(notif_id: str, current_user: dict = Depends(get_admin_user)):
    """Delete admin notification record"""
    await db.admin_notifications.delete_one({"id": notif_id})
    return {"message": "Notification deleted"}

# Admin certificates management
@api_router.get("/admin/certificates")
async def admin_get_all_certificates(current_user: dict = Depends(get_admin_user)):
    """Get all certificates for admin"""
    certificates = await db.certificates.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return {"certificates": certificates}

@api_router.get("/admin/certificates/search")
async def admin_search_certificate(certificate_id: str, current_user: dict = Depends(get_admin_user)):
    """Search certificate by ID"""
    cert = await db.certificates.find_one({"certificate_id": certificate_id}, {"_id": 0})
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return {"certificate": cert}

@api_router.put("/admin/certificates/{certificate_id}")
async def admin_update_certificate(certificate_id: str, data: dict, current_user: dict = Depends(get_admin_user)):
    """Update certificate details and layout (admin only)"""
    update_data = {}
    
    # Basic certificate info
    if "name_on_certificate" in data:
        update_data["name_on_certificate"] = data["name_on_certificate"]
    if "course_title" in data:
        update_data["course_title"] = data["course_title"]
    if "issue_date" in data:
        update_data["issue_date"] = data["issue_date"]
    
    # Layout settings - positions
    layout_fields = [
        "name_position", "course_position", "date_position", "cert_id_position",
        "logo_position", "qr_position", "signature_position",
        "logo_size", "qr_size"
    ]
    for field in layout_fields:
        if field in data:
            update_data[f"layout.{field}"] = data[field]
    
    # Layout settings - fonts and colors
    font_fields = [
        "name_font_family", "name_font_size", "name_font_color",
        "course_font_family", "course_font_size", "course_font_color",
        "date_font_size", "date_font_color",
        "cert_id_font_size", "cert_id_font_color"
    ]
    for field in font_fields:
        if field in data:
            update_data[f"layout.{field}"] = data[field]
    
    # Layout settings - visibility toggles
    visibility_fields = ["show_logo", "show_qr", "show_date", "show_cert_id", "show_signature", "show_course"]
    for field in visibility_fields:
        if field in data:
            update_data[f"layout.{field}"] = data[field]
    
    # Signature settings
    if "signature_name" in data:
        update_data["layout.signature_name"] = data["signature_name"]
    if "signature_title" in data:
        update_data["layout.signature_title"] = data["signature_title"]
    
    # Background image
    if "background_image" in data:
        update_data["layout.background_image"] = data["background_image"]
    
    # Logo image
    if "logo_image" in data:
        update_data["layout.logo_image"] = data["logo_image"]
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_data["updated_by"] = current_user["id"]
    
    result = await db.certificates.update_one(
        {"certificate_id": certificate_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    return {"message": "Certificate updated"}

@api_router.post("/admin/certificates/{certificate_id}/unlock")
async def admin_unlock_cert(certificate_id: str, current_user: dict = Depends(get_admin_user)):
    """Unlock certificate for user editing (name, etc.)"""
    result = await db.certificates.update_one(
        {"certificate_id": certificate_id},
        {"$set": {"is_locked": False, "name_locked": False}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return {"message": "Certificate unlocked - user can now edit their name"}

@api_router.post("/admin/certificates/{certificate_id}/lock")
async def admin_lock_cert(certificate_id: str, current_user: dict = Depends(get_admin_user)):
    """Lock certificate to prevent user editing"""
    result = await db.certificates.update_one(
        {"certificate_id": certificate_id},
        {"$set": {"is_locked": True, "name_locked": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return {"message": "Certificate locked - user cannot edit"}

# Global Certificate Design Endpoints
@api_router.get("/admin/certificate-design")
async def get_global_certificate_design(current_user: dict = Depends(get_admin_user)):
    """Get the global certificate design settings"""
    design = await db.certificate_design.find_one({"type": "global"}, {"_id": 0})
    return {"design": design}

@api_router.put("/admin/certificate-design")
async def update_global_certificate_design(data: dict, current_user: dict = Depends(get_admin_user)):
    """Update the global certificate design settings - applies to all certificates"""
    data["type"] = "global"
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    data["updated_by"] = current_user["id"]
    
    await db.certificate_design.update_one(
        {"type": "global"},
        {"$set": data},
        upsert=True
    )
    return {"message": "Global certificate design saved"}

@api_router.put("/certificates/{certificate_id}/update-name")
async def update_certificate_name(
    certificate_id: str,
    new_name: str,
    current_user: dict = Depends(get_current_user)
):
    """Update certificate name (only if unlocked)"""
    cert = await db.certificates.find_one(
        {"certificate_id": certificate_id, "user_id": current_user["id"]},
        {"_id": 0}
    )
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    if cert.get("name_locked", True):
        raise HTTPException(status_code=403, detail="Certificate name is locked. Contact admin to unlock.")
    
    await db.certificates.update_one(
        {"certificate_id": certificate_id},
        {"$set": {
            "name_on_certificate": new_name,
            "name_locked": True  # Lock again after update
        }}
    )
    return {"message": "Certificate name updated"}

# Certificate Template routes
@api_router.get("/admin/certificate-templates")
async def get_certificate_templates(current_user: dict = Depends(get_admin_user)):
    """Get all certificate templates"""
    templates = await db.certificate_templates.find({}, {"_id": 0}).to_list(100)
    return {"templates": templates}

@api_router.post("/admin/certificate-templates")
async def create_certificate_template(template: dict, current_user: dict = Depends(get_admin_user)):
    """Create a new certificate template"""
    template_data = {
        "id": str(uuid.uuid4()),
        "name": template.get("name", ""),
        "background_image": template.get("background_image", ""),
        "name_position": template.get("name_position", {"x": 500, "y": 350}),
        "cert_id_position": template.get("cert_id_position", {"x": 500, "y": 650}),
        "date_position": template.get("date_position", {"x": 500, "y": 600}),
        "font_family": template.get("font_family", "Great Vibes"),
        "font_size": template.get("font_size", 48),
        "font_color": template.get("font_color", "#8B5CF6"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.certificate_templates.insert_one(template_data)
    return {"message": "Template created", "template": {k: v for k, v in template_data.items() if k != "_id"}}

@api_router.put("/admin/certificate-templates/{template_id}")
async def update_certificate_template(
    template_id: str, 
    template: dict, 
    current_user: dict = Depends(get_admin_user)
):
    """Update certificate template"""
    update_data = {
        "name": template.get("name"),
        "background_image": template.get("background_image"),
        "name_position": template.get("name_position"),
        "cert_id_position": template.get("cert_id_position"),
        "date_position": template.get("date_position"),
        "font_family": template.get("font_family"),
        "font_size": template.get("font_size"),
        "font_color": template.get("font_color"),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.certificate_templates.update_one(
        {"id": template_id},
        {"$set": update_data}
    )
    return {"message": "Template updated"}

@api_router.delete("/admin/certificate-templates/{template_id}")
async def delete_certificate_template(template_id: str, current_user: dict = Depends(get_admin_user)):
    """Delete certificate template"""
    await db.certificate_templates.delete_one({"id": template_id})
    # Remove template assignment from courses
    await db.courses.update_many(
        {"certificate_template_id": template_id},
        {"$unset": {"certificate_template_id": ""}}
    )
    return {"message": "Template deleted"}

@api_router.post("/admin/certificate-templates/{template_id}/assign")
async def assign_template_to_course(
    template_id: str,
    course_id: str,
    current_user: dict = Depends(get_admin_user)
):
    """Assign certificate template to a course"""
    # Verify template exists
    template = await db.certificate_templates.find_one({"id": template_id})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Assign to course
    await db.courses.update_one(
        {"id": course_id},
        {"$set": {"certificate_template_id": template_id}}
    )
    return {"message": "Template assigned to course"}

@app.on_event("startup")
async def startup():
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.warning(f"Storage init failed: {e}")
    
    # Create admin user if not exists
    admin = await db.users.find_one({"email": "admin@lumina.com"})
    if not admin:
        admin_user = {
            "id": str(uuid.uuid4()),
            "email": "admin@lumina.com",
            "password": hash_password("admin123"),
            "first_name": "Admin",
            "last_name": "User",
            "role": "admin",
            "is_verified": True,
            "is_banned": False,
            "is_paused": False,
            "referral_code": generate_referral_code(),
            "wallet_balance": 0.0,
            "total_earnings": 0.0,
            "points": 0,
            "badges": [],
            "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_user)
        logger.info("Admin user created: admin@lumina.com / admin123")
    
    # Seed sample courses if none exist
    course_count = await db.courses.count_documents({})
    if course_count == 0:
        sample_courses = [
            {
                "id": str(uuid.uuid4()),
                "title": "Complete Web Development Bootcamp",
                "description": "Learn HTML, CSS, JavaScript, React, Node.js and more in this comprehensive bootcamp. Build real-world projects and become a full-stack developer.",
                "short_description": "Master web development from scratch",
                "price": 99.99,
                "discount_price": 49.99,
                "category": "Development",
                "level": "beginner",
                "thumbnail_url": "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800",
                "is_published": True,
                "instructor_id": admin["id"] if admin else "",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "UI/UX Design Masterclass",
                "description": "Learn the principles of user interface and user experience design. Create stunning designs using Figma and transform your design skills.",
                "short_description": "Become a professional UI/UX designer",
                "price": 79.99,
                "discount_price": 39.99,
                "category": "Design",
                "level": "intermediate",
                "thumbnail_url": "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800",
                "is_published": True,
                "instructor_id": admin["id"] if admin else "",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Digital Marketing Complete Course",
                "description": "Master digital marketing strategies including SEO, social media marketing, email marketing, and paid advertising campaigns.",
                "short_description": "Learn modern digital marketing",
                "price": 89.99,
                "discount_price": 44.99,
                "category": "Marketing",
                "level": "beginner",
                "thumbnail_url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
                "is_published": True,
                "instructor_id": admin["id"] if admin else "",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Python for Data Science",
                "description": "Learn Python programming for data analysis, machine learning, and artificial intelligence. Hands-on projects with real datasets.",
                "short_description": "Master data science with Python",
                "price": 119.99,
                "discount_price": 59.99,
                "category": "Data Science",
                "level": "intermediate",
                "thumbnail_url": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800",
                "is_published": True,
                "instructor_id": admin["id"] if admin else "",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.courses.insert_many(sample_courses)
        logger.info(f"Seeded {len(sample_courses)} sample courses")
    
    # Seed sample FAQs if none exist
    faq_count = await db.faqs.count_documents({})
    if faq_count == 0:
        sample_faqs = [
            {
                "id": str(uuid.uuid4()),
                "question": "How do I access my purchased courses?",
                "answer": "After purchasing a course, you can access it from your dashboard. Simply log in and click on 'My Courses' to see all your enrolled courses.",
                "order": 1,
                "is_published": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "question": "What payment methods do you accept?",
                "answer": "We accept various payment methods through PayU including credit cards, debit cards, net banking, UPI, and popular e-wallets.",
                "order": 2,
                "is_published": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "question": "How does the referral program work?",
                "answer": "Share your unique referral code with friends. When they make a purchase using your code, you earn 20% commission on their purchase amount. Commissions become available for withdrawal after 30 days.",
                "order": 3,
                "is_published": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "question": "Can I get a refund?",
                "answer": "Yes, we offer refunds within 30 days of purchase if you're not satisfied with the course. Contact our support team to initiate a refund request.",
                "order": 4,
                "is_published": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.faqs.insert_many(sample_faqs)
        logger.info(f"Seeded {len(sample_faqs)} sample FAQs")
    
    # Seed CMS pages if not exist
    cms_count = await db.cms.count_documents({})
    if cms_count == 0:
        cms_pages = [
            {
                "slug": "privacy-policy",
                "title": "Privacy Policy",
                "content": {
                    "title": "Privacy Policy",
                    "description": "Your privacy is important to us. This policy explains how LUMINA collects, uses, and protects your personal information.",
                    "sections": [
                        {"title": "Information We Collect", "content": "We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support. This may include your name, email address, payment information, and any other information you choose to provide."},
                        {"title": "How We Use Your Information", "content": "We use the information we collect to provide, maintain, and improve our services, process transactions, send communications, and personalize your experience."},
                        {"title": "Information Sharing", "content": "We do not sell your personal information. We may share your information with service providers who assist us in operating our platform, processing payments, or analyzing how our service is used."},
                        {"title": "Data Security", "content": "We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure."},
                        {"title": "Your Rights", "content": "You have the right to access, update, or delete your personal information. You can do this through your account settings or by contacting us."},
                        {"title": "Contact Us", "content": "If you have any questions about this Privacy Policy, please contact us at support@lumina.com."}
                    ]
                },
                "seo": {"metaTitle": "Privacy Policy - LUMINA", "metaDescription": "LUMINA privacy policy explains how we collect and protect your data."},
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "slug": "terms-of-service",
                "title": "Terms of Service",
                "content": {
                    "title": "Terms of Service",
                    "description": "Welcome to LUMINA. By using our platform, you agree to these terms and conditions.",
                    "sections": [
                        {"title": "Account Registration", "content": "To access certain features, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account."},
                        {"title": "Course Purchases", "content": "When you purchase a course, you receive a license to access the course content for personal, non-commercial use. Course content may not be shared, distributed, or resold."},
                        {"title": "Refund Policy", "content": "We offer a 30-day refund policy for course purchases. Refund requests must be submitted through our support system."},
                        {"title": "User Conduct", "content": "You agree not to use our platform for any unlawful purpose or in any way that could damage, disable, or impair our services."},
                        {"title": "Intellectual Property", "content": "All content on LUMINA, including courses, videos, and materials, is owned by LUMINA or our instructors and is protected by copyright laws."},
                        {"title": "Limitation of Liability", "content": "LUMINA shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our platform."},
                        {"title": "Changes to Terms", "content": "We may modify these terms at any time. Continued use of our platform after changes constitutes acceptance of the new terms."}
                    ]
                },
                "seo": {"metaTitle": "Terms of Service - LUMINA", "metaDescription": "LUMINA terms of service and conditions for using our platform."},
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "slug": "refund-policy",
                "title": "Refund Policy",
                "content": {
                    "title": "Refund Policy",
                    "description": "We want you to be completely satisfied with your purchase. Here's our refund policy.",
                    "sections": [
                        {"title": "30-Day Money Back Guarantee", "content": "If you're not satisfied with a course, you can request a full refund within 30 days of purchase."},
                        {"title": "How to Request a Refund", "content": "To request a refund, go to your Orders page and click 'Request Refund' or contact our support team via the Support section."},
                        {"title": "Refund Processing", "content": "Refunds are processed within 5-7 business days after approval. The amount will be credited to your original payment method."},
                        {"title": "Non-Refundable Items", "content": "Certificate fees and completed courses with more than 50% progress may not be eligible for refunds."}
                    ]
                },
                "seo": {"metaTitle": "Refund Policy - LUMINA", "metaDescription": "LUMINA refund policy and money back guarantee information."},
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "slug": "about",
                "title": "About Us",
                "content": {
                    "title": "About LUMINA",
                    "description": "LUMINA is an innovative online learning platform dedicated to providing high-quality education accessible to everyone, everywhere.",
                    "mission": "Our mission is to democratize education by providing world-class learning experiences at affordable prices. We believe that quality education should be accessible to everyone, regardless of their location or background.",
                    "vision": "We envision a world where anyone can transform their life through learning. By 2030, we aim to have helped 10 million students achieve their career goals through our platform."
                },
                "seo": {"metaTitle": "About Us - LUMINA", "metaDescription": "Learn about LUMINA's mission to provide accessible, high-quality online education."},
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "slug": "contact",
                "title": "Contact Us",
                "content": {
                    "title": "Contact Us",
                    "description": "We'd love to hear from you! Get in touch with our team for any questions or support.",
                    "email": "support@lumina.com",
                    "phone": "+1 (555) 123-4567",
                    "address": "123 Learning Street, Education City, EC 12345"
                },
                "seo": {"metaTitle": "Contact Us - LUMINA", "metaDescription": "Get in touch with LUMINA support team."},
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "slug": "careers",
                "title": "Careers",
                "content": {
                    "title": "Join Our Team",
                    "description": "We're always looking for talented individuals who are passionate about education and technology.",
                    "sections": [
                        {"title": "Why Work at LUMINA?", "content": "Join a fast-growing EdTech company making a real impact on learners worldwide. We offer competitive salaries, flexible work arrangements, and opportunities for growth."},
                        {"title": "Open Positions", "content": "Check our careers page regularly for new opportunities. We're often hiring for engineering, design, content, and marketing roles."},
                        {"title": "How to Apply", "content": "Send your resume and portfolio to careers@lumina.com with the position title in the subject line."}
                    ]
                },
                "seo": {"metaTitle": "Careers - LUMINA", "metaDescription": "Join the LUMINA team and help transform education."},
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.cms.insert_many(cms_pages)
        logger.info(f"Seeded {len(cms_pages)} CMS pages")

# Include the router in the main app (MUST be after all route definitions)
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
