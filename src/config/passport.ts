import passport from 'passport';
const LocalStrategy = require('passport-local').Strategy;
import * as bcrypt from 'bcrypt-nodejs';

import { User } from '../models/User';
import { Request } from 'express';

export let local = passport.use('local',
  new LocalStrategy({passReqToCallback : true}, async (req: Request, username: string, password: string, done: any) => {
    const user = await User.findOne({ where: { username: username } });
    if (user) {
      if (bcrypt.compareSync(password, user.password)) {
        return done(null, user);
      }
    } else {
      const user = new User({
        username: username,
        password: bcrypt.hashSync(password)
      });
      await user.save();
      console.log(user);
      return done(null, user);
    }
    return done(null, false, {message: 'Invalid Username or Password'});
  })
);

passport.serializeUser(function(user: User, done) {
  console.log('tried to serialize');
  done(null, user.id);
});

passport.deserializeUser(function(id: number, done) {
  User.findById(id).then(user => {
    done(null, user);
  });
});

export default passport;
