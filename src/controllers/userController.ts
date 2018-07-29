import { Request, Response } from "express";


export let loginPost = (req: Request, res: Response) => {
    let body: Array<any> = req.body;
    console.log(body);
    res.send(body);
}

export let loginGet = (req: Request, res: Response) => {
    res.render('login.pug');
}

export let profile = (req: Request, res: Response) => {
    res.render('profile.pug', {user: req.user});
}