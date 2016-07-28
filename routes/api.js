// Internal modules
var fs = require("fs");
var path = require("path");

// NPM modules
var router = require("express").Router();
var _ = require("lodash");

// Project modules
var packageInfo = require("../package.json");

var getTaskTypesStats = function (tasks, launchedTasks) {
    var taskTypes = [];
    Object.getOwnPropertyNames(tasks).forEach(function (taskType) {
        var runningInstances = 0;
        launchedTasks.forEach(function (launchedTask) {
            if (taskType === launchedTask.name) {
                runningInstances++;
            }
        });
        taskTypes.push({
            type: taskType,
            runningInstances: runningInstances,
            allowScaling: tasks[taskType].allowScaling
        })
    });
    return taskTypes;
};

module.exports = function (scheduler, frameworkConfiguration) {

    var tasks = frameworkConfiguration.tasks;

    router.get("/framework/configuration", function(req, res) {

        res.json(frameworkConfiguration);

    });

    router.get("/framework/info", function(req, res) {

        res.json({
            moduleName: packageInfo.name,
            description: packageInfo.description || null,
            version: packageInfo.version,
            homepage: packageInfo.homepage || null,
            issues: (packageInfo.bugs && packageInfo.bugs.url ? packageInfo.bugs.url : null)
        });

    });

    router.get("/framework/stats", function(req, res) {

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

        scheduler.launchedTasks.forEach(function (launchedTask) {
            if (stats.byType.hasOwnProperty(launchedTask.name)) {
                stats.byType[launchedTask.name].cpus += launchedTask.resources.cpus;
                stats.byType[launchedTask.name].mem += launchedTask.resources.mem;
                stats.byType[launchedTask.name].disk += launchedTask.resources.disk;
                stats.byType[launchedTask.name].ports += launchedTask.resources.ports;
                stats.byType[launchedTask.name].instances++;
            } else {
                stats.byType[launchedTask.name] = {
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
            stats.overall.instances++;
        });

        res.json(stats);

    });

    router.get("/tasks/launched", function(req, res) {

        res.json(scheduler.launchedTasks);

    });

    router.get("/tasks/types", function(req, res) {

        if (Object.getOwnPropertyNames(tasks).length > 0) {
            res.json(getTaskTypesStats(tasks, scheduler.launchedTasks));
        } else {
            res.json([]);
        }

    });

    router.put("/tasks/types/:type/scale/:instances", function(req, res) {

        var taskTypesStats = getTaskTypesStats(tasks, scheduler.launchedTasks);

        taskTypesStats.forEach(function (taskType) {

            if (taskType.type === req.params.type && taskType.allowScaling) {

                if (req.params.instances === taskType.runningInstances) {
                    // No-op
                } else if (req.params.instances > taskType.runningInstances) {
                    // Scale up
                    var deltaUp = req.params.instances-taskType.runningInstances;
                    var taskDef = tasks[req.params.type];
                    // Set defaults
                    taskDef.isSubmitted = false;
                    taskDef.name = req.params.type;
                    if (!taskDef.hasOwnProperty("allowScaling")) {
                        taskDef.allowScaling = false;
                    }
                    for (var n=1; n<=deltaUp; n++) {
                        scheduler.pendingTasks.push(_.cloneDeep(taskDef)); // cloneDeep is IMPORTANT!
                    }
                } else if (req.params.instances < taskType.runningInstances && req.params.instances >= 0) {
                    // Scale down
                    var deltaDown = taskType.runningInstances-req.params.instances;
                    // First, check pending tasks
                    var index = 0;
                    scheduler.pendingTasks.forEach(function (pendingTask) {
                        // Check if type fits, and we still need t scale down
                        if (pendingTask.name === req.params.type && deltaDown > 0) {
                            // Remove current array index
                            scheduler.pendingTasks.splice(index, 1);
                            // Reduce scale down count
                            deltaDown--;
                        }
                        index++;
                    });
                    // Check if still instances left to scale down, if so, kill tasks
                    if (deltaDown > 0) {
                        while (deltaDown > 0) {
                            scheduler.launchedTasks.forEach(function (launchedTask) {
                                if (launchedTask.name === req.params.type && deltaDown > 0) {
                                    // Kill the task
                                    scheduler.kill(launchedTask.taskId, launchedTask.runtimeInfo.agentId);
                                    deltaDown--;
                                }
                            })
                        }
                    }

                } else {
                    // Error
                }

            }

        });

        res.send();

    });

    router.get("/logs", function (req, res) {

        var dirname = scheduler.logger.transports["dailyRotateFile"].dirname;
        var filename = scheduler.logger.transports["dailyRotateFile"].filename;

        var logFile = path.normalize(dirname + "/" + filename);

        fs.createReadStream(logFile, {}).pipe(res);

    });

    return router;
};