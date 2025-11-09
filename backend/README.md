# MediHub Backend API

This is the backend API service for MediHub, deployed on Render.

## Endpoints

### Health Check
- `GET /health` - Returns server status

### Set Role
- `POST /api/set-role`
  - Body: `{ role: string, invite?: string, userId: string }`
  - Returns: `{ ok: boolean, role?: string, error?: string }`

### Verify Role
- `GET /api/verify-role?userId=xxx`
  - Returns: `{ userId: string, role: string, hasPermission: boolean, publicMetadata: object, verifiedAt: string }`

## Environment Variables

- `CLERK_SECRET_KEY` - Your Clerk secret key
- `FRONTEND_URL` - Your Vercel frontend URL (for CORS)
- `ASHA_INVITE_CODE` - Invite code for ASHA role (default: ASHA2025)
- `ADMIN_INVITE_CODE` - Invite code for ADMIN role (default: ADMIN2025)
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (production/development)

## Local Development

```bash
npm install
npm run dev
```

## Deployment

See the main deployment guide for Render setup instructions.

