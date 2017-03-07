"use strict";

// NPM modules
var express = require("express");
var passport = require("passport");
var GitLabStrategy = require("passport-gitlab2");
var GoogleStrategy = require("passport-google-oauth20");
var cookieParser = require("cookie-parser");
var cookieSession = require("cookie-session");
var requireEnv = require("require-environment-variables");

var authHelpers = require("./authHelpers");

function initAuth(app) {
    if (!process.env.AUTH_COOKIE_ENCRYPTION_KEY) {
        app.use("/login", function (req, res, next) {
            // Login not available if not defined
            res.status(404).end();
        });
        return;
    }
    var requiredVars = [];

    if (process.env.GITLAB_APP_ID) {
        requiredVars = requiredVars.concat(["GITLAB_APP_ID", "GITLAB_APP_SECRET", "GITLAB_CALLBACK_URL"]);
    }
    if (process.env.GOOGLE_CLIENT_ID) {
        requiredVars = requiredVars.concat(["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_CALLBACK_URL"]);
    }
    if (!process.env.GITLAB_APP_ID && !process.env.GOOGLE_CLIENT_ID) {
        console.log("Must provide GOOGLE_CLIENT_ID and/or GITLAB_APP_ID if you want authentication support.");
        requiredVars = requiredVars.concat(["GOOGLE_CLIENT_ID", "GITLAB_APP_ID"]);
    }

    // Check if we got the necessary info from the environment, otherwise fail directly!
    requireEnv(requiredVars);

    app.use(cookieParser(process.env.AUTH_COOKIE_ENCRYPTION_KEY));
    app.use(cookieSession({keys: [process.env.AUTH_COOKIE_ENCRYPTION_KEY], resave: false, saveUninitialized: false}));

    passport.serializeUser(function (user, done) {
        done(null, user);
    });
    passport.deserializeUser(function (obj, done) {
        done(null, obj);
    });

    var gitLabSupported = false;
    var googleSupported = false;

    if (process.env.GITLAB_APP_ID && process.env.GITLAB_APP_SECRET) {
        passport.use(new GitLabStrategy({
            "baseURL": process.env.GITLAB_URL,
            "clientID": process.env.GITLAB_APP_ID,
            "clientSecret": process.env.GITLAB_APP_SECRET,
            "callbackURL": process.env.GITLAB_CALLBACK_URL
        },
                function (accessToken, refreshToken, profile, cb) {
            cb(null, profile);
        }));
        gitLabSupported = true;
    }
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        passport.use(new GoogleStrategy({
            "clientID": process.env.GOOGLE_CLIENT_ID,
            "clientSecret": process.env.GOOGLE_CLIENT_SECRET,
            "callbackURL": process.env.GOOGLE_CALLBACK_URL
        }, authHelpers.filterEmails));
        googleSupported = true;
    }
    app.use(passport.initialize());
    app.use(passport.session());
    if (gitLabSupported) {
        app.get("/auth/gitlab", passport.authenticate("gitlab"));
        app.get("/auth/gitlab/callback",
                passport.authenticate("gitlab", {failureRedirect: "/login"}),
                authHelpers.homeRedirect);
    }
    if (googleSupported) {
        app.get("/auth/google",
                passport.authenticate("google", {scope: [process.env.GOOGLE_SCOPE ? process.env.GOOGLE_SCOPE : "profile"]}));

        app.get("/auth/google/callback", 
                passport.authenticate("google", {failureRedirect: "/login"}),
                authHelpers.homeRedirect);
    }
    app.get("/logout", function (req, res) {
        req.logout();
        res.redirect("/login");
    });
}

module.exports = initAuth;