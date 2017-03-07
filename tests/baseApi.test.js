/* jslint: node, es6
*/
"use strict";

// Internal modules
var fs = require("fs");

var baseApi = require("../lib/baseApi");

// Testing require
var expect = require('chai').expect;
var sinon = require("sinon");
var MockReq = require("mock-req");
var MockRes = require("mock-res");

describe("Base API tests", function () {
    it("killAllTasks - no param", function () {
        var res = new MockRes();
        res.json = function (object) {
            expect(object.error).to.be.a("string");
        };
        baseApi.killAllTasks(new MockReq(), res);
    });

    it("killAllTasks - param not yes", function () {
        var res = new MockRes();
        var req = new MockReq();
        req.url = "/?sure=ye";
        res.json = function (object) {
            expect(object.error).to.be.a("string");
        };
        baseApi.killAllTasks(req, res);
    });

    it("killAllTasks - yes - no tasks", function () {
        var res = new MockRes();
        var req = new MockReq();
        req.url = "/?sure=yes";
        req.scheduler = {launchedTasks: []};
        res.json = function (object) {
            expect(object.status).to.be.a("string");
            expect(object.status).to.equal("ok");
        };
        baseApi.killAllTasks(req, res);
    });

    it("killAllTasks - yes - with tasks", function () {
        var res = new MockRes();
        var req = new MockReq();
        req.url = "/?sure=yEs";
        req.scheduler = {launchedTasks: [{"taskId": "23241", "runtimeInfo": {"agentId": "3243223sgd"}}, {"taskId": "232g32gfd41", "runtimeInfo": {"agentId": "32432fs23sgd"}}]};
        req.scheduler.kill = function (taskId, agentId) {
            expect(taskId).to.be.a("string");
            expect(agentId).to.be.a("string");
        };
        res.json = function (object) {
            expect(object.status).to.be.a("string");
            expect(object.status).to.equal("ok");
        };
        baseApi.killAllTasks(req, res);
    });

    it("killAllTasksOfType - no param", function () {
        var res = new MockRes();
        res.json = function (object) {
            expect(object.error).to.be.a("string");
        };
        baseApi.killAllTasksOfType(new MockReq(), res);
    });

    it("killAllTasksOfType - param not yes", function () {
        var res = new MockRes();
        var req = new MockReq();
        req.url = "/?sure=ye";
        res.json = function (object) {
            expect(object.error).to.be.a("string");
        };
        baseApi.killAllTasksOfType(req, res);
    });

    it("killAllTasksOfType - yes - no tasks", function () {
        var res = new MockRes();
        var req = new MockReq();
        req.url = "/?sure=yes";
        req.params = {"type": "task"};
        req.scheduler = {launchedTasks: []};
        res.json = function (object) {
            expect(object.status).to.be.a("string");
            expect(object.status).to.equal("ok");
        };
        baseApi.killAllTasksOfType(req, res);
    });

    it("killAllTasksOfType - yes - with tasks", function () {
        var res = new MockRes();
        var req = new MockReq();
        req.params = {"type": "task"};
        req.url = "/?sure=yEs";
        req.scheduler = {launchedTasks: [
            {"name": "task-1234", "taskId": "23241", "runtimeInfo": {"agentId": "3243223sgd"}},
            {"name": "taski-1234", "taskId": "232g32gfd41", "runtimeInfo": {"agentId": "32432fs23sgd"}}]};
        req.scheduler.kill = function (taskId, agentId) {
            expect(taskId).to.be.a("string");
            expect(taskId).to.equal(req.scheduler.launchedTasks[0].taskId);
            expect(agentId).to.be.a("string");
        };
        res.json = function (object) {
            expect(object.status).to.be.a("string");
            expect(object.status).to.equal("ok");
        };
        baseApi.killAllTasksOfType(req, res);
    });

    it("healthCheck - undefined (error)", function () {
        var res = new MockRes();
        var req = new MockReq();
        req.scheduler = {};
        baseApi.healthCheck(req, res);
        expect(res.statusCode).to.equal(500);
    });

    it("healthCheck - OK", function () {
        var res = new MockRes();
        var req = new MockReq();
        req.scheduler = {};
        req.scheduler.lastHeartbeat = new Date().getTime();
        res.send = function (data) {
            expect(data).to.be.a("string");
            expect(data).to.equal("OK");
        };
        baseApi.healthCheck(req, res);
        expect(res.statusCode).to.equal(200);
    });

    it("restartFramework - working", function () {
        var res = new MockRes();
        var req = new MockReq();
        req.url = "/?sure=yEs";
        var clock = sinon.useFakeTimers();
        sinon.stub(process, "exit");
        res.json = function (object) {
            expect(object.status).to.be.a("string");
            expect(object.status).to.equal("ok");
        };
        baseApi.restartFramework(req, res);
        clock.tick(1000);
        expect(process.exit.callCount).to.equal(1);
        clock.restore();
        process.exit.restore();
    });

    it("restartFramework - undefined", function () {
        var res = new MockRes();
        var req = new MockReq();
        req.url = "/?suare=yes";
        var clock = sinon.useFakeTimers();
        sinon.stub(process, "exit");
        res.json = function (object) {
            expect(object.error).to.be.a("string");
        };
        baseApi.restartFramework(req, res);
        clock.tick(1000);
        expect(process.exit.callCount).to.equal(0);
        clock.restore();
        process.exit.restore();
    });

    it("restartFramework - invalid confirmation", function () {
        var res = new MockRes();
        var req = new MockReq();
        req.url = "/?sure=ye";
        var clock = sinon.useFakeTimers();
        sinon.stub(process, "exit");
        res.json = function (object) {
            expect(object.error).to.be.a("string");
        };
        baseApi.restartFramework(req, res);
        clock.tick(1000);
        expect(process.exit.callCount).to.equal(0);
        clock.restore();
        process.exit.restore();
    });

    it("getStats - no tasks", function () {
        var res = new MockRes();
        var req = new MockReq();
        req.scheduler = {};
        req.scheduler.launchedTasks = [];
        res.json = function (object) {
            expect(object.overall.cpus).to.equal(0);
            expect(object.overall.mem).to.equal(0);
            expect(object.overall.disk).to.equal(0);
            expect(object.overall.ports).to.equal(0);
            expect(object.overall.instances).to.equal(0);
        };
        baseApi.getStats(req, res);
    });

    it("getStats - tasks", function () {
        var res = new MockRes();
        var req = new MockReq();
        req.scheduler = {};
        req.scheduler.launchedTasks = [{name: "task-1321", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}}, {name: "task-215", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}}];
        res.json = function (object) {
            expect(object.overall.cpus).to.equal(1);
            expect(object.overall.mem).to.equal(256);
            expect(object.overall.disk).to.equal(100);
            expect(object.overall.ports).to.equal(4);
            expect(object.overall.instances).to.equal(2);
        };
        baseApi.getStats(req, res);
    });

    it("getTaskTypesStats - tasks", function () {
        var launchedTasks = [{name: "task-1321", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}},
                {name: "task-215", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}},
                {name: "task-2435", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {restarting: true}},
                {name: "task2-5", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {restarting: true}},
                {name: "task2-4325", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}}];
        var tasks = {"task": {allowScaling: true}, "task2": {}};

        var types = baseApi.getTaskTypesStats(tasks, launchedTasks);
        console.log(JSON.stringify(types));
        expect(types[0].runningInstances).to.equal(2);
        expect(types[0].type).to.equal("task");
        expect(types[0].allowScaling).to.be.true;
        expect(types[1].runningInstances).to.equal(1);
        expect(types[1].type).to.equal("task2");
        expect(types[1].allowScaling).to.be.undefined;
    });

    it("getTaskTypesStats - no tasks", function () {
        var launchedTasks = [];
        var tasks = {};

        var types = baseApi.getTaskTypesStats(tasks, launchedTasks);
        console.log(JSON.stringify(types));
        expect(types).to.be.an("array");
        expect(types).lengthOf(0);
    });

    it("taskRestart - no params", function () {
        var res = new MockRes();
        var req = new MockReq();
        res.json = function (object) {
            expect(object.error).to.be.a("string");
        };
        baseApi.taskRestart(req, res);
    });

    it("taskRestart - blank params", function () {
        var res = new MockRes();
        var req = new MockReq();
        req.params = {};
        res.json = function (object) {
            expect(object.error).to.be.a("string");
        };
        baseApi.taskRestart(req, res);
    });

    it("taskRestart - restarting", function () {
        var res = new MockRes();
        var req = new MockReq();
        req.params = {"task": "task232"};
        req.restartHelper = {restartTask: function (taskId, isRolling) {
            expect(isRolling).to.be.false;
            expect(taskId).to.equal("task232");
        }};
        res.json = function (object) {
            expect(object.status).to.be.a("string");
        };
        baseApi.taskRestart(req, res);
    });

    it("rollingRestart - working", function () {
        var res = new MockRes();
        var req = new MockReq();
        req.url = "/?sure=yEs";
        req.scheduler = {launchedTasks: []};
        req.restartHelper = {rollingRestart: function (array) {
            expect(array).to.be.an("array");
        }};
        res.json = function (object) {
            expect(object.status).to.be.a("string");
            expect(object.status).to.equal("ok");
        };
        baseApi.rollingRestart(req, res);
    });

    it("rollingRestart - undefined", function () {
        var res = new MockRes();
        var req = new MockReq();
        req.url = "/?suare=yes";
        res.json = function (object) {
            expect(object.error).to.be.a("string");
        };
        baseApi.rollingRestart(req, res);
    });

    it("rollingRestart - invalid confirmation", function () {
        var res = new MockRes();
        var req = new MockReq();
        req.url = "/?sure=ye";
        res.json = function (object) {
            expect(object.error).to.be.a("string");
        };
        baseApi.rollingRestart(req, res);
    });

    it("scale tasks - up", function () {
        var res = new MockRes();
        var req = new MockReq();
        var launchedTasks = [{name: "task-1321", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}},
                {name: "task-215", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}},
                {name: "task-2435", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {restarting: true}},
                {name: "task2-5", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {restarting: true}},
                {name: "task2-4325", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}}];
        var tasks = {"task": {allowScaling: true}, "task2": {}};
        req.tasks = tasks;
        req.params = {type: "task", "instances": 3};
        req.scheduler = {launchedTasks: launchedTasks, pendingTasks: []};
        res.send = function () {
            expect(true).to.be.true;
        };
        baseApi.scaleTasks(req, res);
        expect(req.scheduler.pendingTasks).to.have.lengthOf(1);
    });

    it("scale tasks - noop", function () {
        var res = new MockRes();
        var req = new MockReq();
        var launchedTasks = [{name: "task-1321", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}},
                {name: "task-215", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}},
                {name: "task-2435", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {restarting: true}},
                {name: "task2-5", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {restarting: true}},
                {name: "task2-4325", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}}];
        var tasks = {"task": {allowScaling: true}, "task2": {}};
        req.tasks = tasks;
        req.params = {type: "task", "instances": 2};
        req.scheduler = {launchedTasks: launchedTasks, pendingTasks: []};
        res.send = function () {
            expect(true).to.be.true;
        };
        baseApi.scaleTasks(req, res);
        expect(req.scheduler.pendingTasks).to.have.lengthOf(0);
    });

    it("scale tasks - up - scaling not allowed", function () {
        var res = new MockRes();
        var req = new MockReq();
        var launchedTasks = [{name: "task-1321", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}},
                {name: "task-215", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}},
                {name: "task-2435", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {restarting: true}},
                {name: "task2-5", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {restarting: true}},
                {name: "task2-4325", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}}];
        var tasks = {"task": {}, "task2": {}};
        req.tasks = tasks;
        req.params = {type: "task", "instances": 3};
        req.scheduler = {launchedTasks: launchedTasks, pendingTasks: []};
        res.send = function () {
            expect(true).to.be.true;
        };
        baseApi.scaleTasks(req, res);
        expect(req.scheduler.pendingTasks).to.have.lengthOf(0);
    });

    it("scale tasks - down", function () {
        var res = new MockRes();
        var req = new MockReq();
        var killed = 0;
        var launchedTasks = [{name: "task-3", taskId: "3412412fsaffsa", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}},
                {name: "task-1", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}},
                {name: "task-2", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}},
                {name: "task-4", taskId: "3412412fsags2ffsa", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}},
                {name: "task2-5", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {restarting: true}},
                {name: "task2-4325", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}}];
        var tasks = {"task": {allowScaling: true}, "task2": {}};
        req.tasks = tasks;
        req.params = {type: "task", "instances": 2};
        req.scheduler = {launchedTasks: launchedTasks, pendingTasks: [], logger: {debug: function (message) {
            console.log("DEBUG: " + message);
        }}};
        req.scheduler.kill = function name(taskId, agentId) {
            expect(taskId).to.be.a("string");
            killed += 1;
        };
        req.scheduler.logger.info = function (message) {
            console.log("INFO: " + message);
        };
        res.send = function () {
            expect(true).to.be.true;
        };
        baseApi.scaleTasks(req, res);
        expect(req.scheduler.pendingTasks).to.have.lengthOf(0);
        expect(req.scheduler.launchedTasks).to.have.lengthOf(4);
        expect(killed).to.equal(2);
    });

    it("scale tasks - zero", function () {
        var res = new MockRes();
        var req = new MockReq();
        var killed = 0;
        var launchedTasks = [{name: "task-3", taskId: "3412412fsaffsa", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}},
                {name: "task-1", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}},
                {name: "task-2", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}},
                {name: "task-4", taskId: "3412412fsags2ffsa", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}},
                {name: "task2-5", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {restarting: true}},
                {name: "task2-4325", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}}];
        var tasks = {"task": {allowScaling: true}, "task2": {}};
        req.tasks = tasks;
        req.params = {type: "task", "instances": 0};
        req.scheduler = {launchedTasks: launchedTasks, pendingTasks: [], logger: {debug: function (message) {
            console.log("DEBUG: " + message);
        }}};
        req.scheduler.kill = function name(taskId, agentId) {
            expect(taskId).to.be.a("string");
            killed += 1;
        };
        req.scheduler.logger.info = function (message) {
            console.log("INFO: " + message);
        };
        res.send = function () {
            expect(true).to.be.true;
        };
        baseApi.scaleTasks(req, res);
        expect(req.scheduler.pendingTasks).to.have.lengthOf(0);
        expect(req.scheduler.launchedTasks).to.have.lengthOf(6);
        expect(killed).to.equal(0);
    });

    it("scale tasks - 1 down pending", function () {
        var res = new MockRes();
        var req = new MockReq();
        var killed = 0;
        var launchedTasks = [{name: "task-3", taskId: "3412412fsaffsa", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}},
                {name: "task-1", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}},
                {name: "task-2", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}},
                {name: "task-4", taskId: "3412412fsags2ffsa", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}},
                {name: "task2-5", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {restarting: true}},
                {name: "task2-4325", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}}];
        var tasks = {"task": {allowScaling: true}, "task2": {}};
        req.tasks = tasks;
        req.params = {type: "task", "instances": 2};
        req.scheduler = {launchedTasks: launchedTasks, pendingTasks:
                [{name: "task-4", taskId: "3412412fsags2ffsa", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}}],
                logger: {debug: function (message) {
            console.log("DEBUG: " + message);
        }}};
        req.scheduler.kill = function name(taskId, agentId) {
            expect(taskId).to.be.a("string");
            killed += 1;
        };
        req.scheduler.logger.info = function (message) {
            console.log("INFO: " + message);
        };
        res.send = function () {
            expect(true).to.be.true;
        };
        baseApi.scaleTasks(req, res);
        expect(req.scheduler.pendingTasks).to.have.lengthOf(0);
        expect(req.scheduler.launchedTasks).to.have.lengthOf(5);
        expect(killed).to.equal(1);
    });

    it("scale tasks - 2 down pending", function () {
        var res = new MockRes();
        var req = new MockReq();
        var killed = 0;
        var launchedTasks = [{name: "task-3", taskId: "3412412fsaffsa", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}},
                {name: "task-1", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}},
                {name: "task-2", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}},
                {name: "task-4", taskId: "3412412fsags2ffsa", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}},
                {name: "task2-5", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {restarting: true}},
                {name: "task2-4325", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}}];
        var tasks = {"task": {allowScaling: true}, "task2": {}};
        req.tasks = tasks;
        req.params = {type: "task", "instances": 3};
        req.scheduler = {launchedTasks: launchedTasks, pendingTasks:
                [{name: "task-4", taskId: "3412412fsags2ffsa", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}},
                {name: "tasks-4", taskId: "3412412fsags2ffsa", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}}],
                logger: {debug: function (message) {
            console.log("DEBUG: " + message);
        }}};
        req.scheduler.kill = function name(taskId, agentId) {
            expect(taskId).to.be.a("string");
            killed += 1;
        };
        req.scheduler.logger.info = function (message) {
            console.log("INFO: " + message);
        };
        res.send = function () {
            expect(true).to.be.true;
        };
        baseApi.scaleTasks(req, res);
        expect(req.scheduler.pendingTasks).to.have.lengthOf(1);
        expect(req.scheduler.launchedTasks).to.have.lengthOf(6);
        expect(killed).to.equal(0);
    });

    it("getTaskTypes - tasks", function () {
        var res = new MockRes();
        var req = new MockReq();
        var launchedTasks = [{name: "task-1321", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}},
                {name: "task-215", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}},
                {name: "task-2435", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {restarting: true}},
                {name: "task2-5", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {restarting: true}},
                {name: "task2-4325", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}}];
        req.tasks = {"task": {allowScaling: true}, "task2": {}};
        req.scheduler = {launchedTasks: launchedTasks};
        res.json = function (object) {
            expect(object).to.be.an("array");
        };
        var types = baseApi.getTaskTypes(req, res);
    });

    it("getTaskTypes - no tasks", function () {
        var res = new MockRes();
        var req = new MockReq();
        var launchedTasks = [{name: "task-1321", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}},
                {name: "task-215", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}},
                {name: "task-2435", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {restarting: true}},
                {name: "task2-5", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {restarting: true}},
                {name: "task2-4325", resources: {"cpus": 0.5, mem: 128, disk: 50, ports: 2}, "runtimeInfo": {}}];
        req.tasks = {};
        req.scheduler = {launchedTasks: launchedTasks};
        res.json = function (object) {
            expect(object).to.be.an("array");
        };
        var types = baseApi.getTaskTypes(req, res);
    });

    it("getLogs", function (done) {
        var res = new MockRes();
        var req = new MockReq();
        sinon.stub(fs, "createReadStream", function (fileName, object) {
            expect(object).to.be.an("object");
            expect(fileName).to.be.a("string");
            expect(fileName).to.equal("/1234/432/test123");
            return {pipe: function (output) {
                expect(output).to.equal(res);
                fs.createReadStream.restore();
                done();
            }};
        });
        req.scheduler = {"logger": {"transports": {"dailyRotateFile": {filename: "test123", "dirname": "/1234/432"}}}};
        baseApi.getLogs(req, res);
    });

    it("moduleList", function (done) {
        var res = new MockRes();
        var req = new MockReq();
        res.send = function (result) {
            expect(result).to.equal(req.frameworkConfiguration.moduleList.join("\n") + "\n");
            done();
        };
        req.frameworkConfiguration = {
            "moduleList": ["mod1", "mod2"]
        };
        baseApi.moduleList(req, res);
    });
});
