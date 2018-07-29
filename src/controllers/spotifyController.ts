import { Request, Response } from 'express';
import { resolve } from 'dns';
import { NextFunction } from '../../node_modules/@types/express-serve-static-core';

const cors = require('cors');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');
const request = require('request');
const rp = require('request-promise');
rp.options.simple = false;

const redirect_uri = process.env.SPOTIFY_REDIRECT ;
const client_id = process.env.SPOTIFY_CLIENT;
const client_secret = process.env.SPOTIFY_SECRET;
const stateKey = 'spotify_auth_state';

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
const generateRandomString = function(length: number) {
  let text = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

const asyncMiddleware = (fn: any) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
/**
 * GET /
 * Home page.
 */
export let auth = (req: Request, res: Response) => {
  const state = generateRandomString(16);
  res.cookie(stateKey, state);

  const scope = 'user-read-private user-read-email user-top-read';
  res.redirect(
    'https://accounts.spotify.com/authorize?' +
      querystring.stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
      })
  );
};

/**
 * Generate auth token from callback
 * @param req
 * @param res
 */
export let authCallback = (req: Request, res: Response) => {
  // snag vars from query params
  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect(
      '/' +
        querystring.stringify({
          error: 'state_mismatch'
        })
    );
  } else {
    res.clearCookie(stateKey);
    const authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        Authorization:
          'Basic ' +
          new Buffer(client_id + ':' + client_secret).toString('base64')
      },
      json: true
    };
    // get the auth token
    request.post(authOptions, function(error: any, response: any, body: any) {
      if (!error && response.statusCode === 200) {
        const access_token = body.access_token;
        const refresh_token = body.refresh_token;
        res.cookie('auth_token', access_token);
        res.cookie('refresh_token', refresh_token);
        res.redirect('/login');
      }
    });
  }
};

export let authRefresh = async (req: Request, res: Response) => {
  // requesting access token from refresh token
  return new Promise(async (resolve, reject) => {
    const refresh_token = req.cookies['refresh_token'];
    console.log(refresh_token);
    const authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      headers: {
        Authorization:
          'Basic ' +
          new Buffer(client_id + ':' + client_secret).toString('base64')
      },
      form: {
        grant_type: 'refresh_token',
        refresh_token: refresh_token
      },
      json: true
    };
    const response = await rp.post(authOptions);
    console.log(response);
    if (response) {
      console.log('got auth');
      const access_token = response.access_token;
      resolve(access_token);
    } else {
      console.log('You suck');
      reject('You suck');
    }
  });
};

export let spotifyLogin = (req: Request, res: Response) => {
  const token: number = req.cookies['auth_token'];

  const options = {
    url: 'https://api.spotify.com/v1/me',
    headers: { Authorization: 'Bearer ' + token },
    json: true
  };

  request.get(options, (error: any, response: any, body: any) => {
    console.log(response);
    if (!error && response.statusCode === 200) {
      console.log(body);
      res.render('profile.pug', { user: body });
    } else {
      res.render('index.pug');
    }
  });
};

export let getTopSongs = async (req: Request, res: Response) => {
  console.log('hit route...');
  try {
    let token = req.cookies['auth_token'];

    const options = {
      url: 'https://api.spotify.com/v1/me/top/tracks',
      headers: { Authorization: 'Bearer ' + token },
      json: true,
      simple: false
    };

    const response = await rp.get(options);

    if (response) {
      console.log(response);
      res.render('topsongs.pug', { songs: response.items });
    } else {
      // refresh auth token and try again
      token = await authRefresh(req, res);
      console.log('This is the token: ' + token);
      const options = {
        url: 'https://api.spotify.com/v1/me/top/tracks',
        headers: { Authorization: 'Bearer ' + token },
        simple: false,
        json: true
      };
      const response = await rp.get(options);
      res.render('topsongs.pug', { songs: response.items });
    }
  } catch (e) {
    console.log('You fucked up');
    res.redirect('/');
  }
};
