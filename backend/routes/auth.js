const express = require('express');
const router = express.Router();
const Mother = require('../models/Mother');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @route   POST /auth/google/verify
// @desc    Verify Google Google identity token from React Native
router.post('/google/verify', async (req, res, next) => {
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).json({ error: 'idToken is required' });
    }

    try {
        // 1. Verify token cryptographically with Google
        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const googleId = payload['sub'];
        const email = payload['email'];
        const name = payload['name'];

        // 2. Find or create user
        let user = await Mother.findOne({ googleId: googleId });

        if (!user) {
            user = await new Mother({
                googleId: googleId,
                name: name,
                email: email,
            }).save();
        }

        // 3. Log user in to establish Express Session natively
        req.login(user, (err) => {
            if (err) {
                console.error("Login Error:", err);
                return next(err);
            }
            return res.json({ success: true, user: user });
        });

    } catch (error) {
        console.error("Google Auth Verification Error:", error);
        res.status(401).json({ error: 'Invalid Google Token' });
    }
});

// @route   GET /auth/logout
// @desc    Logout user
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

// @route   GET /auth/current_user
// @desc    Get current logged in user details
router.get('/current_user', (req, res) => {
    res.send(req.user);
});

module.exports = router;
