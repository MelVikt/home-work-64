import express from 'express';
import { randomUUID } from 'crypto';
import Joi from 'joi';
import { db } from '../data/db.js';
import { isAuthenticated } from '../middlewares/auth.js';

const router = express.Router();

const articleSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  content: Joi.string().min(5).required()
});

router.get('/', async (req, res) => {
  try {
    const users = await db.collection('users').find().toArray();

    const allArticles = users.flatMap(user =>
      (user.articles || []).map(article => ({
        ...article,
        userId: user._id.toString(),
        author: user.name
      }))
    );

    res.render('articles', { articles: allArticles, req });
  } catch (err) {
    console.error(err);
    res.status(500).send('Помилка при отриманні статей');
  }
});

router.get('/create', isAuthenticated, (req, res) => {
  res.render('create-article', { req });
});

router.post('/create', isAuthenticated, async (req, res) => {
  const { error, value } = articleSchema.validate(req.body);
  if (error) {
    return res.status(400).send('Невірні дані: ' + error.details[0].message);
  }

  try {
    const userId = req.user._id;

    const newArticle = {
      id: randomUUID(),
      title: value.title,
      content: value.content
    };

    await db.collection('users').updateOne(
      { _id: userId },
      { $push: { articles: newArticle } }
    );

    res.redirect(`/users/${userId.toString()}`);
  } catch (err) {
    console.error('Помилка при створенні статті:', err);
    res.status(500).send('Внутрішня помилка сервера');
  }
});

router.get('/:id', async (req, res) => {
  const articleId = req.params.id;

  try {
    const users = await db.collection('users').find({ 'articles.id': articleId }).toArray();

    if (users.length === 0) {
      return res.status(404).send('Статтю не знайдено');
    }

    const user = users[0];
    const article = user.articles.find(a => a.id === articleId);

    res.render('article', {
      article,
      user,
      from: req.query.from || 'list',
      req,
      theme: req.cookies.theme || 'light'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Помилка сервера');
  }
});

router.get('/:id/edit', isAuthenticated, async (req, res) => {
  const articleId = req.params.id;
  const userId = req.user._id;

  try {
    const user = await db.collection('users').findOne({ _id: userId });
    if (!user) return res.status(404).send('Користувача не знайдено');

    const article = (user.articles || []).find(a => a.id === articleId);
    if (!article) return res.status(404).send('Статтю не знайдено');

    res.render('edit-article', { article, req });
  } catch (err) {
    console.error(err);
    res.status(500).send('Помилка сервера');
  }
});

router.post('/:id/edit', isAuthenticated, async (req, res) => {
  const articleId = req.params.id;
  const { error, value } = articleSchema.validate(req.body);
  if (error) {
    return res.status(400).send('Невірні дані: ' + error.details[0].message);
  }

  try {
    const userId = req.user._id;

    await db.collection('users').updateOne(
      { _id: userId, 'articles.id': articleId },
      {
        $set: {
          'articles.$.title': value.title,
          'articles.$.content': value.content
        }
      }
    );

    res.redirect(`/users/${userId.toString()}`);
  } catch (err) {
    console.error('Помилка при оновленні статті:', err);
    res.status(500).send('Внутрішня помилка сервера');
  }
});

router.post('/:id/delete', isAuthenticated, async (req, res) => {
  const articleId = req.params.id;
  const userId = req.user._id;

  try {
    await db.collection('users').updateOne(
      { _id: userId },
      { $pull: { articles: { id: articleId } } }
    );

    res.redirect(`/users/${userId.toString()}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Помилка сервера');
  }
});

export default router;
