const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { z } = require('zod');
const PasskeyCredential = require('../models/PasskeyCredential');
const User = require('../models/User');
const config = require('../config');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// For brevity in a hackathon, we’ll do minimal verification using simplewebauthn later if added
// Here we provide the challenge flow scaffolding and store credentials

const router = express.Router();

const rpId = (process.env.RP_ID || 'localhost');
const origin = (process.env.FRONTEND_URL || 'http://localhost:5173');

// Simple in-memory challenge store
const challenges = new Map(); // key: key, value: { userId, type, challenge, email? }

function generateChallenge() {
  return crypto.randomBytes(32).toString('base64url');
}

// Register begin
router.post('/register/begin', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const challenge = generateChallenge();
    challenges.set(`reg:${userId}`, { userId, type: 'reg', challenge });
    res.json({ success: true, data: {
      options: {
        publicKey: {
          rp: { name: 'TSEC Hack', id: rpId },
          user: { id: Buffer.from(String(userId)).toString('base64url'), name: user.email, displayName: user.name || user.email },
          challenge,
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
          authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
          timeout: 60000,
          attestation: 'none'
        }
      }
    }});
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to begin registration' });
  }
});

// Register finish (mock-verify signature in hackathon scope)
const FinishRegSchema = z.object({ id: z.string(), rawId: z.string(), response: z.any(), type: z.string(), transports: z.array(z.string()).optional() });
router.post('/register/finish', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const record = challenges.get(`reg:${userId}`);
    if (!record) return res.status(400).json({ success: false, message: 'No challenge' });
    challenges.delete(`reg:${userId}`);
    const body = FinishRegSchema.parse(req.body);
    // In a full implementation, verify attestation here. For hackathon, accept and store.
    const credentialId = body.id;
    const publicKey = body.response?.attestationObject || 'publicKey-mock';
    await PasskeyCredential.create({ userId, credentialId, publicKey, signCount: 0, transports: body.transports || [] });
    res.json({ success: true, message: 'Passkey added' });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Failed to finish registration' });
  }
});

// Auth begin
const BeginAuthSchema = z.object({ email: z.string().email().optional() });
router.post('/auth/begin', async (req, res) => {
  try {
    const { email } = BeginAuthSchema.parse(req.body || {});
    let user = null;
    if (email) user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ success: false, message: 'User not found' });
    const creds = await PasskeyCredential.find({ userId: user._id });
    if (creds.length === 0) return res.status(400).json({ success: false, message: 'No passkeys for user' });
    const challenge = generateChallenge();
    challenges.set(`auth:${user._id}`, { userId: user._id, type: 'auth', challenge });
    res.json({ success: true, data: {
      options: {
        publicKey: {
          challenge,
          timeout: 60000,
          rpId,
          userVerification: 'required',
          allowCredentials: creds.map(c => ({ id: c.credentialId, type: 'public-key', transports: c.transports || ['internal'] }))
        }
      }
    }});
  } catch (e) {
    res.status(400).json({ success: false, message: 'Failed to begin auth' });
  }
});

// Auth finish
const FinishAuthSchema = z.object({ id: z.string(), rawId: z.string(), response: z.any(), type: z.string() });
router.post('/auth/finish', async (req, res) => {
  try {
    const body = FinishAuthSchema.parse(req.body);
    // In full impl, verify assertion. Here, map by credential id to user.
    const cred = await PasskeyCredential.findOne({ credentialId: body.id });
    if (!cred) return res.status(400).json({ success: false, message: 'Unknown credential' });
    const token = jwt.sign({ userId: cred.userId }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
    res.json({ success: true, data: { token } });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Failed to finish auth' });
  }
});

module.exports = router;


