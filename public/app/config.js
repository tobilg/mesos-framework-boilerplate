angular.module('mesos-framework-ui.config', []).
    value('config', {
        charts: {
            history: 50,
            interval: 5000
        },
        application: {
            apiPrefix: "api/v1",
            reloadInterval: 3000
        },
        webUi: {
            "enabled": true,
            "name": "jobmanagers", // Task name to match
            "portIndex": 1, // The port index on which the WebUI listens
            "random": true // Select a random instance
        }
    });