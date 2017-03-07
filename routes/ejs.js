"use strict";

var ejs;
ejs = {
    setup: function (app) {
        app.get("/", ejs.root);
        app.get("/partials/tasks.html", ejs.tasks);
        app.get("/stylesheets/dynamic-style.css", ejs.css);
    },
    root: function (req, res) {
        var moduleMenus = [];
        var moduleFiles = [];
        if (req.modules) {
            if (req.modules.menus) {
                moduleMenus = req.modules.menus;
            }
            if (req.modules.files) {
                moduleFiles = req.modules.files;
            }
        }
        res.render("index", {"moduleMenus": moduleMenus, "moduleFiles": moduleFiles});
    },
    tasks: function (req, res) {
        if (!req.modules) {
            req.modules = {"taskFields": [], "taskHeaders": [], "rollingRestartFields": [], "killAllString": "", "taskControllers": []};
        } else {
            if (!req.modules.taskFields) {
                req.modules.taskFields = [];
            }
            if (!req.modules.taskHeaders) {
                req.modules.taskHeaders = [];
            }
            if (!req.modules.rollingRestartFields) {
                req.modules.rollingRestartFields = [];
            }
            if (!req.modules.killAllString) {
                req.modules.killAllString = "";
            }
            if (!req.modules.taskControllers) {
                req.modules.taskControllers = [];
            }
        }
        res.render("tasks", req.modules);
    },
    css: function (req, res) {
        res.type("css");
        res.render("style", {color: process.env.FRAMEWORK_NAME_BACKGROUND});
    }
};

module.exports = ejs;
