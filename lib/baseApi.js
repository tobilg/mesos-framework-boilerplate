"use strict";

// Internal modules
var fs = require("fs");
var path = require("path");
var parse = require("url").parse;
var _ = require("lodash");

var baseApi = {
    getTaskTypesStats: function (tasks, launchedTasks) {
        var taskTypes = [];
        Object.getOwnPropertyNames(tasks).forEach(function (taskType) {
            var runningInstances = 0;
            launchedTasks.forEach(function (launchedTask) {
                if ((taskType + launchedTask.name.match(/-[0-9]+$/)[0]) === launchedTask.name && launchedTask.runtimeInfo && !launchedTask.runtimeInfo.restarting) {
                    runningInstances += 1;
                }
            });
            taskTypes.push({
                type: taskType,
                runningInstances: runningInstances,
                allowScaling: tasks[taskType].allowScaling
            });
        });
        return taskTypes;
    },

    confirmationCheck: function (req) {
        var params = parse(req.url, true).query;
        if (params && params.sure && params.sure.match(/yes/i)) {
            return true;
        }
        return false;
    },

    getStats: function (req, res) {

        var stats = {
            byType: {

            },
            overall: {
                cpus: 0,
                mem: 0,
                disk: 0,
                ports: 0,
                instances: 0
            }
        };

        req.scheduler.launchedTasks.forEach(function (launchedTask) {
            var typeName = launchedTask.name.replace(/-[0-9]+$/, "");
            if (stats.byType.hasOwnProperty(typeName)) {
                stats.byType[typeName].cpus += launchedTask.resources.cpus;
                stats.byType[typeName].mem += launchedTask.resources.mem;
                stats.byType[typeName].disk += launchedTask.resources.disk;
                stats.byType[typeName].ports += launchedTask.resources.ports;
                stats.byType[typeName].instances += 1;
            } else {
                stats.byType[typeName] = {
                    cpus: launchedTask.resources.cpus,
                    mem: launchedTask.resources.mem,
                    disk: launchedTask.resources.disk,
                    ports: launchedTask.resources.ports,
                    instances: 1
                };
            }
            stats.overall.cpus += launchedTask.resources.cpus;
            stats.overall.mem += launchedTask.resources.mem;
            stats.overall.disk += launchedTask.resources.disk;
            stats.overall.ports += launchedTask.resources.ports;
            stats.overall.instances += 1;
        });

        res.json(stats);

    },

    restartFramework: function (req, res) {

        if (baseApi.confirmationCheck(req)) {
            res.json({"status": "ok"});
            setTimeout(function () {
                process.exit(0);
            }, 1000);
        } else {
            var params = parse(req.url, true).query;
            res.json({"error": "sure parameter must be yes, params:" + JSON.stringify(params)});
        }

    },

    taskRestart: function (req, res) {
        if (req.params && req.params.task) {
            req.restartHelper.restartTask(req.params.task, false);
            res.json({"status": "ok"});
        } else {
            res.json({"error": "Invalid params: " + JSON.stringify(req.params)});
        }
    },

    rollingRestart: function (req, res) {

        if (baseApi.confirmationCheck(req)) {
            req.restartHelper.rollingRestart(req.scheduler.launchedTasks);
            res.json({"status": "ok"});
        } else {
            var params = parse(req.url, true).query;
            res.json({"error": "sure parameter must be yes, params:" + JSON.stringify(params)});
        }

    },

    scaleTasks: function (req, res) {

        var taskTypesStats = baseApi.getTaskTypesStats(req.tasks, req.scheduler.launchedTasks);

        taskTypesStats.forEach(function (taskType) {

            if (taskType.type === req.params.type && taskType.allowScaling) {

                if (req.params.instances === taskType.runningInstances) {
                    // No-op
                } else if (req.params.instances > taskType.runningInstances) {
                    // Scale up
                    var deltaUp = req.params.instances-taskType.runningInstances;
                    var taskDef = req.tasks[req.params.type];
                    // Set defaults
                    taskDef.isSubmitted = false;
                    taskDef.name = req.params.type;
                    for (var n=1; n<=deltaUp; n++) {
                        var newTask = _.cloneDeep(taskDef); // cloneDeep is IMPORTANT!
                        newTask.name += "-" + (taskType.runningInstances + n).toString(); // Adding task serial
                        req.scheduler.pendingTasks.push(newTask);
                    }
                } else if (req.params.instances < taskType.runningInstances && req.params.instances > 0) {
                    // Scale down
                    var deltaDown = taskType.runningInstances-req.params.instances;
                    // First, check pending tasks
                    var index = parseInt(req.params.instances);
                    var taskNames = [];
                    while (index < taskType.runningInstances) {
                        index += 1;
                        taskNames.push(req.params.type + "-" + index.toString());
                    }
                    req.scheduler.logger.debug("Tasks to kill: " + taskNames.toString());
                    for (index = req.scheduler.pendingTasks.length - 1;index >= 0;--index) { // Removing in LIFO order
                        var pendingTask = req.scheduler.pendingTasks[index];
                        // Check if type fits, and we still need to scale down
                        if (taskNames.indexOf(pendingTask.name) > -1 && deltaDown > 0) {
                            // Remove current array index
                            req.scheduler.pendingTasks.splice(index, 1);
                            // Reduce scale down count
                            deltaDown--;
                            if (deltaDown === 0) {
                                break;
                            }
                        }
                    }
                    // Check if still instances left to scale down, if so, kill tasks
                    if (deltaDown > 0) {
                        while (deltaDown > 0) {
                            for (index = req.scheduler.launchedTasks.length - 1;index >= 0;--index) { // Killing in LIFO order
                                var launchedTask = req.scheduler.launchedTasks[index];
                                if (taskNames.indexOf(launchedTask.name) > -1 && deltaDown > 0) {
                                    // Kill the task
                                    req.scheduler.kill(launchedTask.taskId, launchedTask.runtimeInfo.agentId);
                                    req.scheduler.logger.info("Scale down - killing task ID " + launchedTask.taskId);
                                    req.scheduler.launchedTasks.splice(index, 1);
                                    deltaDown--;
                                    if (deltaDown === 0) {
                                        break;
                                    }
                                }
                            }
                        }
                    }

                } else {
                    // Error
                }

            }

        });

        res.send();

    },

    getTaskTypes: function (req, res) {

        if (Object.getOwnPropertyNames(req.tasks).length > 0) {
            res.json(baseApi.getTaskTypesStats(req.tasks, req.scheduler.launchedTasks));
        } else {
            res.json([]);
        }

    },

    killAllTasks: function (req, res) {

        if (baseApi.confirmationCheck(req)) {
            req.scheduler.launchedTasks.forEach(function (task) {
                req.scheduler.kill(task.taskId, task.runtimeInfo.agentId);
            });
            res.json({"status": "ok"});
        } else {
            var params = parse(req.url, true).query;
            res.json({"error": "sure parameter must be yes, params:" + JSON.stringify(params)});
        }

    },

    killAllTasksOfType: function (req, res) {

        var params = parse(req.url, true).query;

        if (params && baseApi.confirmationCheck(req) && req.params.type && req.params.type.length) {
            req.scheduler.launchedTasks.forEach(function (task) {
                var typeName = task.name.replace(/-[0-9]+$/, "");
                if (typeName === req.params.type) {
                    req.scheduler.kill(task.taskId, task.runtimeInfo.agentId);
                }
            });
            res.json({"status": "ok"});
        } else {
            res.json({"error": "sure parameter must be yes and type parameter must not be blank, params:" + JSON.stringify(params) + ", req params: " + JSON.stringify(req.params)});
        }

    },

    getLogs: function (req, res) {

        var dirname = req.scheduler.logger.transports["dailyRotateFile"].dirname;
        var filename = req.scheduler.logger.transports["dailyRotateFile"].filename;

        var logFile = path.normalize(dirname + "/" + filename);

        fs.createReadStream(logFile, {}).pipe(res);

    },

    healthCheck: function (req, res) {
        var diff = new Date().getTime() - req.scheduler.lastHeartbeat;
        if (diff < 60 * 1000) {
            res.send("OK");
        } else {
            res.writeHead(500);
        }
    },

    moduleList: function (req, res) {
        var index;
        var result = "";
        for (index = 0; index < req.frameworkConfiguration.moduleList.length; index += 1) {
            result += req.frameworkConfiguration.moduleList[index] + "\n";
        }
        res.send(result);
    }
};

module.exports = baseApi;
