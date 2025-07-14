import express from 'express';
import { ObjectId } from 'mongodb';
import { db } from '../data/db.js';
import { isAuthenticated } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const users = await db.collection('users').find().toArray();
    res.render('users', { users, req });
  } catch (err) {
    console.error(err);
    res.status(500).send('Помилка сервера');
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!ObjectId.isValid(userId)) {
      return res.status(404).render('error', { req });
    }
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).render('error', { req });
    }
    user.id = user._id.toString();
    res.render('user', { user, articles: user.articles || [], req });
  } catch (err) {
    console.error(err);
    res.status(500).send('Помилка сервера');
  }
});

router.get('/:userId/articles/:articleId', async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!ObjectId.isValid(userId)) {
      return res.status(404).send('User not found');
    }
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).send('User not found');
    }

    const articleId = req.params.articleId;
    const article = (user.articles || []).find(a => a.id.toString() === articleId);
    if (!article) {
      return res.status(404).send('Article not found');
    }

    user.id = user._id.toString();
    const from = req.query.from || 'user';

    res.render('article', { article, user, from, req, theme: req.cookies.theme || 'light' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Помилка сервера');
  }
});

router.post('/delete', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id;

    await db.collection('users').deleteOne({ _id: userId });

    req.logout(err => {
      if (err) {
        console.error('Помилка при logout після видалення:', err);
      }
      res.clearCookie('connect.sid');
      res.redirect('/');
    });
  } catch (err) {
    console.error('Помилка при видаленні користувача:', err);
    res.status(500).send('Помилка при видаленні акаунту');
  }
});

export default router;
