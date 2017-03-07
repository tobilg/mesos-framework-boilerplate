"use strict";

var helpers;
const fs = require("fs");

var Mesos = null;

// Instantiate the mesos-framework module related objects
if (fs.existsSync("../mesos-framework")) {
    Mesos = require("../mesos-framework").Mesos.getMesos();
    helpers = require("../mesos-framework").helpers;
} else {
    Mesos = require("mesos-framework").Mesos.getMesos();
    helpers = require("mesos-framework").helpers;
}

/**
 * restartHelper object
 * @constructor
 * @param {object} scheduler - The scheduler object.
 * @param {object} options - An options object (timeout, useHealthcheck)
 */
function RestartHelper(scheduler, options) {

    if (!(this instanceof RestartHelper)) {
        return new RestartHelper(scheduler);
    }

    var self = this;

    options = options || {};

    self.scheduler = scheduler;
    self.logger = scheduler.logger;
    self.timeout = options.timeout || 10000;
    self.useHealthcheck = options.useHealthcheck || false;
}

RestartHelper.prototype.setUseHealthcheck = function (useHealthcheck) {
    this.useHealthcheck = useHealthcheck;
};

function findTaskByID(taskId, tasks) {
    // Iterate over tasks
    for (var index = 0; index < tasks.length; index++) {
        var task = tasks[index];
        if (task.taskId === taskId) {
            return task;
        }
    }
    return null;
}

function findTaskByType(typeToSearch, tasks) {
    // Iterate over tasks
    for (var index = 0; index < tasks.length; index++) {
        var task = tasks[index];
        var typeName = task.name.replace(/-[0-9]+$/,"");
        if (typeName === typeToSearch) {
            return task;
        }
    }
    return null;
}

RestartHelper.prototype.restartTask = function (taskId, isRolling) {
    var self = this;

    var taskLaunchedFound = findTaskByID(taskId, self.scheduler.launchedTasks);

    if (!taskLaunchedFound){
        self.logger.debug("Can't restart task that is not running.");
        return;
    }

    var taskDefFound = findTaskByType(taskLaunchedFound.name.replace(/-[0-9]+$/,""), self.scheduler.tasks);

    if (!taskDefFound) {
        self.logger.debug("Can't restart task that is not found." + JSON.stringify(self.scheduler.tasks));
    } else {
        var agentId = taskLaunchedFound.runtimeInfo.agentId;
        taskLaunchedFound.runtimeInfo.restarting = true;
        var taskToRestart = helpers.cloneDeep(taskDefFound);
        taskToRestart.name = taskLaunchedFound.name;
        taskToRestart = helpers.taskCleanup(taskToRestart);
        self.logger.debug("Restart task by putting it in the pendingTasks array " + taskToRestart.name);
        self.scheduler.pendingTasks.push(taskToRestart);

        self.scheduler.on("task_launched", function (task) {
            if (task !== taskToRestart) {
                self.logger.debug("Not our task started id: " + task.taskId + " our task name: " + taskToRestart.name);
                return;
            }
            var interval = setInterval(function () {
                var clonedIsRunning = false;

                if (self.scheduler.pendingTasks.indexOf(taskToRestart) === -1 && taskToRestart.runtimeInfo && taskToRestart.runtimeInfo.state === "TASK_RUNNING" && (!self.useHealthcheck || taskToRestart.runtimeInfo.healthy)) {
                    clonedIsRunning = true;
                }

                if (clonedIsRunning) {
                    self.logger.debug("Cloned task is running " + taskToRestart.name);
                    // kill the task only after the cloned is running
                    self.logger.debug("Killing " + taskId + " " + agentId)
                    self.scheduler.kill(taskId, agentId);
                    if (isRolling) {
                        self.logger.debug("Rolling restart sent");
                        self.scheduler.emit("rollingrestart");
                    } else {
                        self.scheduler.emit("task_restarted", taskToRestart);
                        self.logger.debug("Individual Task killed");
                    }

                    clearInterval(interval);
                }
            }, 1000);

            setTimeout(function () {
                clearInterval(interval);
            }, self.timeout)
        });
    }
};

RestartHelper.prototype.rollingRestart = function (tasksToRestart) {
    var self = this;

    var tasks = tasksToRestart.slice(0);

    function rollingRestartHandler() {
        if (tasks.length > 0) {
            var task = tasks.splice(tasks.length - 1, 1);
            self.restartTask(task[0].taskId, true);
        } else {
            self.scheduler.emit("endrollingrestart");
        }
    }
    self.scheduler.removeListener("rollingrestart", rollingRestartHandler);
    self.scheduler.on("rollingrestart", rollingRestartHandler);

    self.scheduler.logger.debug("Start rolling restart - send event");
    self.scheduler.emit("rollingrestart");
};

module.exports = RestartHelper;
