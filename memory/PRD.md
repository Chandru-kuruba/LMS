# LMS (Learning Management System) - PRD

## Original Problem Statement
1. Clone and run LMS from GitHub
2. Add email logo upload from settings page
3. Add live messages using WebSockets with persistence

## Architecture
- **Backend**: FastAPI (Python) on port 8001 with Socket.IO
- **Frontend**: React with Tailwind CSS on port 3000
- **Database**: MongoDB (local)
- **WebSocket**: Socket.IO for real-time messaging

## Tech Stack
- FastAPI + Motor (async MongoDB) + python-socketio
- React 19 + Tailwind CSS + socket.io-client
- JWT Authentication with OTP verification

## What's Been Implemented

### Jan 2026 - Initial Setup
- ✅ Cloned LMS from GitHub
- ✅ Configured environment (.env files)
- ✅ Fixed build issues

### Mar 2026 - New Features
- ✅ **Email Logo Upload**
  - POST /api/admin/settings/email/logo - Upload logo
  - DELETE /api/admin/settings/email/logo - Remove logo
  - Logo stored in R2 or base64 data URL
  - Integrated into all email templates (OTP, password reset, certificates, payments)

- ✅ **WebSocket Live Messaging**
  - Socket.IO server integrated with FastAPI
  - Authentication via JWT token
  - Real-time message delivery
  - Typing indicators
  - Connection status (Live/Offline)
  - Messages persisted to MongoDB

## Prioritized Backlog

### P0 (Critical)
- None - Core features functional

### P1 (Important)
- Group chat for course discussions
- Read receipts for messages
- Push notifications for new messages

### P2 (Nice to have)
- BIMI setup for Gmail inbox branding
- Voice/video messaging
- Message search functionality

## Next Tasks
1. Test email logo with test email
2. Create multiple users to test WebSocket messaging
3. Configure BIMI DNS records for Gmail inbox icon
