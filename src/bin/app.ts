import express = require("express");

// Our Express APP config
const app = express();
const path = require('path');
require('dotenv').config();

// set dev views
if(app.get('env') === 'development') {
    app.set('views', path.join(__dirname, '../../src/views'));
}
app.set('view engine', 'pug');
app.set("port", process.env.PORT || 3002);


// API Endpoints
app.get('/', (req, res) => {
    res.render('index.pug'); 
})

import * as spotfiyController from '../controllers/spotifyController';

app.get('/auth', spotfiyController.auth);


// export our app
export default app;