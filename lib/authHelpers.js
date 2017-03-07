"use strict";

function filterEmails(accessToken, refreshToken, profile, cb) {
    var matchFound = false;
    if (process.env.GOOGLE_FILTER && profile.emails) {
        var i;
        for (i = 0; i < profile.emails.length; i += 1) {
            if (profile.emails[i].type === "account" && profile.emails[i].value.match(process.env.GOOGLE_FILTER)) {
                matchFound = true;
            }
        }
    }
    if (matchFound || !process.env.GOOGLE_FILTER) {
        cb(null, profile);
    } else {
        cb(null, false);
    }
}

function homeRedirect(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/");
}

module.exports = {"homeRedirect": homeRedirect, "filterEmails": filterEmails};