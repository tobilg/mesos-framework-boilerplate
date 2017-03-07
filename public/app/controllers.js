"use strict";
var controllers = angular.module('mesos-framework-ui.controllers', []);

controllers.controller('MainController', function($scope, $interval, $route, $window, config, FrameworkStats, FrameworkInformation, FrameworkConfiguration, Tasks, RollingRestart, Restart, FrameworkRestart, KillAll, KillAllType, ModuleInfo) {
    $scope.$route = $route;

    /** Responsiveness helpers **/
    var mobileView = 992;
    $scope.getWidth = function () {
        return window.innerWidth;
    };
    $scope.$watch($scope.getWidth, function (newValue, oldValue) {
        if (newValue >= mobileView) {
            $scope.toggle = true;
        } else {
            $scope.toggle = false;
        }
    });
    $scope.toggleSidebar = function () {
        $scope.toggle = !$scope.toggle;
    };
    window.onresize = function () {
        $scope.$apply();
    };

    $scope.orderType = "taskId";
    $scope.orderReverse = false;
    $scope.moduleInfo = ModuleInfo.moduleInfo;

    $scope.setModuleInfo = function (moduleInfo) {
        Object.getOwnPropertyNames(moduleInfo).forEach(function (name) {
            $scope.moduleInfo[name] = moduleInfo[name];
        });
    };

    /** Framework configuration **/
    var fetchFrameworkConfiguration = function () {
        FrameworkConfiguration.get(function (configuration) {
            $scope.name = configuration.frameworkName;
            if (configuration.user === "") {
                $window.location.href = "./login";
            }
            $scope.configuration = configuration.toJSON();
            if ($scope.moduleInfo && $scope.moduleInfo.configure && $scope.moduleInfo.configure.length) {
                $scope.moduleInfo.configure.forEach(function (configFunction) {
                    configFunction();
                });
            }
        });
    };

    /** Framework info **/
    var fetchFrameworkInfo = function() {
        FrameworkInformation.get(function (info) {
            $scope.info = info.toJSON();
        });
    };

    /** Framework info **/
    var fetchFrameworkStats = function() {
        FrameworkStats.get(function (stats) {
            $scope.stats = stats.toJSON();
        });
    };

    fetchFrameworkConfiguration();
    $interval(fetchFrameworkConfiguration, config.application.reloadInterval);

    fetchFrameworkInfo();

    fetchFrameworkStats();
    $interval(fetchFrameworkStats, config.application.reloadInterval);

    /** Tasks monitoring **/
    $scope.tasks = [];
    $scope.nodes = [];
    $scope.statesPercentage = [];

    $scope.taskStatesMapping = {
        TASK_STAGING: {
            progressBarType: "warning"
        },
        TASK_RUNNING: {
            progressBarType: "success"
        },
        TASK_FAILED: {
            progressBarType: "warning"
        },
        TASK_ERROR: {
            progressBarType: "danger"
        },
        TASK_STARTING: {
            progressBarType: "primary"
        },
        TASK_FINISHED: {
            progressBarType: "info"
        },
        TASK_LOST: {
            progressBarType: "danger"
        }
    };

    var updateStatesPercentage = function(states, tasksData) {
        var statesPercentage = [];
        angular.forEach(states, function(value, key) {
            if ($scope.taskStatesMapping[key]) {
                statesPercentage.push({
                    state: key,
                    type: $scope.taskStatesMapping[key].progressBarType,
                    percentage: Math.round(value.length / tasksData.length * 100)
                });
            }
        });
        statesPercentage.sort(function(a, b) {
            return (a.state < b.state) ? 1 : -1;
        });
        $scope.statesPercentage = statesPercentage;
    };

    var updateTasks = function(data) {
        $scope.tasks = data;
        var states = {};
        angular.forEach(data, function(value, key) {
            var task = value.toJSON();
            states.hasOwnProperty(task.runtimeInfo.state) || (states[task.runtimeInfo.state] = []);
            states[task.runtimeInfo.state].push(task.runtimeInfo.network.ip);
        });
        updateStatesPercentage(states, data);
    };

    var fetchTasks = function() {
        Tasks.query(function (tasks) {
            $scope.tasks = [];
            updateTasks(tasks);
            var webUiEnabled = (config.webUi && config.webUi.enabled ? config.webUi.enabled : false);
            if (webUiEnabled) {
                var webUiUrls = [];
                tasks.forEach(function (task) {
                    var tempTask = task.toJSON();
                    if (tempTask.name === config.webUi.name) {
                        webUiUrls.push("http://" + tempTask.runtimeInfo.network.ip + ":" + tempTask.runtimeInfo.network.ports[config.webUi.portIndex]);
                    }
                });
                if (webUiUrls.length > 0) {
                    $scope.webUi = {
                        enabled: true
                    };
                    if (config.webUi.random) {
                        // Select random endpoint
                        $scope.webUi.url = webUiUrls[Math.floor(Math.random()*webUiUrls.length)];
                    } else {
                        // Use first one
                        $scope.webUi.url = webUiUrls[0];
                    }
                }
            } else {
                $scope.webUi = {
                    enabled: false
                };
            }

        });
    };

    $scope.frameworkRestart = function() {
        var confirmation = prompt("Are you sure you want to restart the framework?\nThis may cause service downtime, please write yes in the box and click OK if you are sure.");
        console.log("Confirmation: " + confirmation);
        FrameworkRestart.save({
            sure: confirmation
        }, {});
    };

    $scope.restart = function(taskId) {
        if ($scope.moduleInfo && $scope.moduleInfo.restartHooks && $scope.moduleInfo.restartHooks.length > 0) {
            var index;
            for (index = 0; index < $scope.moduleInfo.restartHooks.length; index += 1) {
                if (!$scope.moduleInfo.restartHooks[index](taskId)) {
                    return;
                }
            }
        }
        console.log("Restarting task id: " + taskId);
        Restart.save({
            task: taskId
        }, {});
    };

    $scope.rollingRestart = function() {
        if ($scope.moduleInfo && $scope.moduleInfo.rollingRestartHooks && $scope.moduleInfo.rollingRestartHooks.length > 0) {
            var index;
            for (index = 0; index < $scope.moduleInfo.rollingRestartHooks.length; index += 1) {
                if (!$scope.moduleInfo.rollingRestartHooks[index]()) {
                    return;
                }
            }
        }
        var confirmation = prompt("Are you sure you want to restart all tasks?\nThis may cause service downtime, please write yes in the box and click OK if you are sure.");
        console.log("Confirmation: " + confirmation);
        RollingRestart.save({
            sure: confirmation
        }, {});
    };

    $scope.killAll = function () {
        var index;
        var confirmation;
        if ($scope.moduleInfo && $scope.moduleInfo.killAllHooks && $scope.moduleInfo.killAllHooks.length > 0) {
            for (index = 0; index < $scope.moduleInfo.killAllHooks.length; index += 1) {
                confirmation = $scope.moduleInfo.killAllHooks[index]();
                if (!confirmation) {
                    return;
                }
            }
        }
        var message = "Are you sure you want to kill all tasks? \nThis WILL cause service downtime and possibly data loss, please write yes in the box and click OK if you are sure.";
        if (confirmation === undefined) {
            confirmation = prompt(message);
        }
        console.log("Confirmation: " + confirmation);
        KillAll.save({
            sure: confirmation
        }, {});
    };

    $scope.killAllType = function (type) {
        var index;
        var confirmation;
        if ($scope.moduleInfo && $scope.moduleInfo.killAllTypeHooks && $scope.moduleInfo.killAllTypeHooks.length > 0) {
            for (index = 0; index < $scope.moduleInfo.killAllTypeHooks.length; index += 1) {
                confirmation = $scope.moduleInfo.killAllTypeHooks[index](type);
                if (!confirmation) {
                    return;
                }
            }
        }
        var message = "Are you sure you want to kill all " + type + " tasks? \nThis WILL cause service downtime and possibly data loss, please write yes in the box and click OK if you are sure.";
        if (confirmation === undefined) {
            confirmation = prompt(message);
        }
        console.log("Confirmation: " + confirmation);
        KillAllType.save({
            sure: confirmation,
            type: type
        }, {});
    };

    $scope.getTaskUptime = function (uptime) {
        if (uptime) {
            var diff = parseInt((Date.now() - uptime) / 1000);
            var days = parseInt(diff / 60 / 60 / 24);
            diff -= days * 24 * 60 * 60;
            var hours = parseInt(diff / 60 / 60);
            diff -= hours * 60 * 60;
            var mins = parseInt(diff / 60);
            diff -= mins * 60;
            var seconds = diff;
            var uptimeString = days.toString() + ":" + hours.toString() + ":" + (mins < 10 ? "0" : "") + mins.toString() + "." + (seconds < 10 ? "0" : "") + seconds.toString();
            return uptimeString;
        } else {
            return "unknown";
        }
    };

    fetchTasks();
    $interval(fetchTasks, config.application.reloadInterval);

});

