var express = require('express');
var mongoose = require('mongoose');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var proxy = require('proxy-express');
var path = require('path');

var config = {
  'target': process.env.TARGET,
  'port': process.env.PORT,
  'dbUri': process.env.DB_URI,
  'sessionSecret': process.env.SESSION_SECRET,
  'oAuthClientId': process.env.OAUTH_CLIENT_ID,
  'oAuthClientSecret': process.env.OAUTH_CLIENT_SECRET,
  'oAuthUrl': process.env.OAUTH_URL,
  'oAuthCallbackUrl': process.env.OAUTH_CALLBACK_URL
};

var User = mongoose.model('User', {
  WordpressId: Number
});

mongoose.connect(config.dbUri);

var app = express();

var passport = require('passport'),
  WordpressStrategy = require('passport-wordpress-oauth-server').Strategy;

app.use(cookieParser());
app.use(session({ secret: config.sessionSecret }));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
    done(null, user._id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user){
        if(!err) done(null, user);
        else done(err, null);
    })
});

passport.use(new WordpressStrategy({
    clientID: config.oAuthClientId,
    clientSecret: config.oAuthClientSecret,
    wordpressUrl: config.oAuthUrl,
    callbackURL: config.oAuthCallbackUrl
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOne({ WordpressId: profile.id }, function(err, user) {
      if(err) { console.log(err); }
      if(!err && user != null) {
        done(null, user);
      } else {
        var user = new User({
          WordpressId: profile.id
        });
        user.save(function(err) {
          if(err) {
            console.log(err);
          } else {
            done(null, user);
          }
        });
      }
    });
  }
));

app.get('/auth/wordpress',
  passport.authenticate('wordpress-oauth-server'),
  function(req, res){
  });

app.get('/auth/wordpress/callback', 
  passport.authenticate('wordpress-oauth-server', {
    failureRedirect: '/failure'
  }), function(req, res){
    return res.redirect('/');
  }
);

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.use(proxy(config.target, {
  pre: function(proxyObj, callback) {
    ensureAuthenticated(proxyObj.req, proxyObj.res, callback);
  }
}));

app.listen(config.port);

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/auth/wordpress');
}
