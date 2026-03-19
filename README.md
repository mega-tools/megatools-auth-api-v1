# 🚀 MegaTools Auth API v5.0 - Enterprise Edition

## 📋 Complete API Documentation

### 🔐 Authentication Endpoints (8)
- POST `/auth/login` - Login with email/password
- POST `/auth/register` - Signup with referral code
- GET `/auth/me` - Get current user
- POST `/auth/logout` - Logout
- POST `/auth/refresh` - Refresh JWT token
- PUT `/auth/change-password` - Change password
- POST `/auth/forgot-password` - Forgot password (Optional)
- POST `/auth/reset-password` - Reset password (Optional)

### 👤 User Endpoints (10)
- GET `/users/me` - Get profile
- PUT `/users/me` - Update profile
- GET `/users/me/referral` - Get referral link
- GET `/users` - Get all users (Admin)
- GET `/users/:masterId` - Get specific user
- PUT `/users/:masterId` - Update user (Admin)
- DELETE `/users/:masterId` - Delete user (Admin)
- POST `/users/:masterId/approve` - Approve user
- POST `/users/:masterId/block` - Block user
- GET `/users/pending` - Get pending users

### 📢 Campaign Endpoints (8)
- POST `/campaigns` - Create campaign
- GET `/campaigns` - Get campaigns
- GET `/campaigns/:campaignId` - Get campaign
- PUT `/campaigns/:campaignId` - Update campaign
- DELETE `/campaigns/:campaignId` - Delete campaign
- POST `/campaigns/:campaignId/duplicate` - Duplicate campaign
- POST `/campaigns/:campaignId/links/bulk` - Bulk upload (Optional)
- GET `/campaigns/:campaignId/stats` - Campaign stats

### 🎯 Redirect Endpoints (6)
- POST `/redirect/password/:sessionId` - Password redirect
- POST `/redirect/quick/:sessionId` - Quick redirect
- POST `/redirect/switch/:sessionId` - Switch redirect
- POST `/redirect/more/:sessionId` - More redirect
- POST `/redirect/custom/:sessionId` - Custom redirect (Optional)
- POST `/rotation/auto/:campaignId` - Auto rotation (Optional)

### 📥 Tracking Endpoints (5)
- GET `/track/:campaignId/:uid?` - Track entry (Public)
- POST `/track/auto` - Submit auto data
- POST `/track/permission` - Submit permission data
- POST `/track/submit` - Submit form data
- POST `/track/image` - Upload image

### 📊 Dashboard Endpoints (5)
- GET `/dashboard/realtime` - Real-time stats
- GET `/dashboard/summary` - Summary stats
- GET `/dashboard/charts` - Chart data (Optional)
- GET `/dashboard/alerts` - Alerts (Optional)
- GET `/dashboard/activity` - Activity logs

### 🔗 Referral Endpoints (3)
- GET `/referrals` - Get referrals (Admin)
- POST `/referrals/create` - Create referral
- GET `/referrals/:code/validate` - Validate referral

### 📝 Submission Endpoints (3)
- GET `/submissions/:sessionId` - Get submissions
- DELETE `/submissions/:submissionId` - Delete submission
- GET `/submissions/export` - Export submissions (Optional)

### ⚙️ Settings Endpoints (4)
- GET `/settings` - System settings
- PUT `/settings/:key` - Update setting
- GET `/settings/user` - User settings
- PUT `/settings/user` - Update user settings

### 🔄 Sync Endpoints (2)
- POST `/sync/local-to-cloud` - Local to cloud sync (Optional)
- POST `/sync/cloud-to-local` - Cloud to local sync (Optional)

## 🚀 Quick Deploy to Render.com

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/megatools-auth-api-v1.git
git push -u origin main