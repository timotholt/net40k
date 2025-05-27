import { userService } from '../services/UserService.js';
import { AuthError } from '../utils/errors.js';

export { authenticateUser, verifyProfile, authenticateAdmin };

/**
 * Middleware to authenticate regular users
 * Checks if user is logged in and session is valid
 */
async function authenticateUser(req, res, next) {
    const sessionToken = req.headers.authorization?.split(' ')[1];
    
    if (!sessionToken) {
        return res.status(401).json({ 
            success: false, 
            error: 'No session token provided' 
        });
    }

    try {
        const session = await userService.validateSession(sessionToken);
        req.user = session;
        next();
    } catch (error) {
        if (error instanceof AuthError) {
            res.status(401).json({ 
                success: false, 
                error: error.message 
            });
        } else {
            console.error('Authentication error:', error);
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
/**
 * Middleware to verify user profile is complete
 * Should be used after authenticateUser middleware
 */
async function verifyProfile(req, res, next) {
    try {
        const { isValid, errors } = await userService.verifyProfile(req.user.userUuid);
        
        if (!isValid) {
            return res.status(403).json({
                success: false,
                error: 'PROFILE_INCOMPLETE',
                details: {
                    message: 'User profile is incomplete',
                    missingFields: errors
                }
            });
        }
        
        next();
    } catch (error) {
        console.error('Profile verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify profile',
            details: error.message
        });
    }
}

/**
 * Middleware to authenticate admin users
 * First validates user session, then checks admin status
 */
function authenticateAdmin(req, res, next) {
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
