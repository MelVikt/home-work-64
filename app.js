import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';
import { connectToMongo } from './data/db.js';

import homeRouter from './routes/home.js';
import usersRouter from './routes/users.js';
import articlesRouter from './routes/articles.js';
import themeRouter from './routes/theme.js'; 
import protectedRouter from './routes/protected.js';
import authRouter from './routes/auth.js';
import './middlewares/passport-conf.js';
import resetRouter from './routes/reset.js';
import { applyTheme } from './middlewares/theme.js';

dotenv.config();
await connectToMongo();

const app = express();
const PORT = process.env.PORT || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 1000 
  }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(applyTheme);
app.use('/', themeRouter);
app.use('/', authRouter);
app.use('/', homeRouter);
app.use('/users', usersRouter);
app.use('/articles', articlesRouter);
app.use('/protected', protectedRouter);
app.use('/', resetRouter);
app.use('/auth', authRouter);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});



