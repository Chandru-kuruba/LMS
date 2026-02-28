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

### Latest Updates - Certificate Design Improvements

#### 1. Certificate Size - A4 Landscape Format (297mm × 210mm)
- Certificate dimensions now exactly 297mm × 210mm (A4 Landscape)
- Print-ready with proper margins maintained
- No stretching or distortion in PDF export
- Preview maintains correct aspect ratio in admin editor

#### 2. Increased Logo Size & Controls
- **Default Logo Size**: 300px width × 120px height (~75mm × 30mm in print)
- **Adjustable Width**: 100px to 600px with slider control
- **Adjustable Height**: 40px to 250px with slider control
- **Size Presets**: Small (200×80), Medium (300×120), Large (400×160)
- **Maintain Aspect Ratio**: Toggle option for proportional resizing
- High resolution logo support (no blur on download/print)

#### 3. Drag-and-Drop Logo Positioning
- **Main Company Logo**: Draggable in live preview
- **Additional Logos (MSME, ISO)**: Each individually draggable
- **Live Preview**: Real-time updates while adjusting positions
- **Position Controls**: X/Y sliders + drag-and-drop
- **Visual Feedback**: Purple highlight ring on hover for draggable elements

### Previous Implementations

#### Core Features
- Course Publishing - Fixed
- Full Dynamic CMS Control - Implemented
- Certificate System - Fully Implemented
- Admin Notification System - Implemented
- Profile Image System - Fixed

#### Admin Panel Features
| Page | Route | Status |
|------|-------|--------|
| Dashboard | `/admin` | ✅ Working |
| Users | `/admin/users` | ✅ Working |
| Courses | `/admin/courses` | ✅ Working |
| Certificates | `/admin/certificates` | ✅ Working |
| Certificate Design | `/admin/certificate-design` | ✅ Enhanced |
| Notifications | `/admin/notifications` | ✅ Working |
| Withdrawals | `/admin/withdrawals` | ✅ Working |
| Tickets | `/admin/tickets` | ✅ Working |
| CMS | `/admin/cms` | ✅ Working |

---

### Certificate Template Editor Features
- **Layout Tab**: Background color/image, border settings, decorative corners, QR code toggle
- **Text Tab**: Header, recipient name, course title, signature settings with font controls
- **Logos Tab**: 
  - Main logo URL, adjustable width/height sliders
  - Size presets (Small/Medium/Large)
  - Maintain aspect ratio toggle
  - Drag-and-drop positioning info
  - Additional logos (MSME, ISO) with individual controls
- **Position Tab**: X/Y positioning for all elements
- **Live Preview**: Real-time preview with A4 Landscape dimensions, draggable logos

---

### API Endpoints Summary

#### Admin Certificate Design
- `GET /api/admin/certificate-design` - Get global certificate design settings
- `PUT /api/admin/certificate-design` - Update global certificate design

#### Admin Certificates
- `GET /api/admin/certificates` - List all certificates
- `PUT /api/admin/certificates/{id}` - Update certificate details
- `POST /api/admin/certificates/{id}/unlock-name` - Allow user to edit name

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
- [ ] Export certificates as PDF directly from admin
- [ ] Advanced analytics dashboard

### P3 - Technical Debt
- [ ] Refactor server.py into multiple router files
- [ ] Add unit tests for new endpoints
- [ ] Consider server-side PDF generation with ReportLab

---

## Updated Files (Feb 28, 2026)
- `/app/frontend/src/pages/admin/CertificateDesignPage.jsx` - Enhanced with A4 dimensions, drag-and-drop, adjustable logo controls
- `/app/frontend/src/pages/student/CertificatesPage.jsx` - Updated print template with A4 Landscape and larger logo

---

## Last Updated
February 28, 2026
