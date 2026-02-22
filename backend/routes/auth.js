const express = require('express');
const passport = require('passport');
const router = express.Router();
require('../config/passport'); // Initialize passport strategy

// @route   GET /auth/google
// @desc    Auth with Google
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

// @route   GET /auth/google/callback
// @desc    Google auth callback
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login-failed' }),
    (req, res) => {
        // Successful authentication, redirect to frontend.
        res.redirect(`${process.env.FRONTEND_URL}/login-success`);
    }
);

// @route   GET /auth/logout
// @desc    Logout user
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.redirect(process.env.FRONTEND_URL);
    });
});

// @route   GET /auth/current_user
// @desc    Get current logged in user details
router.get('/current_user', (req, res) => {
    res.send(req.user);
});

module.exports = router;