controllers.controller('OverviewController', function($scope) {

});

controllers.controller('ScalingController', function($scope, $interval, config, Scaling, TaskTypes) {

    /** Framework info **/
    var fetchTaskTypes = function() {
        TaskTypes.getArray(function (types) {
            console.log(types.list);
            $scope.taskTypes = types.list;
        });
    };

    fetchTaskTypes();
    //$interval(fetchTaskTypes, config.application.reloadInterval);

    $scope.scaling = {
        nodes: $scope.$parent.configuration.ElasticsearchNodes,
        result: null
    };
    $scope.scalingSubmit = function() {
        if ($scope.scaling.nodes) {
            Scaling.save({}, { type: $scope.scaling.nodes});
        }
    };

    $scope.scale = function(type, instances) {
        console.log(type + " - " + instances);
        Scaling.save({
            type: type,
            instances: instances
        }, {});
    };

});

controllers.controller('LogsController', function ($scope, Logs) {

    /** Logs **/
    var fetchLogs = function() {
        Logs.getText(function (response) {
            console.log(response.content);
            $scope.logs = response.content; //.split("\n").join("<br>");
        });
    };

    fetchLogs();

});

controllers.controller('TasksController', function ($scope) {

});

controllers.controller('ConfigurationController', function ($scope) {

});
