# LUMINA LMS - Course Selling Platform

## Product Overview
LUMINA is a full-stack Learning Management System (LMS) with course selling capabilities, affiliate/referral system, and admin CMS. Features a modern dark-themed neon UI with glassmorphism effects.

## Tech Stack
- **Frontend:** React 19, TailwindCSS, Zustand, Framer Motion, shadcn/ui
- **Backend:** Python FastAPI
- **Database:** MongoDB (Local)
- **Authentication:** JWT with OTP email verification
- **Payments:** PayU (Test Mode)
- **Video Storage:** Cloudflare R2 with signed URLs
- **Email:** SMTP via GoDaddy (SSL 465)

## User Roles
1. **Student** - Browse courses, purchase, learn, earn through referrals
2. **Admin** - Manage courses, users, withdrawals, CMS

## Core Features

### Authentication (✅ Implemented)
- [x] User registration with OTP email verification
- [x] Registration with referral code (optional)
- [x] Login with JWT access/refresh tokens
- [x] Password reset via email
- [x] Profile management with image upload
- [x] College details (name, degree, branch, year, roll number)

### Student Features (✅ Implemented)
- [x] Course browsing with filters/search
- [x] Course detail pages
- [x] Cart management
- [x] Wishlist
- [x] Course enrollment (after payment)
- [x] Progress tracking
- [x] Quiz system
- [x] Certificate generation
- [x] **Referral system - 20% LIFETIME commission**
- [x] Referral dashboard with earnings history
- [x] Wallet balance
- [x] Support tickets
- [x] Profile with image upload and college details

### Admin Features (✅ Implemented)
- [x] Dashboard with analytics
- [x] User management (ban/unban, role change)
- [x] Course CRUD with module/lesson/quiz editor
- [x] Module/Lesson management with video upload
- [x] Quiz management with questions
- [x] Coupon management
- [x] Withdrawal approvals
- [x] **Full Dynamic CMS management:**
  - Home page (hero section)
  - About page
  - Contact page
  - FAQ management
  - Navbar configuration
  - Footer with social links
  - Testimonials

### Integrations (✅ Configured)
- [x] PayU - API Key: 4VsfzG, Salt: edl6vMk3tGWC0z0YbhSsb8tZIQBA1to3
- [x] SMTP - smtpout.secureserver.net:465 (SSL)
- [x] Cloudflare R2 - Bucket: course (private, signed URLs)

## Referral System (20% Lifetime)
- Referral code auto-generated on user signup
- Referral link: `https://domain.com/register?ref=CODE`
- Permanent referral relationship stored as `referred_by` (user ID)
- 20% commission on ALL purchases by referred users (lifetime)
- Commission added to wallet immediately
- Referral earnings collection tracks per-course commissions

## User Model
```json
{
  "id": "uuid",
  "email": "string",
  "password": "hashed",
  "first_name": "string",
  "last_name": "string",
  "role": "student|admin",
  "referral_code": "auto-generated",
  "referred_by": "referrer_user_id",
  "wallet_balance": 0.0,
  "total_earnings": 0.0,
  "profile_image_key": "R2 object key",
  "college_details": {
    "college_name": "",
    "degree": "",
    "branch": "",
    "year_of_study": "",
    "roll_number": ""
  },
  "phone": "",
  "bio": ""
}
```

## API Endpoints

### Auth
- POST /api/auth/register (with referral_code)
- POST /api/auth/verify-otp
- POST /api/auth/login
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- GET /api/auth/me
- PUT /api/auth/profile

### Profile
- POST /api/user/upload-profile-image
- GET /api/user/profile-image

### Referrals
- GET /api/referrals/stats
- GET /api/referrals/earnings

### CMS (Admin)
- GET /api/admin/cms
- GET /api/admin/cms/:slug
- PUT /api/admin/cms/:slug
- POST /api/admin/cms
- DELETE /api/admin/cms/:slug

### CMS (Public)
- GET /api/public/cms/:slug
- GET /api/public/cms

### Courses
- GET /api/courses
- GET /api/courses/:id
- GET /api/enrolled-courses

### Admin
- GET /api/admin/users
- PUT /api/admin/users/:id
- PUT /api/admin/modules/:id
- PUT /api/admin/lessons/:id
- DELETE /api/admin/modules/:id
- DELETE /api/admin/lessons/:id

## Test Credentials
- **Admin:** admin@lumina.com / admin123

## Current Status (Updated: 2026-02-27)
- Backend: ✅ Running (FastAPI + MongoDB)
- Frontend: ✅ Running (React)
- Auth: ✅ Working (JWT + OTP email)
- Courses: ✅ Working (CRUD + filtering)
- Course Editor: ✅ Working (modules, lessons, quizzes)
- Cart/Wishlist: ✅ Working
- Payments: ✅ Configured (PayU test mode)
- Video: ✅ Configured (Cloudflare R2 signed URLs)
- Email: ✅ Configured (SMTP GoDaddy SSL)
- Admin Users: ✅ Working (ban/unban, search, filter, performance view)
- Admin Withdrawals: ✅ Working (approve/reject with email)
- Referral System: ✅ Working (20% lifetime commission)
- CMS: ✅ Working (7 sections: Home, About, Contact, FAQ, Navbar, Footer, Testimonials)
- Profile: ✅ Working (MongoDB Base64 image, college details)
- Notifications: ✅ Working (with delete/mark read)
- Certificates: ✅ Working (request, name lock, admin unlock)
- Support Tickets: ✅ Working (status: open/in-progress/closed)
- Mobile Responsive: ✅ Working (tested 768px, 320px)

## Testing Results
- iteration_1: 17/17 backend tests passing
- iteration_2: 23/23 backend tests passing
- iteration_3: 26/26 backend tests passing (100%)

## Bug Fixes Applied
- Fixed: CoursesPage SelectItem empty value error
- Fixed: Public CMS endpoint
- Fixed: Certificate routes not registered (routes after app.include_router)
- Fixed: Admin withdrawals approval with email notification
- Fixed: Profile image storage in MongoDB (not R2)

## Backlog
- [ ] Real-time chat (WebSocket)
- [ ] Push notifications
- [ ] Certificate PDF generation with template
- [ ] Course analytics dashboard
- [ ] Student progress reports
- [ ] PayU payout API integration for withdrawals
