"use strict";

// NPM modules
var router = require("express").Router();

// Project modules
var packageInfo = require("../package.json");
var baseApi = require("../lib/baseApi");

module.exports = function (scheduler, frameworkConfiguration, restartHelper) {

    var tasks = frameworkConfiguration.tasks;

    router.use(function (req, res, next) {
        req.tasks = tasks;
        req.scheduler = scheduler;
        req.frameworkConfiguration = frameworkConfiguration;
        req.restartHelper = restartHelper;
        if (!process.env.AUTH_COOKIE_ENCRYPTION_KEY || req.path.match(/^\/framework\/configuration/) || req.isAuthenticated()) {
            // No encryption key - no authentication used, framework configuration endpoint is auth aware
            next();
        } else {
            res.status(401).json({"error": "Not authenticated"});
        }
    });

    router.get("/framework/info", function (req, res) {

        res.json({
            moduleName: packageInfo.name,
            description: packageInfo.description || null,
            version: packageInfo.version,
            homepage: packageInfo.homepage || null,
            issues: (packageInfo.bugs && packageInfo.bugs.url ? packageInfo.bugs.url : null)
        });

    });

    router.get("/framework/stats", baseApi.getStats);

    router.post("/framework/restart", baseApi.restartFramework);

    router.get("/tasks/launched", function (req, res) {

        res.json(scheduler.launchedTasks);

    });

    router.post("/tasks/:task/restart", baseApi.taskRestart);

    router.post("/tasks/rollingRestart", baseApi.rollingRestart);

    router.post("/tasks/killAll", baseApi.killAllTasks);


    router.get("/tasks/types", baseApi.getTaskTypes);

    router.put("/tasks/types/:type/scale/:instances", baseApi.scaleTasks);

    router.post("/tasks/types/:type/killAll", baseApi.killAllTasksOfType);

    router.get("/logs", baseApi.getLogs);

    return router;
};
