"use strict";

const fs = require("fs");
var EventEmitter = require('events').EventEmitter;
var util = require("util");
var Scheduler;
var Mesos;
var helpers;

// Instantiate the mesos-framework module related objects
if (fs.existsSync("../mesos-framework")) {
    Scheduler = require("../mesos-framework").Scheduler;
    Mesos = require("../mesos-framework").Mesos.getMesos();
    helpers = require("../mesos-framework").helpers;
} else {
    Scheduler = require("mesos-framework").Scheduler;
    Mesos = require("mesos-framework").Mesos.getMesos();
    helpers = require("mesos-framework").helpers;
}

var RestartHelper = require("../lib/restartHelper");

// Testing require
var expect = require('chai').expect;
var sinon = require("sinon");

describe("Restart task", function () {

    var sandbox;
    var scheduler;
    var clock;

    var ContainerInfo = new Mesos.ContainerInfo(
        Mesos.ContainerInfo.Type.DOCKER, // Type
        null, // Volumes
        null, // Hostname
        new Mesos.ContainerInfo.DockerInfo(
            "tobilg/mini-webserver", // Image
            Mesos.ContainerInfo.DockerInfo.Network.BRIDGE, // Network
            {
                "host_port": 8081,
                "container_port": 0,
                // Protocol to expose as (ie: tcp, udp).
                "protocol": "tcp"
            },
            false, // Privileged
            null,  // Parameters
            false, // forcePullImage
            null   // Volume Driver
        )
    );

    var runtimeInfo = {agentId: "agentId-before-restart"};

    var task1 = {
        "name": "vault-1",
        "taskId": "12220-3440-12532-my-task",
        "containerInfo": ContainerInfo,
        "runtimeInfo": runtimeInfo,
        "commandInfo": new Mesos.CommandInfo(
            null, // URI
            new Mesos.Environment([
                new Mesos.Environment.Variable("FOO", "BAR1")
            ]), // Environment
            false, // Is shell?
            null, // Command
            null, // Arguments
            null // User
        ),
        "resources": {
            "cpus": 0.2,
            "mem": 128,
            "ports": 2,
            "disk": 10
        }
    };

    var task2 = {
        "name": "vault-2",
        "taskId": "12220-3440-12532-my-task2",
        "containerInfo": ContainerInfo,
        "runtimeInfo": runtimeInfo,
        "commandInfo": new Mesos.CommandInfo(
            null, // URI
            new Mesos.Environment([
                new Mesos.Environment.Variable("FOO", "BAR2")
            ]), // Environment
            false, // Is shell?
            null, // Command
            null, // Arguments
            null // User
        ),
        "resources": {
            "cpus": 0.2,
            "mem": 128,
            "ports": 2,
            "disk": 10
        }
    };

    var task3 = {
        "name": "vault-3",
        "taskId": "12220-3440-12532-my-task3",
        "containerInfo": ContainerInfo,
        "runtimeInfo": runtimeInfo,
        "commandInfo": new Mesos.CommandInfo(
            null, // URI
            new Mesos.Environment([
                new Mesos.Environment.Variable("FOO", "BAR3")
            ]), // Environment
            false, // Is shell?
            null, // Command
            null, // Arguments
            null // User
        ),
        "resources": {
            "cpus": 0.2,
            "mem": 128,
            "ports": 2,
            "disk": 10
        }
    };

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
        scheduler = sinon.createStubInstance(Scheduler);
        clock = sinon.useFakeTimers();
    });
    afterEach(function () {
        sandbox.restore();
        clock.restore();
    });

    it("Set useHealthcheck", function () {
        var logger = helpers.getLogger(null, null, "debug");
        var logspy = sinon.spy(logger, "debug");

        scheduler.logger = logger;
        scheduler.launchedTasks = [];
        scheduler.tasks = [task1];
        var restartHelper = new RestartHelper(scheduler);
        expect(restartHelper.useHealthcheck).to.be.false;
        restartHelper.setUseHealthcheck(true);
        expect(restartHelper.useHealthcheck).to.be.true;
    });

    it("Task was not found in launched", function () {

        var logger = helpers.getLogger(null, null, "debug");
        var logspy = sinon.spy(logger, "debug");

        scheduler.logger = logger;
        scheduler.launchedTasks = [];
        scheduler.tasks = [task1];
        var restartHelper = new RestartHelper(scheduler);

        restartHelper.restartTask("taskid-1111", false);

        sinon.assert.calledOnce(logspy);
        sinon.assert.calledWith(logspy, "Can't restart task that is not running.");

    });

    it("Offer for cloned not arrived yet", function (end) {

        var logger = helpers.getLogger(null, null, "debug");
        var killSent = false;

        scheduler.logger = logger;
        scheduler.tasks = [task1];
        scheduler.launchedTasks = [task1];
        scheduler.pendingTasks = [];
        scheduler.kill = function (taskId, agentId) {
            killSent = true;
        };

        var restartHelper = new RestartHelper(scheduler);

        restartHelper.restartTask(task1.taskId, false);

        setTimeout(function () {
            expect(killSent).to.equal(false);
            end();
        }, 500);

        clock.tick(500)
    });

    it("Cloned was launched", function (done) {

        this.timeout(5000);

        var logger = helpers.getLogger(null, null, "debug");
        var killSent = false;
        function SchedulerStub() {
            // Inherit from EventEmitter
            EventEmitter.call(this);
            return this;
        };

        util.inherits(SchedulerStub, EventEmitter);

        var scheduler = new SchedulerStub();

        scheduler.logger = logger;
        scheduler.launchedTasks = [task1];
        scheduler.pendingTasks = [];
        scheduler.tasks = [task1];
        scheduler.options = {"useZk": "false"};
        scheduler.kill = function (taskId, agentId) {
            killSent = true;
        };

        var restartHelper = new RestartHelper(scheduler);

        restartHelper.restartTask(task1.taskId, false);

        var interval = setInterval(function () {
            if (scheduler.pendingTasks.length > 0) {
                var task = scheduler.pendingTasks[0];
                scheduler.pendingTasks[0].runtimeInfo = {
                    agentId: "agent-1234",
                    executorId: "exec-1234",
                    state: "TASK_RUNNING"
                };
                scheduler.launchedTasks.push(scheduler.pendingTasks.splice(0, 1));
                scheduler.emit("task_launched", task);
            }
        }, 1000);

        setTimeout(function () {
            clearInterval(interval);
            expect(killSent).to.equal(true);
            done();
        }, 3000);

        clock.tick(1000);
        clock.tick(1000);
        clock.tick(1000);
    });

    it("Cloned was launched - healthy", function (done) {

        this.timeout(5000);

        var logger = helpers.getLogger(null, null, "debug");
        var killSent = false;
        function SchedulerStub() {
            // Inherit from EventEmitter
            EventEmitter.call(this);
            return this;
        };

        util.inherits(SchedulerStub, EventEmitter);

        var scheduler = new SchedulerStub();

        scheduler.logger = logger;
        scheduler.launchedTasks = [task1];
        scheduler.pendingTasks = [];
        scheduler.tasks = [task1];
        scheduler.options = {"useZk": "false"};
        scheduler.kill = function (taskId, agentId) {
            killSent = true;
        };

        var restartHelper = new RestartHelper(scheduler, {"useHealthcheck": true});

        restartHelper.restartTask(task1.taskId, false);

        var interval = setInterval(function () {
            if (scheduler.pendingTasks.length > 0) {
                var task = scheduler.pendingTasks[0];
                scheduler.pendingTasks[0].runtimeInfo = {
                    agentId: "agent-1234",
                    executorId: "exec-1234",
                    state: "TASK_RUNNING",
                    healthy: true
                };
                scheduler.launchedTasks.push(scheduler.pendingTasks.splice(0, 1));
                scheduler.emit("task_launched", task);
            }
        }, 1000);

        setTimeout(function () {
            clearInterval(interval);
            expect(killSent).to.equal(true);
            done();
        }, 3000);

        clock.tick(1000);
        clock.tick(1000);
        clock.tick(1000);
    });


    it("Cloned was launched - not healthy", function (done) {

        this.timeout(5000);

        var logger = helpers.getLogger(null, null, "debug");
        var killSent = false;
        function SchedulerStub() {
            // Inherit from EventEmitter
            EventEmitter.call(this);
            return this;
        };

        util.inherits(SchedulerStub, EventEmitter);

        var scheduler = new SchedulerStub();

        scheduler.logger = logger;
        scheduler.launchedTasks = [task1];
        scheduler.pendingTasks = [];
        scheduler.tasks = [task1];
        scheduler.options = {"useZk": "false"};
        scheduler.kill = function (taskId, agentId) {
            killSent = true;
        };

        var restartHelper = new RestartHelper(scheduler, {"useHealthcheck": true});

        restartHelper.restartTask(task1.taskId, false);

        var interval = setInterval(function () {
            if (scheduler.pendingTasks.length > 0) {
                var task = scheduler.pendingTasks[0];
                scheduler.pendingTasks[0].runtimeInfo = {
                    agentId: "agent-1234",
                    executorId: "exec-1234",
                    state: "TASK_RUNNING"
                };
                scheduler.launchedTasks.push(scheduler.pendingTasks.splice(0, 1));
                scheduler.emit("task_launched", task);
            }
        }, 1000);

        setTimeout(function () {
            clearInterval(interval);
            expect(killSent).to.equal(false);
            done();
        }, 3000);

        clock.tick(1000);
        clock.tick(1000);
        clock.tick(1000);
    });

    it("Rolling restart", function (done) {

        this.timeout(16000);

        var rollingRestartEnded = false;

        var logger = helpers.getLogger(null, null, "debug");

        function SchedulerStub() {
            // Inherit from EventEmitter
            EventEmitter.call(this);
            return this;
        };

        util.inherits(SchedulerStub, EventEmitter);

        var scheduler = new SchedulerStub();

        scheduler.logger = logger;
        scheduler.launchedTasks = [task1, task2, task3];
        var tasks = scheduler.launchedTasks.slice(0);
        scheduler.pendingTasks = [];
        scheduler.tasks = [task1];
        scheduler.options = {"useZk": "false"};

        scheduler.kill = function (taskId, agentId) {
            scheduler.logger.debug("Task kill request was sent " + taskId)
            var task = findTask(taskId, scheduler.launchedTasks);
            scheduler.launchedTasks.splice(scheduler.launchedTasks.indexOf(task), 1);
        };

        var restartHelper = new RestartHelper(scheduler);

        scheduler.on("endrollingrestart", function () {
            rollingRestartEnded = true;
        });

        restartHelper.rollingRestart(tasks);

        // Offer was recieved
        var interval = setInterval(function () {
            var task;
            if (scheduler.pendingTasks.length > 0) {
                task = scheduler.pendingTasks[0];
                scheduler.pendingTasks[0].runtimeInfo = {
                    agentId: "agentId-after-restart",
                    executorId: "exec-1234",
                    state: "TASK_RUNNING"
                };
                scheduler.launchedTasks.push(scheduler.pendingTasks.splice(0, 1)[0]);
                scheduler.emit("task_launched", task);
            }
        }, 1000);


        scheduler.on("endrollingrestart", function () {
            clearInterval(interval);
            expect(rollingRestartEnded).to.equal(true);

            for (var i=0; i<scheduler.launchedTasks.length; i++){
                expect(scheduler.launchedTasks[i].runtimeInfo.agentId).to.equal("agentId-after-restart");
            }

            scheduler.logger.debug("launched:" + JSON.stringify(scheduler.launchedTasks));
            scheduler.logger.debug("pending:" + JSON.stringify(scheduler.pendingTasks));
            done();
        });

        for (var i=0; i<16 ; i++){
            clock.tick(1000);
        }
    });

});


function findTask(taskId, tasks) {
    // Iterate over tasks
    for (var index = 0; index < tasks.length; index++) {
        var task = tasks[index];
        if (task.taskId === taskId) {
            return task;
        }
    }
    return null;
}