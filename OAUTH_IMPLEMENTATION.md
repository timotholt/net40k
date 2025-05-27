# OAuth Implementation Guide

This document outlines the steps to implement OAuth authentication with multiple providers (Steam, Facebook, Google, Discord) while maintaining a unified user experience.

## Backend Changes

### 1. User Model Updates

Update the User model to support OAuth:

```javascript
// In User.js constructor
this.oauth = sanitizedData.oauth || {
    google: null,
    facebook: null,
    discord: null,
    steam: null
};
```

### 2. OAuth Service

Create a new service to handle OAuth logic:

```javascript
### 3. OAuth Callback Handler

Create a route handler for OAuth callbacks that uses the OAuthService:

```javascript
// routes/auth.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const OAuthService = require('../services/OAuthService');
const { generateJWT } = require('../utils/auth');

// OAuth callback route
router.get('/auth/:provider/callback', 
  (req, res, next) => {
    passport.authenticate(
      req.params.provider, 
      { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` },
      async (err, user, info) => {
        try {
          if (err || !user) {
            console.error('OAuth error:', err || 'No user returned');
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
          }

          // Find or create user using our service
          const userData = await OAuthService.findOrCreateUser(
            req.params.provider,
            user._json || user
          );

          // If user needs to complete profile
          if (!userData.nickname) {
            const tempToken = generateTempToken(userData);
            return res.redirect(`${process.env.FRONTEND_URL}/complete-profile?token=${tempToken}`);
          }

          // Generate JWT and redirect
          const token = generateJWT(userData);
          res.redirect(`${process.env.FRONTEND_URL}/oauth-callback?token=${token}`);
        } catch (error) {
          console.error('OAuth callback error:', error);
          res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_error`);
        }
      }
    )(req, res, next);
  }
);

module.exports = router;
```

### 4. OAuth Service

```javascript
// services/OAuthService.js
class OAuthService {
    static async findOrCreateUser(provider, profile) {
        // 1. Try to find user by provider ID
        let user = await UserDB.findOne({ [`oauth.${provider}.id`]: profile.id });
        if (user) return user;

        // 2. Try to find by email (for account linking)
        const email = this.getEmailFromProfile(provider, profile);
        if (email) {
            user = await UserDB.findOne({ email });
            if (user) {
                // Link OAuth to existing account
                await this.linkOAuthToUser(user.userUuid, provider, profile);
                return await UserDB.findById(user.userUuid);
            }
        }

        // 3. Create new user
        return this.createOAuthUser(provider, profile);
    }

    static async createOAuthUser(provider, profile) {
        const email = this.getEmailFromProfile(provider, profile);
        const displayName = this.getDisplayName(provider, profile);
        
        // Generate a unique username if needed
        const baseUsername = email ? email.split('@')[0] : `${provider}_${profile.id}`;
        let username = baseUsername;
        let counter = 1;
        
        // Ensure username is unique
        while (await UserDB.findOne({ username })) {
            username = `${baseUsername}${counter++}`;
        }

        const userData = {
            username,
            email,
            nickname: displayName, // Will be updated if nickname is required
            oauth: {
                [provider]: this.normalizeProfile(provider, profile)
            },
            isVerified: true
        };

        return await UserDB.create(userData);
    }
    
    // Helper methods for different providers
    static getEmailFromProfile(provider, profile) {
        switch(provider) {
            case 'google':
            case 'facebook':
                return profile.emails?.[0]?.value;
            case 'discord':
                return profile.email;
            case 'steam':
                return null; // Steam doesn't provide email by default
            default:
                return null;
        }
    }
    
    // Add other helper methods as needed
}
```

### 3. Passport Configuration

Create a passport configuration for each provider:

```javascript
// config/passport.js
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as DiscordStrategy } from 'passport-discord';
import SteamStrategy from 'passport-steam';
import { OAuthService } from '../services/OAuthService.js';

// Google
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
    scope: ['profile', 'email'],
    passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
    try {
        const user = await OAuthService.findOrCreateUser('google', profile);
        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
}));

// Add similar configurations for Facebook, Discord, and Steam
// ...

export default passport;
```

### 4. Routes

Create OAuth routes:

```javascript
// routes/auth/oauth.js
import express from 'express';
import passport from 'passport';
import { userService } from '../../services/UserService.js';
import SessionManager from '../../services/SessionManager.js';

const router = express.Router();

// Generic OAuth handler
const handleOAuthCallback = (provider) => async (req, res, next) => {
    passport.authenticate(provider, async (err, user) => {
        try {
            if (err || !user) {
                return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
            }

            // Check if nickname is required
            if (!user.nickname) {
                const tempToken = SessionManager.createTempToken({
                    userId: user.userUuid,
                    provider,
                    email: user.email
                });
                return res.redirect(
                    `${process.env.FRONTEND_URL}/complete-profile?token=${tempToken}`
                );
            }

            // Create session and redirect
            const sessionToken = SessionManager.createSession(user.userUuid);
            await userService.updateLastLogin(user.userUuid);
            
            res.redirect(`${process.env.FRONTEND_URL}/oauth/callback?token=${sessionToken}`);
        } catch (error) {
            console.error('OAuth callback error:', error);
            res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
        }
    })(req, res, next);
};

