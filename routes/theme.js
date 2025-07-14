import express from 'express';

const router = express.Router();

router.post('/toggle-theme', (req, res) => {
  const validThemes = ['light', 'dark'];
  const current = req.cookies.theme;
  const normalizedCurrent = validThemes.includes(current) ? current : 'light';
  const next = normalizedCurrent  === 'dark' ? 'light' : 'dark';
  res.cookie('theme', next, { 
    maxAge: 30 * 60 * 1000,
    httpOnly: false,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  });

  const returnTo = req.body.returnTo || '/';
  res.redirect(returnTo);
});

export default router;