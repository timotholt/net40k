import { userService } from '../services/UserService.js';
import { AuthError } from '../utils/errors.js';

/**
 * Middleware to authenticate regular users
 * Checks if user is logged in and session is valid
 */
export function authenticateUser(req, res, next) {
    const sessionToken = req.headers.authorization?.split(' ')[1];
    
    if (!sessionToken) {
        return res.status(401).json({ 
            success: false, 
            error: 'No session token provided' 
        });
    }

    try {
        const session = userService.validateSession(sessionToken);
        req.user = session;
        next();
    } catch (error) {
        if (error instanceof AuthError) {
            res.status(401).json({ 
                success: false, 
                error: error.message 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                error: 'Internal server error' 
            });
        }
    }
}

/**
 * Middleware to authenticate admin users
 * First validates user session, then checks admin status
 */
export function authenticateAdmin(req, res, next) {
    const sessionToken = req.headers.authorization?.split(' ')[1];
    
    if (!sessionToken) {
        return res.status(401).json({ 
            success: false, 
            error: 'No session token provided' 
        });
    }

    try {
        const session = userService.validateSession(sessionToken);
        if (!session.isAdmin) {
            throw new AuthError('Admin access required');
        }
        req.user = session;
        next();
    } catch (error) {
        if (error instanceof AuthError) {
            res.status(401).json({ 
                success: false, 
                error: error.message 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                error: 'Internal server error' 
            });
        }
    }
}
