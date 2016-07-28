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
    }).otherwise({
        redirectTo: '/'
    });
}]);
