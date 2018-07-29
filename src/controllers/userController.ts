import { Request, Response } from 'express';
import passport from 'passport';
import { local } from '../config/passport';



export let loginPost = passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/',
        failureFlash : true
});

export let loginGet = (req: Request, res: Response) => {
    res.render('login.pug');
};

export let profile = (req: Request, res: Response) => {
    res.render('profile.pug', {user: req.user});
};