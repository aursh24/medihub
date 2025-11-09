# Quick Deployment Reference

## Architecture

- **Backend API**: Render (Express server)
- **Frontend**: Vercel (Next.js)
- **Database**: Convex (separate service)
- **Auth**: Clerk

## Quick Steps

### 1. Deploy Backend on Render

1. Go to [render.com](https://render.com) → New Web Service
2. Connect GitHub repo
3. **Root Directory**: `backend` ⚠️
4. **Environment**: Docker
5. Set environment variables:
   - `CLERK_SECRET_KEY`
   - `FRONTEND_URL` (set after frontend deploys)
6. Copy backend URL (e.g., `https://medihub-backend.onrender.com`)

### 2. Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → Add New Project
2. Import GitHub repo
3. Set environment variables:
   - `NEXT_PUBLIC_CONVEX_URL`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `CLERK_FRONTEND_API_URL`
   - `NEXT_PUBLIC_BACKEND_API_URL` ⚠️ (your Render backend URL)
4. Deploy
5. Copy frontend URL

### 3. Update Backend CORS

1. Go to Render → Backend Service → Environment
2. Update `FRONTEND_URL` with your Vercel URL
3. Save (auto-redeploys)

### 4. Configure Clerk

1. Clerk Dashboard → Settings → Paths
2. Add Vercel URL to Allowed Origins
3. Update redirect URLs

## Environment Variables

### Backend (Render)
```
CLERK_SECRET_KEY=sk_...
FRONTEND_URL=https://your-app.vercel.app
```

### Frontend (Vercel)
```
NEXT_PUBLIC_CONVEX_URL=https://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_FRONTEND_API_URL=https://...
NEXT_PUBLIC_BACKEND_API_URL=https://medihub-backend.onrender.com
```

## Testing

- Backend health: `https://your-backend.onrender.com/health`
- Frontend: Visit your Vercel URL
- Check browser console for API calls

## Full Guide

See `DEPLOYMENT_GUIDE_SPLIT.md` for detailed instructions.

