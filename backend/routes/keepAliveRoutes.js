import express from 'express';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

/**
 * Keep-Alive Endpoint
 * 
 * @description
 * Lightweight endpoint to maintain user session
 * 
 * CORE FUNCTIONALITY:
 * - Updates session's last active timestamp
 * - Prevents session expiration
 * - Requires valid authentication token
 * 
 * SECURITY:
 * - Protected by authentication middleware
 * - Requires valid session token
 * 
 * PERFORMANCE:
 * - Minimal processing
 * - Instant 200 OK response
 */
router.post('/keep-alive', authenticateUser, (_, res) => {
  // Authentication middleware updates session
  // This endpoint just confirms successful keep-alive
  res.sendStatus(200);
});

export { router };