// Google OAuth
router.get('/google', passport.authenticate('google'));
router.get('/google/callback', handleOAuthCallback('google'));

// Add similar routes for other providers
// router.get('/facebook', passport.authenticate('facebook'));
// router.get('/facebook/callback', handleOAuthCallback('facebook'));
// ...

export default router;
```

### 5. Complete Profile Endpoint

Add an endpoint to handle profile completion:

```javascript
// routes/auth/profile.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import SessionManager from '../../services/SessionManager.js';
import { UserDB } from '../../models/User.js';

const router = express.Router();

router.post('/complete', [
    body('tempToken').isString(),
    body('nickname').trim().isLength({ min: 3, max: 30 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { tempToken, nickname } = req.body;
        
        // Verify temp token
        const payload = SessionManager.verifyTempToken(tempToken);
        if (!payload) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        // Check if nickname is available
        const existingUser = await UserDB.findOne({ nickname });
        if (existingUser) {
            return res.status(400).json({ error: 'Nickname already taken' });
        }

        // Update user with nickname
        await UserDB.update(
            { userUuid: payload.userId },
            { 
                $set: { 
                    nickname,
                    lastModified: new Date()
                } 
            }
        );

        // Create session
        const sessionToken = SessionManager.createSession(payload.userId);
        
        res.json({ 
            success: true, 
            token: sessionToken 
        });
    } catch (error) {
        console.error('Complete profile error:', error);
        res.status(500).json({ error: 'Failed to complete profile' });
    }
});

export default router;
```

## Frontend Changes

### 1. OAuth Buttons

Add OAuth buttons to your login page:

```jsx
// Login.jsx
import { GoogleLogin } from '@react-oauth/google';

function Login() {
    const handleOAuthLogin = (provider) => {
        window.location.href = `${process.env.REACT_APP_API_URL}/api/auth/${provider}`;
    };

    return (
        <div className="oauth-buttons">
            <button onClick={() => handleOAuthLogin('google')}>
                Continue with Google
            </button>
            <button onClick={() => handleOAuthLogin('facebook')}>
                Continue with Facebook
            </button>
            {/* Add other providers */}
        </div>
    );
}
```

### 2. Complete Profile Component

Create a component for completing the profile:

```jsx
// CompleteProfile.jsx
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';

function CompleteProfile() {
    const [nickname, setNickname] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const tempToken = searchParams.get('token');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const response = await api.post('/api/auth/profile/complete', {
                tempToken,
                nickname
            });

            if (response.data.success) {
                // Store the session token and redirect
                localStorage.setItem('token', response.data.token);
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to complete profile');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!tempToken) {
        return <div>Invalid request. Please try again.</div>;
    }

    return (
        <div className="complete-profile">
            <h2>Complete Your Profile</h2>
            <p>Please choose a nickname to continue</p>
            
            {error && <div className="error">{error}</div>}
            
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="nickname">Nickname:</label>
                    <input
                        id="nickname"
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        required
                        minLength={3}
                        maxLength={30}
                    />
                </div>
                
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Continue'}
                </button>
            </form>
        </div>
    );
}

export default CompleteProfile;
```

## Required Environment Variables

```
# OAuth Providers
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
STEAM_API_KEY=your_steam_api_key

# App URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001

# Session
SESSION_SECRET=your_session_secret
JWT_SECRET=your_jwt_secret
```

## Implementation Notes

1. **Account Linking**:
   - Users can log in with any OAuth provider
   - If the email from a provider matches an existing account's email, the new OAuth provider is linked to that account
   - When a user logs in with a new OAuth provider:
     1. The system checks if an account exists with the same email
     2. If found, it links the new OAuth provider to the existing account
     3. If not found, a new account is created
   - This allows users to log in with any of their linked OAuth providers
   - Users can have multiple OAuth providers linked to the same account

2. **Nickname Requirement**:
   - Users must choose a nickname on first login
   - Nicknames must be unique across the platform
   - Users can change their nickname later in their profile settings

3. **Session Management**:
   - JWT tokens are used for session management
   - Temp tokens are used during the OAuth flow to maintain state

4. **Security Considerations**:
   - Always use HTTPS in production
   - Validate all user input
   - Implement rate limiting on authentication endpoints
   - Use secure, HTTP-only cookies for session storage

## Required Dependencies

```bash
# Backend
npm install passport passport-google-oauth20 passport-facebook passport-discord passport-steam

# Frontend
npm install @react-oauth/google react-facebook-login @react-oauth/facebook @react-oauth/discord
```

## Testing

1. Test each OAuth provider separately
2. Test account linking by logging in with different providers using the same email
3. Test the profile completion flow
4. Test error cases (invalid tokens, duplicate nicknames, etc.)
