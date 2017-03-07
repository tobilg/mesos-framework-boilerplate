"use strict";
var app = angular.module('mesos-framework-ui', [
    'ngRoute',
    'ngResource',
    'ui.bootstrap',
    'jsonFormatter',
	'mesos-framework-ui.config',
	'mesos-framework-ui.controllers',
	'mesos-framework-ui.directives',
	'mesos-framework-ui.services'
]);

var modulesAvailable = [];
var modulesLoaded = false;
$.get(window.location.protocol + '//' + window.location.host + window.location.pathname + "/moduleList", function (data) {
    if (data) {
        var list = data.split("\n");
        if (list && list.length > 0) {
            modulesAvailable = list;
            modulesLoaded = true;
            var hash = window.location.hash.split("/");
            if (hash.length > 1 && modulesAvailable.indexOf(hash[hash.length - 1]) === -1) {
                window.location.hash = "/";
            }
        }
    }
});

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/', {
        templateUrl: 'partials/overview.html',
        controller: 'OverviewController',
        activeTab: 'cluster'
    }).when('/tasks', {
        templateUrl: 'partials/tasks.html',
        controller: 'TasksController',
        activeTab: 'tasks'
    }).when('/scaling', {
        templateUrl: 'partials/scaling.html',
        controller: 'ScalingController',
        activeTab: 'scaling'
    }).when('/configuration', {
        templateUrl: 'partials/configuration.html',
        controller: 'ConfigurationController',
        activeTab: 'configuration'
    }).when('/logs', {
        templateUrl: 'partials/logs.html',
        controller: 'LogsController',
        activeTab: 'logs'
    }).when('/module/:moduleName', {
        templateUrl: function (params) {
            //$$route.activeTab = params.moduleName;
            return 'partials/' + params.moduleName + '.html';
        },
        /*controller: function (params) {
            return params.moduleName.charAt(0).toUpperCase() + params.moduleName.slice(1) + 'Controller';
        },
        activeTab: moduleName,*/
        redirectTo: function (params) {
            if (modulesLoaded && modulesAvailable.indexOf(params.moduleName) === -1) {
                return "/";
            }
            return undefined;
        }
    }).otherwise({
        redirectTo: '/'
    });
}]);
