/* jslint: node, es6
*/
"use strict";

// Internal modules
var fs = require("fs");
var _ = require("lodash");

var ejsRoutes = require("../routes/ejs");

// Testing require
var expect = require('chai').expect;
var sinon = require("sinon");
var MockReq = require("mock-req");
var MockRes = require("mock-res");

describe("EJS tests", function () {
    var oldEnv;
    beforeEach(function () {
        oldEnv = _.cloneDeep(process.env);
    });
    afterEach(function () {
        process.env = oldEnv;
    });
    it("css", function (done) {
        process.env.FRAMEWORK_NAME_BACKGROUND = "red";
        var req = new MockReq();
        var res = new MockRes();
        res.type = function (type) {
            res.contentType = type;
        };
        res.render = function (pageName, options) {
            expect(pageName).to.equal("style");
            expect(options.color).to.equal("red");
            expect(res.contentType).to.equal("css");
            done();
        };
        ejsRoutes.css(req, res);
    });
    describe("index", function () {
        it("None", function (done) {
            var req = new MockReq();
            var res = new MockRes();
            res.render = function (pageName, options) {
                expect(pageName).to.equal("index");
                expect(options).to.be.an("object");
                expect(options.moduleMenus).to.be.an("array");
                expect(options.moduleFiles).to.be.an("array");
                done();
            };
            ejsRoutes.root(req, res);
        });
        it("Modules without objects", function (done) {
            var req = new MockReq();
            var res = new MockRes();
            req.modules = {};
            res.render = function (pageName, options) {
                expect(pageName).to.equal("index");
                expect(options).to.be.an("object");
                expect(options.moduleMenus).to.be.an("array");
                expect(options.moduleFiles).to.be.an("array");
                done();
            };
            ejsRoutes.root(req, res);
        });
        it("Arrays", function (done) {
            var req = new MockReq();
            var res = new MockRes();
            req.modules = {menus: ["fdsfddfss"], files: ["fdsfds"]};
            res.render = function (pageName, options) {
                expect(pageName).to.equal("index");
                expect(options).to.be.an("object");
                expect(options.moduleMenus).to.be.an("array");
                expect(options.moduleFiles).to.be.an("array");
                done();
            };
            ejsRoutes.root(req, res);
        });
    });

    it("setup", function (done) {
        var app = {};
        var count = 0;
        app.get = function (path, cb) {
            count += 1;
            if (path === "/") {
                expect(cb).to.equal(ejsRoutes.root);
            } else if (path === "/partials/tasks.html") {
                expect(cb).to.equal(ejsRoutes.tasks);
            } else if (path === "/stylesheets/dynamic-style.css") {
                expect(cb).to.equal(ejsRoutes.css);
            } else {
                expect(false).to.be.true;
            }
            if (count === 3) {
                done();
            }
        };
        ejsRoutes.setup(app);
    });

    describe("tasks", function () {
        it("None", function (done) {
            var req = new MockReq();
            var res = new MockRes();
            res.render = function (pageName, options) {
                expect(pageName).to.equal("tasks");
                expect(options).to.be.an("object");
                expect(options.taskFields).to.be.an("array");
                expect(options.taskHeaders).to.be.an("array");
                expect(options.rollingRestartFields).to.be.an("array");
                expect(options.taskControllers).to.be.an("array");
                expect(options.killAllString).to.be.a("string");
                done();
            };
            ejsRoutes.tasks(req, res);
        });
        it("Modules without objects", function (done) {
            var req = new MockReq();
            var res = new MockRes();
            req.modules = {};
            res.render = function (pageName, options) {
                expect(pageName).to.equal("tasks");
                expect(options).to.be.an("object");
                expect(options.taskFields).to.be.an("array");
                expect(options.taskHeaders).to.be.an("array");
                expect(options.rollingRestartFields).to.be.an("array");
                expect(options.taskControllers).to.be.an("array");
                expect(options.killAllString).to.be.a("string");
                done();
            };
            ejsRoutes.tasks(req, res);
        });
        it("Arrays and string", function (done) {
            var req = new MockReq();
            var res = new MockRes();
            req.modules = {"taskFields": [], "taskHeaders": [], "rollingRestartFields": [], "killAllString": "fds", "taskControllers": []};
            res.render = function (pageName, options) {
                expect(pageName).to.equal("tasks");
                expect(options).to.be.an("object");
                expect(options.taskFields).to.be.an("array");
                expect(options.taskHeaders).to.be.an("array");
                expect(options.rollingRestartFields).to.be.an("array");
                expect(options.taskControllers).to.be.an("array");
                expect(options.killAllString).to.be.a("string");
                done();
            };
            ejsRoutes.tasks(req, res);
        });
        it("Arrays without string", function (done) {
            var req = new MockReq();
            var res = new MockRes();
            req.modules = {"taskFields": [], "taskHeaders": [], "rollingRestartFields": [], "taskControllers": []};
            res.render = function (pageName, options) {
                expect(pageName).to.equal("tasks");
                expect(options).to.be.an("object");
                expect(options.taskFields).to.be.an("array");
                expect(options.taskHeaders).to.be.an("array");
                expect(options.rollingRestartFields).to.be.an("array");
                expect(options.taskControllers).to.be.an("array");
                expect(options.killAllString).to.be.a("string");
                done();
            };
            ejsRoutes.tasks(req, res);
        });
    });
});