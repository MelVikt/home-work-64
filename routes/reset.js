import nodemailer from 'nodemailer' 
import express from 'express'

const router = express.Router(); 
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,     
    pass: process.env.GMAIL_PASS      
  }
});

router.get('/reset', (req, res) => {
  res.render('reset-request', { req });
});

router.post('/reset', (req, res) => {
  const { username } = req.body;
  const user = users.find(u => u.username === username);

  if (!user) return res.status(400).send('Користувача не знайдено');

  const token = crypto.randomBytes(20).toString('hex');
  user.resetToken = token;

  const resetUrl = `http://localhost:${process.env.PORT || 4000}/reset/${token}`;
  
transporter.sendMail({
  to: user.username,
  subject: 'Відновлення пароля',
  html: `<p>Натисніть <a href="${resetUrl}">тут</a>, щоб скинути пароль.</p>`
}, (err, info) => {
  if (err) {
    console.error('Помилка надсилання:', err);
    return res.status(500).send('Не вдалося надіслати листа');
  } else {
    console.log('Email надіслано:', info.response);
    res.send('Лист надіслано! Перевірте пошту.');
  }
});
  res.send('Лист надіслано! Перевірте пошту.');
});

router.get('/reset/:token', (req, res) => {
  const user = users.find(u => u.resetToken === req.params.token);
  if (!user) return res.status(400).send('Недійсний токен');

  res.render('reset-password', { token: req.params.token, req });
});

router.post('/reset/:token', async (req, res) => {
  const user = users.find(u => u.resetToken === req.params.token);
  if (!user) return res.status(400).send('Токен недійсний або застарілий');

  const bcrypt = await import('bcrypt');
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(req.body.password, salt);

  user.password = hash;
  user.resetToken = null;

  res.redirect('/login');
});

export default router;