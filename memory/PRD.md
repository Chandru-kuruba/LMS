# LUMINA LMS - Product Requirements Document

## Project Overview
LUMINA is a comprehensive Learning Management System (LMS) built with React.js frontend and FastAPI backend, using MongoDB for data storage.

## Original Problem Statement
Clone the LMS repository from GitHub and stabilize the project by fixing all reported issues:
1. Admin users page not loading
2. Withdrawals page error
3. Referral lifetime commission logic
4. CMS edits not reflecting
5. Course creation not showing
6. Notifications page not opening
7. Profile image (store in DB, not R2)
8. Mobile responsiveness
9. Support ticket close/solve flow
10. Order success email
11. Certificate system full implementation

## Tech Stack
- **Frontend**: React.js, Tailwind CSS, Framer Motion
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Storage**: Cloudflare R2 (for videos only), MongoDB (for profile images)
- **Payment**: PayU (test mode)
- **Email**: SMTP (SSL 465)

## User Personas
1. **Students**: Browse courses, purchase, learn, earn certificates, referral program
2. **Admins**: Manage users, courses, withdrawals, CMS content, support tickets

## What's Been Implemented (Feb 27, 2026)

### ✅ Completed Features
1. **Profile Image Storage in MongoDB** - Profile images stored as Base64 in MongoDB, not R2
2. **Admin Users Page** - Working with user list, ban/unban, view performance
3. **Admin User Performance Page** - Shows purchases, enrollments, referral earnings, course progress
4. **Admin Withdrawals Page** - View and process withdrawal requests
5. **Admin Tickets Page** - Manage support tickets (reply, close, reopen)
6. **Admin CMS Page** - Edit all CMS sections (home, about, contact, FAQ, navbar, footer)
7. **Student Notifications Page** - View, mark read, delete notifications
8. **Student Certificates Page** - View and print earned certificates
9. **Student Referrals Page** - View referral stats, request withdrawals
10. **Support Ticket Close/Solve Flow** - Users can mark tickets as solved
11. **Certificate System** - Request certificates after course completion, unique IDs, print tracking
12. **Order Success Email** - Email sent after successful payment
13. **CMS Dynamic Pages** - Privacy Policy, Terms of Service, Refund Policy, About, Contact, Careers
14. **Mobile Responsiveness** - No horizontal scroll at 375px, 768px

### Backend APIs (95.2% Success Rate)
- Auth: Login, Register, OTP, Password Reset
- Users: Profile, Image Upload, Settings
- Courses: CRUD, Enrollment, Progress
- Orders: Checkout, PayU Integration
- Referrals: Stats, Earnings, Withdrawals
- Tickets: Create, Reply, Close, Reopen
- Notifications: CRUD, Mark Read
- Certificates: Request, Generate, Print
- Admin: Dashboard, Users, Courses, Withdrawals, CMS

## Prioritized Backlog

### P0 - Critical (Done)
- ✅ Profile image MongoDB storage
- ✅ Admin withdrawals page
- ✅ Admin user performance
- ✅ CMS dynamic pages
- ✅ Certificate system
- ✅ Support ticket flow

### P1 - Important
- [ ] Fix React hydration warnings (cosmetic)
- [ ] Fix chart container sizing in admin dashboard
- [ ] Improve admin session persistence

### P2 - Nice to Have
- [ ] PayU payout API integration for automated withdrawals
- [ ] Certificate template upload system
- [ ] Advanced analytics dashboard
- [ ] Course ratings/reviews system improvements

## Environment Variables Required
- MONGO_URL
- DB_NAME
- JWT_SECRET
- PAYU_MERCHANT_KEY
- PAYU_MERCHANT_SALT
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
- R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
- FRONTEND_URL

## Testing Status
- Backend: 95.2% success rate
- Frontend: 75% (core functions work, minor navigation issues)
- Mobile: Responsive at 375px and 768px

## Known Issues
1. Platform-level caching causes stale CMS data (resolves with cache expiry)
2. React hydration warnings from framer-motion (cosmetic)
3. Chart container sizing warnings (cosmetic)

## Next Tasks
1. Test complete end-to-end flow with real PayU credentials
2. Add more CMS content sections
3. Implement PayU payout for automated withdrawals
4. Certificate template customization
