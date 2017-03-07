"use strict";

// NPM modules
var express = require("express");
var _ = require("lodash");

// Project modules
var initAuth = require("../lib/auth");
var authHelpers = require("../lib/authHelpers");

// Testing require
var expect = require("chai").expect;
var sinon = require("sinon");
var MockReq = require("mock-req");
var MockRes = require("mock-res");

describe("Authentication init", function () {
    var oldEnv;
    var sandbox;
    var api;
    beforeEach(function () {
        oldEnv = _.cloneDeep(process.env);
        sandbox = sinon.sandbox.create();
        api = {};
        api.use = function () {
            console.log("Use called");
            return;
        };
        api.get = function () {
            return;
        };
        api.set = function () {
            return;
        };
        api.delete = function () {
            return;
        };
        api.patch = function () {
            return;
        };
        api.post = function () {
            return;
        };
        api.put = function () {
            return;
        };
    });
    afterEach(function () {
        process.env = oldEnv;
        sandbox.restore();
    });
    it("No auth", function (done) {
        var app = api;
        sandbox.stub(app, "use", function (url, cb) {
            if (url === "/login") {
                var req = new MockReq();
                var res = new MockRes();
                res.status = function (status) {
                    this.statusCode = status;
                    return this;
                };
                cb(req, res);
                expect(res.statusCode).to.equal(404);
                done();
            } else {
                expect(false).to.be.true;
                done();
            }
        });
        initAuth(app);
    });
    it("Invalid auth settings", function () {
        var app = api;
        var err;
        process.env.AUTH_COOKIE_ENCRYPTION_KEY = "fdsgdsgsdgas";
        try {
            initAuth(app);
        } catch (error) {
            err = error;
        }
        expect(err).to.be.an.error;
    });
    it("Gitlab basic setup", function () {
        var app = express();
        process.env.GITLAB_APP_ID = "sdfsdafs";
        process.env.GITLAB_APP_SECRET = "fsdfdsfds";
        process.env.AUTH_COOKIE_ENCRYPTION_KEY = "fdsgdsgsdgas";
        process.env.GITLAB_CALLBACK_URL = "/fsdfsd/asfdfdsa";
        initAuth(app);
    });
    it("Google basic setup with logout and scope", function (done) {
        var app = api;
        var called = false;
        sandbox.stub(app, "get", function (url, cb) {
            if (url === "/logout") {
                var req = new MockReq();
                var res = new MockRes();
                res.redirect = function (redirectUrl) {
                    expect(redirectUrl).to.equal("/login");
                    expect(called).to.be.true;
                    done();
                };
                req.logout = function () {
                    called = true;
                };
                cb(req, res);
            }
        });
        process.env.GOOGLE_CLIENT_ID = "sdfsdafs";
        process.env.GOOGLE_CLIENT_SECRET = "fsdfdsfds";
        process.env.AUTH_COOKIE_ENCRYPTION_KEY = "fdsgdsgsdgas";
        process.env.GOOGLE_CALLBACK_URL = "/fsdfsd/asfdfdsa";
        process.env.GOOGLE_SCOPE = "google+";
        initAuth(app);
    });
    it("Google basic setup", function () {
        var app = express();
        process.env.GOOGLE_CLIENT_ID = "sdfsdafs";
        process.env.GOOGLE_CLIENT_SECRET = "fsdfdsfds";
        process.env.AUTH_COOKIE_ENCRYPTION_KEY = "fdsgdsgsdgas";
        process.env.GOOGLE_CALLBACK_URL = "/fsdfsd/asfdfdsa";
        initAuth(app);
    });

    it("homeRedirect", function (done) {
        var req = new MockReq();
        var res = new MockRes();
        res.redirect = function (redirectUrl) {
            expect(redirectUrl).to.equal("/");
            done();
        };
        authHelpers.homeRedirect(req, res);
    });

    it("filterEmails - no filter", function (done) {
        var profile = {};
        authHelpers.filterEmails("", "", profile, function (error, result) {
            expect(result).to.equal(profile);
            expect(error).to.not.be.an("error");
            done();
        });
    });
    it("filterEmails - not found", function (done) {
        var profile = {"emails": [{"type": "account", "value": "test@gmail.com"}]};
        process.env.GOOGLE_FILTER = "@test.com$";
        authHelpers.filterEmails("", "", profile, function (error, result) {
            expect(result).to.be.false;
            expect(error).to.not.be.an("error");
            done();
        });
    });

    it("filterEmails - found", function (done) {
        var profile = {"emails": [{"type": "account", "value": "test@test.com"}]};
        process.env.GOOGLE_FILTER = "@test.com$";
        authHelpers.filterEmails("", "", profile, function (error, result) {
            expect(result).to.equal(profile);
            expect(error).to.not.be.an("error");
            done();
        });
    });
});
