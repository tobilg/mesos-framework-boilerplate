var controllers = angular.module('mesos-framework-ui.controllers', []);

controllers.controller('MainController', function($scope, $interval, $route, config, FrameworkStats, FrameworkInformation, FrameworkConfiguration, Tasks) {
    $scope.$route = $route;

    /** Responsiveness helpers **/
    var mobileView = 992;
    $scope.getWidth = function() {
        return window.innerWidth;
    };
    $scope.$watch($scope.getWidth, function(newValue, oldValue) {
        if (newValue >= mobileView) {
            $scope.toggle = true;
        } else {
            $scope.toggle = false;
        }
    });
    $scope.toggleSidebar = function() {
        $scope.toggle = !$scope.toggle;
    };
    window.onresize = function() {
        $scope.$apply();
    };

    /** Framework configuration **/
    var fetchFrameworkConfiguration = function() {
        FrameworkConfiguration.get(function (configuration) {
            $scope.name = configuration.frameworkName;
            $scope.configuration = configuration.toJSON();
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
