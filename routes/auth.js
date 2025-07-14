import express from 'express';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import passport from 'passport';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { db } from '../data/db.js';

dotenv.config();

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,       
    pass: process.env.GMAIL_PASS       
  }
});

router.get('/register', (req, res) => {
  res.render('register', { req });
});

router.post('/register', async (req, res) => {
  const { username, password, name } = req.body;

  if (!name || !username || !password) {
    return res.status(400).send('Усі поля обовʼязкові');
  }

  try {
    const existingUser = await db.collection('users').findOne({ username });
    if (existingUser) {
      return res.status(400).send('Користувач уже існує');
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    await db.collection('users').insertOne({
      name,
      username,
      password: hash,
      bio: '',
      articles: [],
      resetToken: null,
      resetTokenExp: null
    });

    res.redirect('/login');
  } catch {
    res.status(500).send('Помилка сервера');
  }
});

router.get('/login', (req, res) => {
  const error = req.session.messages?.[0];
  req.session.messages = []; 
  res.render('login', { req, error });
});

router.post('/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureMessage: true
  })
);

router.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

router.get('/reset-request', (req, res) => {
  res.render('reset-request');
});

router.post('/reset-request', async (req, res) => {
  const { email } = req.body;
  const user = await db.collection('users').findOne({ username: email });

  if (!user) {
    return res.status(404).send('Користувача не знайдено');
  }

  const token = crypto.randomBytes(32).toString('hex');
  await db.collection('users').updateOne(
    { username: email },
    { $set: { resetToken: token, resetTokenExp: Date.now() + 3600000 } }
  );

  await transporter.sendMail({
    from: '"My App" <noreply@myapp.com>',
    to: email,
    subject: "Відновлення пароля",
    html: `
      <p>Щоб скинути пароль, натисніть:</p>
      <a href="http://localhost:4000/auth/reset-password/${token}">Відновити пароль</a>
    `
  });

  res.send('Інструкція для скидання пароля надіслана на email.');
});

router.get('/forgot-password', (req, res) => {
  res.render('forgot-password', { req });
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await db.collection('users').findOne({ username: email });

  if (!user) {
    return res.status(404).send('Користувача не знайдено');
  }

  const token = crypto.randomBytes(32).toString('hex');
  await db.collection('users').updateOne(
    { username: email },
    { $set: { resetToken: token, resetTokenExp: Date.now() + 3600000 } }
  );

  try {
    await transporter.sendMail({
      from: `"My App" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Відновлення пароля",
      html: `
        <p>Щоб скинути пароль, натисніть на посилання:</p>
        <a href="http://${req.headers.host}/auth/reset-password/${token}">Відновити пароль</a>
      `
    });

    res.send('Інструкція для скидання пароля надіслана на email.');
  } catch {
    res.status(500).send('Помилка при відправці листа');
  }
});

router.get('/reset-password/:token', async (req, res) => {
  const user = await db.collection('users').findOne({
    resetToken: req.params.token,
    resetTokenExp: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).send('Недійсний або прострочений токен');
  }

  res.render('reset-password', { token: req.params.token });
});

router.post('/reset-password/:token', async (req, res) => {
  const user = await db.collection('users').findOne({
    resetToken: req.params.token,
    resetTokenExp: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).send('Недійсний або прострочений токен');
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(req.body.password, salt);

  await db.collection('users').updateOne(
    { resetToken: req.params.token },
    { $set: { password: hash }, $unset: { resetToken: "", resetTokenExp: "" } }
  );

  res.redirect('/login');
});

router.get('/auth/forgot-password', (req, res) => {
  res.render('forgot-password', { theme: req.theme || 'light' });
});

router.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await db.collection('users').findOne({ username: email });

  if (!user) {
    return res.status(404).send('Користувача не знайдено');
  }

  const token = crypto.randomBytes(32).toString('hex');
  await db.collection('users').updateOne(
    { username: email },
    { $set: { resetToken: token, resetTokenExp: Date.now() + 3600000 } }
  );

  await transporter.sendMail({
    from: '"My App" <noreply@myapp.com>',
    to: email,
    subject: "Відновлення пароля",
    html: `
      <p>Щоб скинути пароль, натисніть:</p>
      <a href="http://localhost:4000/auth/reset-password/${token}">Відновити пароль</a>
    `
  });

  res.send('Інструкція для скидання пароля надіслана на email.');
});

router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    successRedirect: '/'
  })
);

export default router;
