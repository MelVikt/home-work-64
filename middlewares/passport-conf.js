import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { db } from '../data/db.js';
import bcrypt from 'bcrypt';

passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    if (!db) throw new Error('База даних не підключена');
    const user = await db.collection('users').findOne({ username });
    if (!user) return done(null, false, { message: 'Користувача не знайдено' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return done(null, false, { message: 'Невірний пароль' });

    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID, 
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:4000/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    if (!db) throw new Error('База даних не підключена');
    let user = await db.collection('users').findOne({ googleId: profile.id });

    if (!user) {
      const newUser = {
        name: profile.displayName,
        username: profile.emails[0].value,
        googleId: profile.id,
        photo: profile.photos[0]?.value || '',
        articles: [],
        bio: '',
        password: null,
        resetToken: null,
        resetTokenExp: null
      };

      const result = await db.collection('users').insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };
    }

    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.username);
});

passport.deserializeUser(async (username, done) => {
  try {
    if (!db) throw new Error('База даних не підключена');
    const user = await db.collection('users').findOne({ username });
    done(null, user || false);
  } catch (err) {
    done(err);
  }
});
