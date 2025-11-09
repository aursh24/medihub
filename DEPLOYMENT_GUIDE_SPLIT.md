# Deployment Guide: Backend on Render + Frontend on Vercel

This guide walks you through deploying MediHub with a split architecture:
- **Backend API**: Deployed on Render
- **Frontend**: Deployed on Vercel
- **Convex**: Already deployed separately (database/backend service)

## Architecture Overview

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Vercel    │ ──────> │    Render    │ ──────> │   Convex   │
│  Frontend   │         │  Backend API │         │  Database  │
│  (Next.js)  │         │   (Express)  │         │             │
└─────────────┘         └──────────────┘         └─────────────┘
       │                        │
       └────────────────────────┘
              Clerk Auth
```

## Prerequisites

1. **GitHub Account** - Your code should be in a GitHub repository
2. **Render Account** - Sign up at [render.com](https://render.com)
3. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
4. **Convex Account** - Your Convex deployment URL
5. **Clerk Account** - Your Clerk API keys

## Part 1: Deploy Backend API on Render

### Step 1: Prepare Backend Repository Structure

Ensure your repository has the `backend/` folder with:
- ✅ `backend/server.js`
- ✅ `backend/package.json`
- ✅ `backend/Dockerfile`
- ✅ `backend/render.yaml`
- ✅ `backend/.dockerignore`

### Step 2: Create Render Web Service

1. Go to [render.com](https://render.com) and log in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account if not already connected
4. Select your repository
5. Click **"Connect"**

### Step 3: Configure Backend Service

#### Basic Settings:
- **Name**: `medihub-backend` (or your preferred name)
- **Region**: Choose closest to your users (e.g., `Oregon`, `Frankfurt`)
- **Branch**: `main` (or your default branch)
- **Root Directory**: `backend` ⚠️ **IMPORTANT: Set this to `backend`**

#### Build & Deploy Settings:
- **Environment**: Select **"Docker"**
- **Dockerfile Path**: `Dockerfile` (relative to root directory)
- **Docker Context**: `backend` (or `.` if root directory is set to `backend`)

#### Plan:
- **Starter Plan**: $7/month (always on, no spin-down)
- **Free Plan**: 750 hours/month (spins down after inactivity)

### Step 4: Set Backend Environment Variables

In Render dashboard → Your Service → **Environment** tab, add:

#### Required Variables:

1. **CLERK_SECRET_KEY**
   - Value: Your Clerk secret key
   - Format: `sk_test_...` or `sk_live_...`
   - **Important**: Mark this as "Secret" in Render

2. **FRONTEND_URL**
   - Value: Your Vercel frontend URL (you'll get this after deploying frontend)
   - Format: `https://your-app.vercel.app`
   - **Note**: You can update this after deploying the frontend

#### Optional Variables (with defaults):

3. **ASHA_INVITE_CODE**
   - Value: `ASHA2025` (or your custom code)
   - Default: `ASHA2025`

4. **ADMIN_INVITE_CODE**
   - Value: `ADMIN2025` (or your custom code)
   - Default: `ADMIN2025`

5. **PORT**
   - Value: `3001`
   - Default: `3001`

6. **NODE_ENV**
   - Value: `production`
   - Usually auto-set, but you can add it

### Step 5: Deploy Backend

1. Review all settings
2. Click **"Create Web Service"**
3. Render will start building your Docker image
4. Monitor the build logs
5. **Copy your backend URL** (e.g., `https://medihub-backend.onrender.com`)

## Part 2: Deploy Frontend on Vercel

### Step 1: Prepare Frontend

Ensure your repository root has:
- ✅ `package.json`
- ✅ `next.config.ts`
- ✅ `vercel.json` (optional, but helpful)

### Step 2: Create Vercel Project

