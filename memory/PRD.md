# LUMINA LMS - Product Requirements Document

## Project Overview
Chand Web Technology Learning Management System - MSME registered and ISO 9001:2015 certified company.

## Tech Stack
- **Frontend**: React.js, Tailwind CSS, Framer Motion
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Storage**: Cloudflare R2 (videos), MongoDB (profile images)
- **Payment**: PayU (test mode)
- **Email**: SMTP (SSL 465)

---

## What's Been Implemented (Feb 28, 2026)

### ✅ Core Features

#### 1. Course Publishing - FIXED
- `PUT /admin/courses/{id}` accepts partial updates for publishing

#### 2. Full Dynamic CMS Control - IMPLEMENTED
- All website content editable from Admin CMS panel
- Hero section, Stats, Features, Navbar, Footer all dynamic
- Pages: home, about, contact, privacy, terms, refund, careers

#### 3. Certificate System - FULLY IMPLEMENTED
- **Certificate Generation**: Students can request certificates upon course completion
- **Email Notifications**: Automatic email with download and verification links
- **Public Verification**: `/verify/{certificate_id}` for authenticity check
- **Admin Certificate Management**: View, search by ID, edit, unlock name editing
- **Certificate Templates**: Full design control with advanced editor

#### 4. Admin Notification System - IMPLEMENTED (Feb 28, 2026)
- Send notifications to all users or selected users
- Optional email notifications with professional template
- Notification history with type, recipient count, date
- Individual notifications stored per user
- Admin endpoints: `GET/POST /admin/notifications`, `DELETE /admin/notifications/{id}`

#### 5. Profile Image System - FIXED (Feb 28, 2026)
- Profile images stored in MongoDB as base64
- `/auth/me` now returns `profile_image_url`
- Profile images display in Dashboard and Admin sidebars
- Fallback to generated avatars if no image uploaded

---

### ✅ Admin Panel Features

| Page | Route | Status |
|------|-------|--------|
| Dashboard | `/admin` | ✅ Working |
| Users | `/admin/users` | ✅ Working |
| Courses | `/admin/courses` | ✅ Working |
| Certificates | `/admin/certificates` | ✅ Working |
| Certificate Templates | `/admin/certificate-templates` | ✅ Working |
| Notifications | `/admin/notifications` | ✅ Working |
| Withdrawals | `/admin/withdrawals` | ✅ Working |
| Tickets | `/admin/tickets` | ✅ Working |
| CMS | `/admin/cms` | ✅ Working |

---

### ✅ Certificate Template Editor Features
- **Basic Tab**: Template name, background image, logo image with size controls
- **Text Tab**: Recipient name styling, course title styling, signature settings
- **Elements Tab**: QR code toggle/size, date settings, certificate ID settings
- **Position Tab**: X/Y positioning for all elements (logo, name, course, signature, date, cert ID, QR code)
- **Live Preview**: Real-time preview showing all elements positioned

---

### API Endpoints Summary

#### Admin Notifications
- `GET /api/admin/notifications` - List all sent notifications
- `POST /api/admin/notifications/send` - Send notification to users
- `DELETE /api/admin/notifications/{id}` - Delete notification

#### Admin Certificates
- `GET /api/admin/certificates` - List all certificates
- `GET /api/admin/certificates/search?certificate_id=xxx` - Search by ID
- `PUT /api/admin/certificates/{id}` - Update certificate details
- `POST /api/admin/certificates/{id}/unlock-name` - Allow user to edit name

#### Certificate Templates
- `GET /api/admin/certificate-templates` - List templates
- `POST /api/admin/certificate-templates` - Create template
- `PUT /api/admin/certificate-templates/{id}` - Update template
- `DELETE /api/admin/certificate-templates/{id}` - Delete template
- `POST /api/admin/certificate-templates/{id}/assign` - Assign to course

---

### Company Branding
- Logo: https://customer-assets.emergentagent.com/job_lms-stabilize-1/artifacts/8733xudx_Untitled_design-removebg-preview.png
- MSME: https://customer-assets.emergentagent.com/job_lms-stabilize-1/artifacts/pmw7was4_msme.png
- ISO: https://customer-assets.emergentagent.com/job_lms-stabilize-1/artifacts/yn7tm6lm_iso.png

---

## Testing Credentials
- **Admin**: admin@lumina.com / admin123

---

## Remaining/Future Tasks

### P0 - None (All critical features complete)

### P1 - Performance
- [ ] Profile image compression on upload
- [ ] Lazy loading for course images

### P2 - Enhancements
- [ ] Bulk user selection for notifications
- [ ] Certificate batch generation
- [ ] Export certificates as PDF
- [ ] Advanced analytics dashboard

### P3 - Technical Debt
- [ ] Refactor server.py into multiple router files
- [ ] Add unit tests for new endpoints
- [ ] Fix React hydration warnings in admin dashboard

---

## Known Issues
- **Platform Caching**: External preview URL may serve stale CMS data. Verify with local curl commands.
- **Admin Dashboard Warnings**: Framer-motion hydration warnings (non-critical, cosmetic only)

---

## Last Updated
February 28, 2026
