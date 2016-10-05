var express = require('express');
var mongoose = require('mongoose');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var proxy = require('proxy-express');
var path = require('path');
var http = require('http');
var https = require('https');
var secure = require('express-secure-only');
var url = require('url');
var fs = require('fs');

var config = {
  'host': process.env.HOST,
  'target': process.env.TARGET,
  'targetScheme': process.env.TARGET_SCHEME,
  'targetPrepend': process.env.TARGET_PREPEND,
  'httpPort': process.env.HTTP_PORT,
  'httpsPort': process.env.HTTPS_PORT,
  'httpsOptions': {
    'key': fs.readFileSync(process.env.KEY_FILE),
    'cert': fs.readFileSync(process.env.CERT_FILE),
    'force': process.env.HTTPS_FORCE
  },
  'dbUri': process.env.DB_URI,
  'sessionSecret': process.env.SESSION_SECRET,
  'oAuthClientId': process.env.OAUTH_CLIENT_ID,
  'oAuthClientSecret': process.env.OAUTH_CLIENT_SECRET,
  'oAuthUrl': process.env.OAUTH_URL,
  'oAuthCallbackUrl': process.env.OAUTH_CALLBACK_URL,
  'secretTokenHeader': process.env.SECRET_TOKEN_HEADER,
  'secretToken': process.env.SECRET_TOKEN,
};

var User = mongoose.model('User', {
  WordpressId: Number
});

mongoose.connect(config.dbUri);

var app = express();

var passport = require('passport'),
  WordpressStrategy = require('passport-wordpress-oauth-server').Strategy;

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  if (config.secretTokenHeader) {
    var secretToken = req.get(config.secretTokenHeader);
    if (secretToken === config.secretToken) {
      return next();
    }
  }
  res.redirect('/auth/wordpress');
}

app.use(cookieParser());
app.use(session({ secret: config.sessionSecret }));
app.use(passport.initialize());
app.use(passport.session());

if (config.httpsOptions.force) { app.use(secure()); }

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
  passport.authorize('wordpress-oauth-server'));

app.get('/auth/wordpress/callback', 
  passport.authorize('wordpress-oauth-server', {
    failureRedirect: '/failure'
  }), function(req, res){
    res.redirect('/');
  }
);

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.use(proxy(config.target, {
  request: {
    prepend: config.targetPrepend
  },
  pre: function(proxyObj, callback) {
    proxyObj.reqOpts.url = url.resolve(config.targetScheme + '://' +
        config.target, config.targetPrepend + proxyObj.req.url);
    ensureAuthenticated(proxyObj.req, proxyObj.res, callback);
  }
}));

http.createServer(app).listen(config.httpPort);
https.createServer(config.httpsOptions, app).listen(config.httpsPort);
