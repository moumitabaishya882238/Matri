const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Mother = require('../models/Mother');
const dotenv = require('dotenv');

dotenv.config();

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const mother = await Mother.findById(id);
        done(null, mother);
    } catch (err) {
        done(err, null);
    }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user already exists in our database
            let currentUser = await Mother.findOne({ googleId: profile.id });

            if (currentUser) {
                // already have the user
                done(null, currentUser);
            } else {
                // if not, create user in our db
                const newUser = await new Mother({
                    googleId: profile.id,
                    name: profile.displayName,
                    email: profile.emails[0].value,
                }).save();
                done(null, newUser);
            }
        } catch (err) {
            done(err, null);
        }
    }
));
