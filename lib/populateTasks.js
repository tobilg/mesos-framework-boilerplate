/*jslint
this: true,
es6: true,
node: true
for
*/
"use strict";
// Internal modules
const fs = require("fs");

var requireEnv = require("require-environment-variables");

var Mesos;

// Instantiate the mesos-framework module related objects
if (fs.existsSync("../mesos-framework")) {
    Mesos = require("../mesos-framework").Mesos.getMesos();
} else {
    Mesos = require("mesos-framework").Mesos.getMesos();
}

var helpers = require("./helpers");

function createContainerInfo(taskTypeId) {
    // The container information object to be used
    var containerInfo = new Mesos.ContainerInfo(
        Mesos.ContainerInfo.Type.DOCKER, // Type
        null, // Volumes
        null, // Hostname
        new Mesos.ContainerInfo.DockerInfo(
            process.env["TASK" + taskTypeId + "_IMAGE"], // Image
            Mesos.ContainerInfo.DockerInfo.Network.HOST, // Network
            null,  // PortMappings
            helpers.checkBooleanString(process.env["TASK" + taskTypeId + "_CONTAINER_PRIVILEGED"], false), // Privileged
            process.env["TASK" + taskTypeId + "_CONTAINER_PARAMS"]
                ? JSON.parse(process.env["TASK" + taskTypeId + "_CONTAINER_PARAMS"])
                : null,  // Parameters
            true, // forcePullImage
            null   // Volume Driver
        )
    );
    return containerInfo;
}

function createTaskInfo(taskTypeId) {
    var task = {
        "priority": 1,
        "allowScaling": helpers.checkBooleanString(process.env["TASK" + taskTypeId + "_ALLOW_SCALING"], true),
        "instances": process.env["TASK" + taskTypeId + "_NUM_INSTANCES"],
        "executorInfo": null, // Can take a Mesos.ExecutorInfo object
        "containerInfo": createContainerInfo(taskTypeId), // Mesos.ContainerInfo object
        "commandInfo": new Mesos.CommandInfo( // Strangely, this is needed, even when specifying ContainerInfo...
            process.env["TASK" + taskTypeId + "_URI"]
                ? new Mesos.CommandInfo.URI(process.env["TASK" + taskTypeId + "_URI"])
                : null, // URI
            new Mesos.Environment(), // Environment
            false, // Is shell?
            null, // Command
            process.env["TASK" + taskTypeId + "_ARGS"]
                ? JSON.parse(process.env["TASK" + taskTypeId + "_ARGS"])
                : null, // Arguments
            null // User
        ),
        "resources": {
            "cpus": parseFloat(process.env["TASK" + taskTypeId + "_CPUS"]),
            "mem": parseInt(process.env["TASK" + taskTypeId + "_MEM"]),
            "ports": process.env["TASK" + taskTypeId + "_PORT_NUM"]
                ? parseInt(process.env["TASK" + taskTypeId + "_PORT_NUM"])
                : 0,
            "disk": 0,
            "staticPorts": (process.env["TASK" + taskTypeId + "_FIXED_PORTS"]
                ? JSON.parse("[" + process.env["TASK" + taskTypeId + "_FIXED_PORTS"] + "]")
                : null)
        },
        "healthCheck": process.env["TASK" + taskTypeId + "_HEALTHCHECK"]
            ? new Mesos.HealthCheck(new Mesos.HealthCheck.HTTP(parseInt(process.env["TASK" + taskTypeId + "_HEALTHCHECK_PORT"]),
                    process.env["TASK" + taskTypeId + "_HEALTHCHECK"], 200))
            : null, // Add your health checks here
        "noColocation": helpers.checkBooleanString(process.env["TASK" + taskTypeId + "_NOCOLOCATION"], false),
        "labels": null // Add your labels (an array of { "key": "value" } objects)
    };
    var taskEnv = {};
    if (process.env["TASK" + taskTypeId + "_ENV"]) {
        taskEnv = JSON.parse(process.env["TASK" + taskTypeId + "_ENV"]);
    }

    Object.keys(taskEnv).forEach(function (key) {
        task.commandInfo.environment.variables.push(new Mesos.Environment.Variable(key, taskEnv[key]));
    });
    return task;
}

function populateTasks() {
    // The framework tasks
    var frameworkTasks = {};

    var index;
    var taskName;
    var taskCount = parseInt(process.env.TASK_DEF_NUM);

    for (index = 0; index < taskCount; index += 1) {
        requireEnv([
            "TASK" + index + "_NAME",
            "TASK" + index + "_NUM_INSTANCES",
            "TASK" + index + "_CPUS",
            "TASK" + index + "_MEM",
            "TASK" + index + "_IMAGE"
            ]);
        taskName = process.env["TASK" + index + "_NAME"];
        frameworkTasks[taskName] = createTaskInfo(index);
    }
    return frameworkTasks;
}

module.exports = {
    "populateTasks": populateTasks,
    "createTaskInfo": createTaskInfo,
    "createContainerInfo": createContainerInfo
};