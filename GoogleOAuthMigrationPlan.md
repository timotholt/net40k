# Google OAuth Migration Plan for net40k

This plan provides step-by-step, human-readable instructions to migrate your authentication system to use Google OAuth (with JWT for your app session). It also includes steps for testing, and for "forgetting"/resetting your Google login so you can keep testing the flow repeatedly.

---

## 1. Preparation
- [ ] Ensure you are on a safe working branch (e.g., `Colyseus`)
- [ ] Go to [Google Cloud Console](https://console.developers.google.com/)
- [ ] Create a new project (or select an existing one)
- [ ] Enable the "OAuth consent screen" and configure it
- [ ] Create OAuth 2.0 credentials
- [ ] Add `http://localhost:3000/auth/google/callback` (or your dev port) as an authorized redirect URI
- [ ] Note your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- [ ] Add these to your `.env` file:
  ```
  GOOGLE_CLIENT_ID=your_client_id
  GOOGLE_CLIENT_SECRET=your_client_secret
  JWT_SECRET=your_jwt_secret
  ```

---

## 2. Install Dependencies
- [ ]
  ```
  npm install passport passport-google-oauth20 jsonwebtoken
  ```

---

## 3. Configure Passport.js
- [ ] Create or update your Passport config (e.g., `backend/services/auth.js`):
  - Import and configure GoogleStrategy
  - In the strategy callback, find or create the user in your DB
  - Call `done(null, user)`

---

## 4. Add Auth Routes
- [ ] Add route to start Google login:
  ```js
  app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  ```
- [ ] Add callback route:
  ```js
  app.get('/auth/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/' }),
    (req, res) => {
      // Generate JWT, send to client (redirect or JSON)
    }
  );
  ```
- [ ] In callback, generate JWT and send to client (e.g., as a query param, cookie, or JSON)

---

## 5. Frontend Integration
- [ ] Add a "Login with Google" button that hits `/auth/google`
- [ ] After login, extract JWT from redirect/callback
- [ ] Store JWT and use for API/Colyseus authentication

---

## 6. Forgetting/Resetting Google OAuth for Testing
- [ ] To "forget" Google login and test again:
  - Log out in your app (delete stored JWT)
  - Visit https://myaccount.google.com/permissions
  - Remove your app from the list of connected apps
  - Next login, Google will prompt for consent again
- [ ] (Optional) Add a "logout" endpoint in your backend to clear cookies or tokens

---

## 7. Testing
- [ ] Test login flow end-to-end
- [ ] Test repeated logins/logouts
- [ ] Test "forgetting" Google OAuth and re-consenting
- [ ] Test JWT authentication with Colyseus and API endpoints

---

## 8. Documentation & Rollback
- [ ] Document the new flow for future reference
- [ ] If anything breaks, roll back to `backup-after-cleanup` branch

---

## 9. Joke (for sanity)
> Why did the developer keep forgetting Google OAuth?
> Because they loved testing new beginnings!

---

_Keep this file updated as you go. If you get stuck, let me know which step you’re on!_
