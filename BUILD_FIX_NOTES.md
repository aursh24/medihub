# Build Fix - Environment Variables

## Changes Made

### 1. Updated Dockerfile
- Added `ARG` declarations for build-time environment variables
- Set these as `ENV` variables in the builder stage
- This ensures `NEXT_PUBLIC_*` variables are available during `npm run build`

### 2. Updated ConvexClientProvider.tsx
- Made the error check conditional (only throws in browser, not during build)
- Added fallback if Convex URL is not available during build
- This prevents build failures if env vars aren't set

## Important: Render Configuration

**You MUST set these environment variables in Render BEFORE building:**

1. Go to your Render service → **Environment** tab
2. Add these variables:
   - `NEXT_PUBLIC_CONVEX_URL` - Your Convex deployment URL
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key
   - `CLERK_FRONTEND_API_URL` - Your Clerk frontend API URL

**Render automatically passes environment variables to Docker builds**, so once you set them in the Environment tab, they'll be available during the build process.

## Next Steps

1. **Set environment variables in Render** (if not already done)
2. **Commit and push the changes:**
   ```bash
   git add Dockerfile components/ConvexClientProvider.tsx
   git commit -m "Fix: Add build-time environment variables support"
   git push origin main
   ```
3. **Trigger a new build** in Render (or wait for auto-deploy)
4. **Monitor build logs** to ensure it succeeds

## Troubleshooting

If build still fails:
- Verify all environment variables are set in Render
- Check build logs for specific error messages
- Ensure `NEXT_PUBLIC_CONVEX_URL` is correctly formatted (starts with `https://`)

