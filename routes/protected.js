import express from 'express';

const router = express.Router();

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

router.get('/', ensureAuthenticated, (req, res) => {
  res.send(`Це захищена сторінка. Привіт, ${req.user.name}!`);
});

export default router;