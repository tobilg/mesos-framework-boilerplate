// Internal modules
var path = require("path");

// NPM modules
var express = require("express");

// Project modules
var config = require("./lib/config");

// Check if we got the necessary info from the environment, otherwise fail directly!
require("require-environment-variables")(["HOST", "PORT0", "ZK_URL"]);

// Create the Express object
var app = express();

// Set application properties
app.set("port", process.env.PORT0 || config.application.port);
app.set("host", process.env.HOST || config.application.host);
app.set("env", process.env.NODE_ENV || config.application.environment);
app.set("logLevel", process.env.LOG_LEVEL || config.application.logLevel);
app.set("zkUrl", process.env.ZK_URL);

// Define static files path
app.use(express.static("public"));

// Instantiate the mesos-framework module related objects
var Scheduler = require("mesos-framework").Scheduler;
var Mesos = require("mesos-framework").Mesos.getMesos();

// The container information object to be used
var ContainerInfo = new Mesos.ContainerInfo(
    Mesos.ContainerInfo.Type.DOCKER, // Type
    null, // Volumes
    null, // Hostname
    new Mesos.ContainerInfo.DockerInfo(
        "mesoshq/flink:0.1.1", // Image
        Mesos.ContainerInfo.DockerInfo.Network.HOST, // Network
        null,  // PortMappings
        false, // Privileged
        null,  // Parameters
        true, // forcePullImage
        null   // Volume Driver
    )
);

// The framework tasks
var frameworkTasks = {
    "jobmanagers": {
        "priority": 1,
        "instances": 3,
        "executorInfo": null, // Can take a Mesos.ExecutorInfo object
        "containerInfo": ContainerInfo, // Mesos.ContainerInfo object
        "commandInfo": new Mesos.CommandInfo( // Strangely, this is needed, even when specifying ContainerInfo...
            null, // URI
            new Mesos.Environment([
                new Mesos.Environment.Variable("flink_recovery_mode", "zookeeper"),
                new Mesos.Environment.Variable("flink_recovery_zookeeper_quorum", app.get("zkUrl")),
                new Mesos.Environment.Variable("flink_recovery_zookeeper_storageDir", "/data/zk")
            ]), // Environment
            false, // Is shell?
            null, // Command
            ["jobmanager"], // Arguments
            null // User
        ),
        "resources": {
            "cpus": 0.5,
            "mem": 256,
            "ports": 2,
            "disk": 0
        },
        "healthChecks": null, // Add your health checks here
        "labels": null // Add your labels (an array of { "key": "value" } objects)
    },
    "taskmanagers": {
        "priority": 2,
        "instances": 2,
        "allowScaling": true,
        "executorInfo": null, // Can take a Mesos.ExecutorInfo object
        "containerInfo": ContainerInfo, // Mesos.ContainerInfo object
        "commandInfo": new Mesos.CommandInfo( // Strangely, this is needed, even when specifying ContainerInfo...
            null, // URI
            new Mesos.Environment([
                new Mesos.Environment.Variable("flink_recovery_mode", "zookeeper"),
                new Mesos.Environment.Variable("flink_recovery_zookeeper_quorum", app.get("zkUrl")),
                new Mesos.Environment.Variable("flink_recovery_zookeeper_storageDir", "/data/zk"),
                new Mesos.Environment.Variable("flink_taskmanager_tmp_dirs", "/data/tasks"),
                new Mesos.Environment.Variable("flink_blob_storage_directory", "/data/blobs"),
                new Mesos.Environment.Variable("flink_state_backend", "filesystem"),
                new Mesos.Environment.Variable("flink_taskmanager_numberOfTaskSlots", "1"),
                new Mesos.Environment.Variable("flink_taskmanager_heap_mb", "1536")
            ]), // Environment
            false, // Is shell?
            null, // Command
            ["taskmanager"], // Arguments
            null // User
        ),
        "resources": {
            "cpus": 0.5,
            "mem": 1536,
            "ports": 3,
            "disk": 0
        },
        "healthChecks": null, // Add your health checks here
        "labels": null // Add your labels (an array of { "key": "value" } objects)
    }
};

// The framework's overall configuration
var frameworkConfiguration = {
    "masterUrl": process.env.MASTER_IP || "leader.mesos",
    "port": 5050,
    "frameworkName": "Mesos-Framework-Boilerplate",
    "logging": {
        "path": path.join(__dirname , "/logs"),
        "fileName": "mesos-framework-boilerplate.log",
        "level": app.get("logLevel")
    },
    "tasks": frameworkTasks
};

var scheduler = new Scheduler(frameworkConfiguration);

// Start framework scheduler
scheduler.subscribe();
scheduler.logger.info("Subscribed to Mesos Master!");

// Capture "error" events
scheduler.on("error", function (error) {
    scheduler.logger.error("ERROR: " + JSON.stringify(error));
    scheduler.logger.error(error.stack);
});

// Wait for the framework scheduler to be subscribed to the leading Mesos Master
scheduler.on("subscribed", function (obj) {
    // Instantiate API (pass the scheduler and framework configuration)
    var api = require("./routes/api")(scheduler, frameworkConfiguration);
    // Create routes
    app.use("/api/" + config.application.apiVersion, api);
});


// /health endpoint for Marathon health checks
app.get("/health", function(req, res) {
    res.send("OK");
});

var server = app.listen(app.get("port"), app.get("host"), function() {
    scheduler.logger.info("Express server listening on port " + server.address().port + " on " + server.address().address);
});

process.on("uncaughtException", function (error) {
    scheduler.logger.error("Caught exception: ");
    scheduler.logger.error(error.stack);
});
