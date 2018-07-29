import { resolve } from 'path';
import { User } from '../models/User';
import * as bcrypt from 'bcrypt-nodejs';
const rp = require('request-promise');
const querystring = require('querystring');

export const allowedRanges: string[] = ['long_term', 'medium_term', 'short_term'];

/**
 * Use refresh token to update auth
 *
 * @param refresh_token number
 */
export let refreshAuth = async (refresh_token: number): Promise<any> => {
    return new Promise(async (resolve, reject) => {
        const authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            headers: {
                Authorization:
                    'Basic ' +
                    new Buffer(process.env.SPOTIFY_CLIENT + ':' + process.env.SPOTIFY_SECRET).toString('base64')
            },
            form: {
                grant_type: 'refresh_token',
                refresh_token: refresh_token
            },
            json: true
        };
        // atempt to get auth
        const response = await rp.post(authOptions);

        // if response is okay, return the token
        if (response) {
            const access_token = response.access_token;
            resolve(access_token);
        } else {
            reject('Failed to refresh auth');
        }
    });
};

/**
 * Get a users tops songs with optional params
 *
 * @param auth_token number
 */
export let topSongs = async (auth_token: number, time_range: string): Promise<any> => {
    return new Promise(async (resolve, reject) => {
        // add params
        const params = querystring.stringify({
            time_range
        });

        const options = {
            url: 'https://api.spotify.com/v1/me/top/tracks?' + params,
            headers: { Authorization: 'Bearer ' + auth_token },
            json: true,
            simple: false
        };
        const response = await rp.get(options);

        if (response) {
            resolve(response.items);
        }
    });
};

/**
 * Login and create new user
 *
 * @param auth_token number
 * @param refresh_token number
 */
export let login = async (auth_token: number, refresh_token: number) => {
    return new Promise(async (resolve, reject) => {
        const options = {
            url: 'https://api.spotify.com/v1/me',
            headers: { Authorization: 'Bearer ' + auth_token },
            json: true
        };

        const response = await rp.get(options);

        if (response) {
            const user = new User({
                first_name: response.display_name,
                last_name: '',
                auth_token: bcrypt.hashSync(String(auth_token)),
                refresh_token: bcrypt.hashSync(String(refresh_token))
            });
            user.save();
            resolve(user);
        } else {
            reject('Unable to create user in db');
        }
    });
};

/**
 * Create a new playlist
 *
 * @param auth_token number
 */
export let makePlaylist = (auth_token: number, user_id: number): Promise<any> => {
    return new Promise(async (resolve, reject) => {
        const options = {
            url: `https://api.spotify.com/v1/users/${user_id}/playlists`,
            headers: { Authorization: 'Bearer ' + auth_token },
            json: true,
            simple: false,
            body: {
                name: 'Top songs',
                description: 'Your top songs'
            }
        };

        const response = rp.post(options);

        if (response) {
            resolve(response);
        } else {
            reject('Could not make new playlist');
        }
    });
};

export let makeTopSongsPlaylist = (auth_token: number, user_id: number, time_range: string) => {
    return new Promise(async (resolve, reject) => {
        const topsongs = await topSongs(auth_token, time_range);
        const newPlaylist = await makePlaylist(auth_token, user_id);

        const songs = [];
        for (let i = 0; i < topsongs.length; i++) {
            songs.push(topsongs[i].uri);
        }

        const options = {
            url: `https://api.spotify.com/v1/users/${user_id}/playlists/${newPlaylist.id}/tracks`,
            headers: { Authorization: 'Bearer ' + auth_token },
            resolveWithFullResponse: true,
            json: true,
            body: {
                uris: songs
            }
        };

        const response = rp.post(options);

        if (response) {
            resolve(response);
        } else {
            reject('Failed to add songs');
        }
    });
};
