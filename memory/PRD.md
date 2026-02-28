# LUMINA LMS - Product Requirements Document

## Project Overview
LUMINA is a comprehensive Learning Management System (LMS) built with React.js frontend and FastAPI backend, using MongoDB for data storage.

## Original Problem Statement
Clone the LMS repository from GitHub and stabilize the project by fixing all reported issues, then add certificate template upload feature and student certificate request functionality.

## Tech Stack
- **Frontend**: React.js, Tailwind CSS, Framer Motion
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Storage**: Cloudflare R2 (for videos only), MongoDB (for profile images)
- **Payment**: PayU (test mode)
- **Email**: SMTP (SSL 465)

## What's Been Implemented (Feb 27, 2026)

### ✅ Completed Features

#### Core Fixes
1. **Profile Image Storage in MongoDB** - Base64 storage, max 2MB, JPG/PNG/WEBP
2. **Admin Users Page** - Search, filters, ban/unban, View Performance action
3. **Admin User Performance Page** - Purchases, enrollments, course progress, referral earnings
4. **Admin Withdrawals Page** - View/approve/reject withdrawal requests
5. **Admin Tickets Page** - Reply, close, reopen support tickets
6. **Admin CMS Page** - Edit all CMS sections
7. **Student Notifications Page** - View, mark read, delete
8. **Student Certificates Page** - View and print earned certificates
9. **Support Ticket Close/Solve Flow** - "Mark Solved" button for users
10. **Referral Withdrawal System** - Request withdrawals, admin approval, email notifications
11. **Mobile Responsiveness** - No horizontal scroll at 375px/768px
12. **CMS Dynamic Pages** - Privacy Policy, Terms, Refund Policy, About, Contact, Careers

#### NEW: Certificate Template System (Feb 27, 2026)
1. **Admin Certificate Templates Page** (`/admin/certificates`)
   - Create custom certificate templates
   - Upload background images (up to 5MB)
   - Configure font family, size, color
   - Set name position (X, Y coordinates)
   - Assign templates to specific courses
   - Edit/delete templates
   - Preview with sample name

2. **Student Certificate Request**
   - **My Courses Page**: "Get Certificate" button appears for completed courses
   - **Course Player**: "Request Certificate" button in sidebar when course is 100% complete
   - Certificate request dialog with name input
   - Name is locked after submission (cannot be changed)
   - Admin can unlock name for corrections via special request

### Backend APIs
- `GET /admin/certificate-templates` - List all templates
- `POST /admin/certificate-templates` - Create template
- `PUT /admin/certificate-templates/{id}` - Update template
- `DELETE /admin/certificate-templates/{id}` - Delete template
- `POST /admin/certificate-templates/{id}/assign` - Assign to course
- `POST /certificates/{courseId}/request` - Student request certificate
- `GET /certificates` - Get user's certificates
- `PUT /admin/certificates/{id}/unlock-name` - Admin unlock name

## User Flow: Certificate System

### Admin Flow
1. Go to Admin → Certificates
2. Click "Create Template"
3. Upload background image (optional)
4. Configure font settings and positions
5. Save template
6. Assign template to courses

### Student Flow
1. Complete 100% of course content
2. Go to My Courses OR stay in Course Player
3. Click "Get Certificate" / "Request Certificate"
4. Enter name for certificate (will be locked)
5. Certificate is generated with unique ID
6. View/print from Certificates page

## Files Changed/Created
- `/app/frontend/src/pages/admin/CertificateTemplatesPage.jsx` (NEW)
- `/app/frontend/src/pages/student/EnrolledCourses.jsx` (UPDATED)
- `/app/frontend/src/pages/student/CoursePlayer.jsx` (UPDATED)
- `/app/frontend/src/pages/student/CertificatesPage.jsx` (CREATED EARLIER)
- `/app/backend/server.py` (UPDATED with template APIs)
- `/app/frontend/src/App.js` (UPDATED with routes)
- `/app/frontend/src/components/layouts/AdminLayout.jsx` (UPDATED nav)

## Testing Checklist
- [ ] Admin can create certificate template
- [ ] Admin can upload background image
- [ ] Admin can assign template to course
- [ ] Student sees "Get Certificate" on completed courses
- [ ] Student can request certificate with custom name
- [ ] Certificate appears in Certificates page
- [ ] Certificate can be printed/downloaded
- [ ] Name is locked after submission

## Next Tasks
- Test complete certificate flow end-to-end
- Add more certificate template presets
- Implement certificate verification page (public URL)
