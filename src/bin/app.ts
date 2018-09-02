import express = require('express');
import { Response, Request } from 'express';

// Our Express APP config
const app = express();
const path = require('path');
const expressWinston = require('express-winston');
const winston = require('winston');
const cors = require('cors');

const passport = require('passport');
const session = require('express-session');
const flash = require('connect-flash');

const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

import { Sequelize } from 'sequelize-typescript';
import { User } from '../models/User';

require('dotenv').config();

app.use(cors())
    .use(cookieParser(process.env.SESSION_SECRET))
    .use(bodyParser.urlencoded({ extended: false }));

app.use(cookieParser(process.env.SESSION_SECRET));

const cookieExpirationDate = new Date();
const cookieExpirationDays = 365;
cookieExpirationDate.setDate(cookieExpirationDate.getDate() + cookieExpirationDays);

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: true,
        saveUninitialized: true,
        cookie: {
            httpOnly: true,
            expires: cookieExpirationDate,
            secure: false
        }
    })
);
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

app.get('*', (req, res, next) => {
    res.locals.user = req.user || null;
    next();
});

// set up db
export const sequelize = new Sequelize({
    database: 'myfavoritepart',
    dialect: 'mysql',
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    host: process.env.DB_HOST,
    modelPaths: ['../models'],
    operatorsAliases: false,
    logging: false
    // logging: app.get('env') === 'development' ? console.log : false
});

sequelize.addModels([User]);

// sequelize.sync();

// set dev views
if (app.get('env') === 'development') {
    app.set('views', path.join(__dirname, '../../src/views'));
    app.use('/public', express.static(path.join(__dirname, '../../src/public')));
} else {
    app.set('views', path.join(__dirname, '../views'));
    app.use('/public', express.static(path.join(__dirname, '../public')));
}
app.set('view engine', 'pug');
app.set('port', process.env.PORT || 8000);

// API Endpoints
app.get('/', (req: Request, res: Response) => {
    if (req.user) {
        res.render('index.pug');
    } else {
        res.render('login.pug');
    }
});

import * as spotfiyController from '../controllers/spotifyController';
import * as userController from '../controllers/userController';

// spotify routes
app.get('/auth', spotfiyController.auth);
app.get('/callback', spotfiyController.authCallback);
app.get('/auth/refresh', spotfiyController.authRefresh);
app.get('/topplaylist', spotfiyController.topPlaylist);
app.get('/top', spotfiyController.getTopSongs);

// login routes
app.get('/login', userController.loginGet);
app.post('/login', userController.loginPost);
app.get('/profile', userController.profile);

// export our app
export default app;
