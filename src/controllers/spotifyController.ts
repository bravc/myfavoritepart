import { Request, Response } from 'express';
import * as spotifyService from '../services/spotifyService';
import { NextFunction } from '../../node_modules/@types/express-serve-static-core';

const cors = require('cors');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');
const request = require('request');
const rp = require('request-promise');

const redirect_uri = process.env.SPOTIFY_REDIRECT;
const client_id = process.env.SPOTIFY_CLIENT;
const client_secret = process.env.SPOTIFY_SECRET;
const REFRESH_TOKEN = 'refresh_token';
const AUTH_TOKEN = 'auth_token';
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
        
      }
    });
  }
};

export let authRefresh = async (req: Request, res: Response) => {
  const refresh_token = req.cookies[REFRESH_TOKEN];
  // TODO: get refresh token from db
  return await spotifyService.refreshAuth(refresh_token);
};

/**
 * Get user details from spotify
 * @param req Request
 * @param res Response
 */
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
  // TODO get auth from db
  const auth_token = req.cookies[AUTH_TOKEN];

  const time_range = req.query.timerange;

  if (spotifyService.allowedRanges.includes(time_range)) {
    const topSongs = await spotifyService.topSongs(auth_token, time_range);

    res.render('topsongs.pug', { songs: topSongs });
  } else {
    res.status(403).send('Query string not allowed');
  }
};
