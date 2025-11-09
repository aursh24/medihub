import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { clerkClient } from '@clerk/clerk-sdk-node';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - allow requests from Vercel frontend
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Set role endpoint
app.post('/api/set-role', async (req, res) => {
  try {
    const { role: roleRequested, invite, userId } = req.body;

    if (!roleRequested) {
      return res.status(400).json({ ok: false, error: 'role required' });
    }

    if (!userId) {
      return res.status(401).json({ ok: false, error: 'Not authenticated - userId required' });
    }

    // Basic invite-code logic for privileged roles
    const privilegedRoles = ['asha', 'admin'];
    if (privilegedRoles.includes(roleRequested.toLowerCase())) {
      const allowedInvite = process.env.ASHA_INVITE_CODE || 'ASHA2025';
      const adminInvite = process.env.ADMIN_INVITE_CODE || 'ADMIN2025';

      if (roleRequested.toLowerCase() === 'asha' && invite !== allowedInvite) {
        return res.status(403).json({ ok: false, error: 'Invalid invite for ASHA' });
      }
      if (roleRequested.toLowerCase() === 'admin' && invite !== adminInvite) {
        return res.status(403).json({ ok: false, error: 'Invalid invite for ADMIN' });
      }
    }

    // Update Clerk user publicMetadata
    try {
      const client = await clerkClient();
      await client.users.updateUserMetadata(userId, {
        publicMetadata: { role: roleRequested.toLowerCase() },
      });
      return res.json({ ok: true, role: roleRequested.toLowerCase() });
    } catch (err) {
      console.error('Error updating user metadata:', err);
      return res.status(500).json({ ok: false, error: err.message || String(err) });
    }
  } catch (error) {
    console.error('Error in set-role:', error);
    return res.status(500).json({ ok: false, error: error.message || 'Internal server error' });
  }
});

// Verify role endpoint
app.get('/api/verify-role', async (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated - userId required' });
    }

    // Get the latest role from Clerk server-side
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const role = (user.publicMetadata?.role || 'citizen').toLowerCase().trim();

    const hasPermission = role === 'asha' || role === 'admin';

    return res.json({
      userId,
      role,
      hasPermission,
      publicMetadata: user.publicMetadata,
      verifiedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error verifying role:', error);
    return res.status(500).json({
      error: error.message || 'Failed to verify role',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend API server running on port ${PORT}`);
  console.log(`CORS enabled for origins: ${allowedOrigins.join(', ')}`);
});