1. Go to [vercel.com](https://vercel.com) and log in
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Select your repository and click **"Import"**

### Step 3: Configure Frontend Project

#### Project Settings:
- **Project Name**: `medihub` (or your preferred name)
- **Framework Preset**: Next.js (should auto-detect)
- **Root Directory**: `./` (root of repository)
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

### Step 4: Set Frontend Environment Variables

In Vercel dashboard → Your Project → **Settings** → **Environment Variables**, add:

#### Required Variables:

1. **NEXT_PUBLIC_CONVEX_URL**
   - Value: Your Convex deployment URL
   - Example: `https://your-app.convex.cloud`
   - **Important**: Must start with `NEXT_PUBLIC_` to be available in browser

2. **NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY**
   - Value: From your Clerk dashboard
   - Format: `pk_test_...` or `pk_live_...`
   - **Important**: Must start with `NEXT_PUBLIC_`

3. **CLERK_SECRET_KEY**
   - Value: From your Clerk dashboard
   - Format: `sk_test_...` or `sk_live_...`
   - **Important**: Mark as "Secret" in Vercel

4. **CLERK_FRONTEND_API_URL**
   - Value: From your Clerk dashboard
   - Format: `https://your-app.clerk.accounts.dev`

5. **NEXT_PUBLIC_BACKEND_API_URL** ⚠️ **NEW**
   - Value: Your Render backend URL (from Part 1, Step 5)
   - Example: `https://medihub-backend.onrender.com`
   - **Important**: Must start with `NEXT_PUBLIC_` to be available in browser
   - **Note**: No trailing slash

#### Optional Variables:

6. **ASHA_INVITE_CODE**
   - Value: `ASHA2025` (or your custom code)
   - Default: `ASHA2025`

7. **ADMIN_INVITE_CODE**
   - Value: `ADMIN2025` (or your custom code)
   - Default: `ADMIN2025`

### Step 5: Deploy Frontend

1. Review all settings
2. Click **"Deploy"**
3. Wait for build to complete (usually 2-3 minutes)
4. **Copy your frontend URL** (e.g., `https://medihub.vercel.app`)

### Step 6: Update Backend CORS

1. Go back to Render dashboard → Your Backend Service
2. Go to **Environment** tab
3. Update **FRONTEND_URL** with your Vercel URL
4. Click **"Save Changes"**
5. Render will automatically redeploy

## Part 3: Configure Clerk

### Step 1: Update Clerk Allowed Origins

1. Go to your [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to **Settings** → **Paths**
4. Add both URLs to **Allowed Origins**:
   - `https://your-app.vercel.app` (Vercel frontend)
   - `https://medihub-backend.onrender.com` (Render backend, if needed)

### Step 2: Update Redirect URLs

1. In Clerk Dashboard → **Settings** → **Paths**
2. Add your Vercel URL to:
   - **After Sign-In URL**: `https://your-app.vercel.app/after-signin`
   - **After Sign-Up URL**: `https://your-app.vercel.app/after-signin`

## Part 4: Verify Deployment

### Test Backend API

1. Visit `https://your-backend.onrender.com/health`
2. Should return: `{"status":"ok","timestamp":"..."}`

### Test Frontend

1. Visit your Vercel URL
2. Test the following:
   - ✅ Landing page loads
   - ✅ Sign in works
   - ✅ Admin portal accessible
   - ✅ ASHA portal accessible
   - ✅ API calls to backend work (check browser console)

### Test Connection

1. Open browser DevTools → Network tab
2. Sign in and navigate to ASHA portal
3. Look for requests to your Render backend URL
4. Verify they return `200 OK` status

## Troubleshooting

### Backend Issues

**Issue**: Backend build fails
- **Solution**: Check Render logs for specific errors
- Common issues:
  - Missing `backend/` folder
  - Incorrect root directory setting
  - Dockerfile path incorrect

**Issue**: CORS errors in browser console
- **Solution**: 
  - Verify `FRONTEND_URL` is set correctly in Render
  - Ensure it matches your Vercel URL exactly (no trailing slash)
  - Check backend logs for CORS errors

**Issue**: Backend returns 401 Unauthorized
- **Solution**: 
  - Verify `CLERK_SECRET_KEY` is set correctly
  - Check that userId is being passed from frontend

### Frontend Issues

**Issue**: Frontend build fails
- **Solution**: Check Vercel build logs
- Common issues:
  - Missing environment variables
  - `NEXT_PUBLIC_*` variables not set
  - Build errors in code

**Issue**: API calls fail with network errors
- **Solution**:
  - Verify `NEXT_PUBLIC_BACKEND_API_URL` is set correctly
  - Check browser console for CORS errors
  - Verify backend is running (check `/health` endpoint)

**Issue**: Can't access Admin/ASHA portals
- **Solution**:
  - Verify role is set correctly in Clerk
  - Check middleware is working
  - Ensure Clerk allowed origins include Vercel URL

### Connection Issues

**Issue**: Frontend can't reach backend
- **Solution**:
  - Verify `NEXT_PUBLIC_BACKEND_API_URL` matches backend URL exactly
  - Check backend is running and accessible
  - Test backend `/health` endpoint directly

## Environment Variables Checklist

### Backend (Render):
- [ ] `CLERK_SECRET_KEY` - Your Clerk secret key
- [ ] `FRONTEND_URL` - Your Vercel frontend URL
- [ ] `ASHA_INVITE_CODE` - Optional (defaults to ASHA2025)
- [ ] `ADMIN_INVITE_CODE` - Optional (defaults to ADMIN2025)
- [ ] `PORT` - Optional (defaults to 3001)
- [ ] `NODE_ENV` - Set to `production`

### Frontend (Vercel):
- [ ] `NEXT_PUBLIC_CONVEX_URL` - Your Convex deployment URL
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - From Clerk dashboard
- [ ] `CLERK_SECRET_KEY` - From Clerk dashboard
- [ ] `CLERK_FRONTEND_API_URL` - Your Clerk frontend API URL
- [ ] `NEXT_PUBLIC_BACKEND_API_URL` - Your Render backend URL ⚠️ **IMPORTANT**
- [ ] `ASHA_INVITE_CODE` - Optional (defaults to ASHA2025)
- [ ] `ADMIN_INVITE_CODE` - Optional (defaults to ADMIN2025)

## Cost Information

### Render (Backend)
- **Free Tier**: 750 hours/month (spins down after inactivity)
- **Starter Plan**: $7/month (always on, no spin-down)

### Vercel (Frontend)
- **Hobby Plan**: Free (with limitations)
- **Pro Plan**: $20/month (for production use)

## Next Steps

After successful deployment:
1. Set up monitoring and alerts
2. Configure custom domains (optional)
3. Set up CI/CD for automatic deployments
4. Configure backups for your Convex database
5. Review and optimize performance

---

**Congratulations!** Your MediHub application is now live with backend on Render and frontend on Vercel! 🎉

