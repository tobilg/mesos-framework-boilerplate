var services = angular.module('mesos-framework-ui.services', []);

var baseURL = window.location.protocol + '//' + window.location.host + window.location.pathname;

services.factory('FrameworkConfiguration', function($resource, config) {
    var URL = baseURL + config.application.apiPrefix + '/framework/configuration';
    return $resource(URL);
});

services.factory('FrameworkInformation', function($resource, config) {
    var URL = baseURL + config.application.apiPrefix + '/framework/info';
    return $resource(URL);
});

services.factory('FrameworkStats', function($resource, config) {
    var URL = baseURL + config.application.apiPrefix + '/framework/stats';
    return $resource(URL);
});

services.factory('Scaling', function($resource, config) {
    var URL = baseURL + config.application.apiPrefix + '/tasks/types/:type/scale/:instances';
    return $resource(URL, {}, {
        save: {
            method: 'PUT'
        }
    });
});

services.factory('Tasks', function($resource, config) {
    var URL = baseURL + config.application.apiPrefix + '/tasks/launched';
    return $resource(URL);
});

services.factory('TaskTypes', function($resource, config) {
    var URL = baseURL + config.application.apiPrefix + '/tasks/types';
    return $resource(URL, {}, {
        'getArray': {
            transformResponse: function (data, headersGetter, status) {
                return { list: angular.fromJson(data) };
            }
        }
    });
});

services.factory('Logs', function($resource, config) {
    var URL = baseURL + config.application.apiPrefix + '/logs';
    return $resource(URL, {}, {
        'getText': {
            transformResponse: function (data, headersGetter, status) {
                return {content: data};
            }
        }
    });
});