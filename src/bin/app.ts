import express = require('express');

// Our Express APP config
const app = express();
const path = require('path');
const expressWinston = require('express-winston');
const winston = require('winston');
const cors = require('cors');

const passport = require('passport');
const session = require('express-session');
const flash = require('express-flash');

const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

import { Sequelize } from 'sequelize-typescript';

require('dotenv').config();

app
  .use(cors())
  .use(cookieParser())
  .use(bodyParser.urlencoded({ extended: false }));

// set up db
const sequelize = new Sequelize({
  database: 'myfavoritepart',
  dialect: 'mysql',
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  modelPaths: [__dirname + '/models'],
  operatorsAliases: false
});

// set dev views
if (app.get('env') === 'development') {
  app.set('views', path.join(__dirname, '../../src/views'));
}
app.set('view engine', 'pug');
app.set('port', process.env.PORT || 8000);

// Logging
// app.use(
//   expressWinston.logger({
//     transports: [
//       new winston.transports.Console({
//         json: true,
//         colorize: true
//       })
//     ]
//   })
// );

// API Endpoints
app.get('/', (req, res) => {
  res.render('index.pug');
});

app.use(
  session({
    resave: true,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

import * as spotfiyController from '../controllers/spotifyController';
import * as userController from '../controllers/userController';
import { constants } from 'zlib';

// spotify routes
app.get('/auth', spotfiyController.auth);
app.get('/callback', spotfiyController.authCallback);
app.get('/auth/refresh', spotfiyController.authRefresh);
app.get('/top', spotfiyController.getTopSongs);

// login routes
app.get('/login', spotfiyController.spotifyLogin);
app.post('/login', userController.loginPost);

// export our app
export default app;
