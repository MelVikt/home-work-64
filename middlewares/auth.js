import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { db } from '../data/db.js';

dotenv.config();
const SECRET_KEY = process.env.SECRET_KEY;

export async function userFromToken(req, res, next) {
  const token = req.cookies.token;
  if (token) {
    try {
      const payload = jwt.verify(token, SECRET_KEY);
      if (!db) {
        throw new Error('База даних не підключена');
      }
      const user = await db.collection('users').findOne({ name: payload.name });
      if (user) {
        req.user = user;
      }
    } catch (err) {
      res.clearCookie('token');
    }
  }
  next();
}

export function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}
