"use strict";


module.exports = function (router) {

    router.get("/framework/configuration", function (req, res) {

        if (!process.env.AUTH_COOKIE_ENCRYPTION_KEY || req.isAuthenticated()) {
            res.json(req.frameworkConfiguration);
        } else {
            res.json({"frameworkName": req.frameworkConfiguration.frameworkName, user: ""});
        }

    });
};
