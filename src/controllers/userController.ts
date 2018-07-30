import { Request, Response } from 'express';
import passport from '../config/passport';

export let loginPost = passport.authenticate('local', {
        successRedirect: '/auth',
        failureRedirect: '/',
        failureFlash : true
});


export let loginGet = (req: Request, res: Response) => {
    res.render('login.pug');
};

export let profile = (req: Request, res: Response) => {
    res.render('profile.pug');
};