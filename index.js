/*jslint
this: true,
es6: true,
node: true
for
*/
"use strict";
// Internal modules
const fs = require("fs");

// NPM modules
var express = require("express");

// Project modules
var config = require("./lib/config");
var RestartHelper = require("./lib/restartHelper");
var baseApi = require("./lib/baseApi");
var initAuth = require("./lib/auth");
var ejs = require("./routes/ejs");
var populateTasks = require("./lib/populateTasks").populateTasks;

// Modules loaded array
var moduleSetups = [];

// Check if we got the necessary info from the environment, otherwise fail directly!
require("require-environment-variables")([
    // Scheduler settings
    "HOST",
    "PORT0",
    "MESOS_SANDBOX",
    "FRAMEWORK_NAME",
    "TASK_DEF_NUM",
    // Task settings
    "TASK0_NAME",
    "TASK0_NUM_INSTANCES",
    "TASK0_CPUS",
    "TASK0_MEM",
    "TASK0_IMAGE"
/*  Optional variables for tasks
    "TASK0_HEALTHCHECK",
    "TASK0_HEALTHCHECK_PORT",
    "TASK0_URI",
    "TASK0_ARGS",
    "TASK0_CONTAINER_PARAMS",
    "AUTH_COOKIE_ENCRYPTION_KEY",
    "TASK0_CONTAINER_PRIVILEGED",
    "TASK0_FIXED_PORTS",
    "TASK0_ENV"  */
]);

// Create the Express object
var app = express();
app.set('view engine', 'ejs');

// Set application properties
app.set("port", process.env.PORT0 || config.application.port);
app.set("host", process.env.HOST || config.application.host);
app.set("env", process.env.NODE_ENV || config.application.environment);
app.set("logLevel", process.env.LOG_LEVEL || config.application.logLevel);

// Initialize optional user authorization
initAuth(app);

// Define static files path
app.use(express.static("public"));
app.use("/bower_components", express.static("bower_components"));

var Scheduler;

// Instantiate the mesos-framework module related objects
if (fs.existsSync("./mesos-framework")) {
    Scheduler = require("./mesos-framework").Scheduler;
} else {
    Scheduler = require("mesos-framework").Scheduler;
}

// The framework's overall configuration
var frameworkConfiguration = {
    "masterUrl": process.env.MASTER_IP || "leader.mesos",
    "port": 5050,
    "frameworkName": process.env.FRAMEWORK_NAME,
    "logging": {
        "path": process.env.MESOS_SANDBOX + "/logs/",
        "fileName": process.env.FRAMEWORK_NAME + ".log",
        "level": app.get("logLevel")
    },
    "killUnknownTasks": true,
    "useZk": true,
    "staticPorts": true,
    "serialNumberedTasks": false,
    "userAuthSupport": !!process.env.AUTH_COOKIE_ENCRYPTION_KEY,
    "tasks": populateTasks(),
    "restartStates": ["TASK_FAILED", "TASK_LOST", "TASK_ERROR", "TASK_FINISHED", "TASK_KILLED"],
    "moduleList": []
};

function requireModules() {
    // Importing pluggable modules
    var moduleFiles = fs.readdirSync("./");
    if (moduleFiles) {
        var index;
        var currentModule;
        for (index = 0; index < moduleFiles.length; index += 1) {
            currentModule = moduleFiles[index];
            if (currentModule.match(/-module$/) && fs.existsSync("./" + currentModule + "/index.js")) {
                moduleSetups.push(require("./" + currentModule));
            }
        }
    }
}

fs.mkdirSync(process.env.MESOS_SANDBOX + "/logs");

requireModules();

var scheduler = new Scheduler(frameworkConfiguration);
var restartHelper;

// Start framework scheduler
scheduler.on("ready", function () {
    scheduler.logger.info("Ready");
    scheduler.subscribe();
});

// Capture "error" events
scheduler.on("error", function (error) {
    scheduler.logger.error("ERROR: " + JSON.stringify(error));
    scheduler.logger.error(error.stack);
});

// Wait for the framework scheduler to be subscribed to the leading Mesos Master
scheduler.once("subscribed", function (obj) {
    restartHelper = new RestartHelper(scheduler, {"timeout": 300000});
    // Instantiate API (pass the scheduler and framework configuration)
    var api = require("./routes/api")(scheduler, frameworkConfiguration, restartHelper);

    // Setup extended modules
    if (moduleSetups) {
        var index;
        for (index = 0; index < moduleSetups.length; index += 1) {
            moduleSetups[index](scheduler, frameworkConfiguration, api, app, restartHelper);
        }
    }
    require("./routes/configApi")(api);
    // Create routes
    app.use("/api/" + config.application.apiVersion, api);

    // Middleware for health check API
    app.use(function (req, res, next) {
        req.scheduler = scheduler;
        req.frameworkConfiguration = frameworkConfiguration;
        next();
    });
    // /health endpoint for Marathon health checks
    app.get("/health", baseApi.healthCheck);
    ejs.setup(app);
    app.get("/moduleList", baseApi.moduleList);
});

// Setting up the express server
var server;
server = app.listen(app.get("port"), app.get("host"), function () {
    scheduler.logger.info("Express server listening on port " + server.address().port + " on " + server.address().address);
});

process.on("uncaughtException", function (error) {
    scheduler.logger.error("Caught exception: ");
    scheduler.logger.error(error.stack);
});
