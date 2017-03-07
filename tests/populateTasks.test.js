"use strict";

// NPM modules
var _ = require("lodash");

// Project modules
var populateTasks = require("../lib/populateTasks");

// Testing require
var expect = require("chai").expect;
var sinon = require("sinon");

describe("populateTasks", function () {
    var oldEnv;
    var sandbox;
    beforeEach(function () {
        oldEnv = _.cloneDeep(process.env);
        sandbox = sinon.sandbox.create();
    });
    afterEach(function () {
        process.env = oldEnv;
        sandbox.restore();
    });
    it("no tasks", function () {
        process.env.TASK_DEF_NUM = "0";
        populateTasks.populateTasks();
    });
    it("no task vars", function () {
        process.env.TASK_DEF_NUM = "1";
        var err;
        try {
            populateTasks.populateTasks();
        } catch (error) {
            err = error;
        }
        expect(err).to.be.an.error;
    });
    it("with minimal task vars", function () {
        process.env.TASK_DEF_NUM = "1";
        process.env.TASK0_NAME = "fsafsa";
        process.env.TASK0_NUM_INSTANCES = "2";
        process.env.TASK0_CPUS = "0.5";
        process.env.TASK0_MEM = "256";
        process.env.TASK0_IMAGE = "alpine";

        var err;
        var tasks;
        try {
            tasks = populateTasks.populateTasks();
        } catch (error) {
            err = error;
        }
        expect(tasks).to.be.an("object");
        expect(err).to.not.be.an.error;
    });
    it.skip("createTaskInfo with disallowed scaling", function () {
        process.env.TASK_DEF_NUM = "1";
        process.env.TASK0_NAME = "fsafsa";
        process.env.TASK0_NUM_INSTANCES = "2";
        process.env.TASK0_CPUS = "0.5";
        process.env.TASK0_MEM = "256";
        process.env.TASK0_IMAGE = "alpine";
        process.env.TASK0_ALLOW_SCALING = "false";

        var err;
        var task;
        try {
            task = populateTasks.createTaskInfo(0);
        } catch (error) {
            err = error;
        }
        expect(task).to.be.an("object");
        expect(task.allowScaling).to.be.false;
        expect(err).to.not.be.an.error;
    });
    it("createTaskInfo with enabled scaling", function () {
        process.env.TASK_DEF_NUM = "1";
        process.env.TASK0_NAME = "fsafsa";
        process.env.TASK0_NUM_INSTANCES = "2";
        process.env.TASK0_CPUS = "0.5";
        process.env.TASK0_MEM = "256";
        process.env.TASK0_IMAGE = "alpine";
        process.env.TASK0_ALLOW_SCALING = "true";

        var err;
        var task;
        try {
            task = populateTasks.createTaskInfo(0);
        } catch (error) {
            err = error;
        }
        expect(task).to.be.an("object");
        expect(task.allowScaling).to.be.true;
        expect(err).to.not.be.an.error;
    });
    it("createTaskInfo with enabled scaling and URI", function () {
        process.env.TASK0_NAME = "fsafsa";
        process.env.TASK0_NUM_INSTANCES = "2";
        process.env.TASK0_CPUS = "0.5";
        process.env.TASK0_MEM = "256";
        process.env.TASK0_IMAGE = "alpine";
        process.env.TASK0_ALLOW_SCALING = "true";
        process.env.TASK0_URI = "fdsgfds";

        var err;
        var task;
        try {
            task = populateTasks.createTaskInfo(0);
        } catch (error) {
            err = error;
        }
        expect(task).to.be.an("object");
        expect(task.allowScaling).to.be.true;
        expect(task.commandInfo.uris[0]).to.be.an("object");
        expect(task.commandInfo.uris[0].value).to.equal("fdsgfds");
        expect(err).to.not.be.an.error;
    });
    it("createTaskInfo with enabled scaling and args", function () {
        process.env.TASK0_NAME = "fsafsa";
        process.env.TASK0_NUM_INSTANCES = "2";
        process.env.TASK0_CPUS = "0.5";
        process.env.TASK0_MEM = "256";
        process.env.TASK0_IMAGE = "alpine";
        process.env.TASK0_ALLOW_SCALING = "true";
        process.env.TASK0_ARGS = "[\"fdsgfds\"]";

        var err;
        var task;
        try {
            task = populateTasks.createTaskInfo(0);
        } catch (error) {
            err = error;
        }
        expect(task).to.be.an("object");
        expect(task.allowScaling).to.be.true;
        expect(task.commandInfo.arguments).to.be.an("array");
        expect(err).to.not.be.an.error;
    });
    it("createTaskInfo with enabled scaling and ports", function () {
        process.env.TASK0_NAME = "fsafsa";
        process.env.TASK0_NUM_INSTANCES = "2";
        process.env.TASK0_CPUS = "0.5";
        process.env.TASK0_MEM = "256";
        process.env.TASK0_IMAGE = "alpine";
        process.env.TASK0_ALLOW_SCALING = "true";
        process.env.TASK0_PORT_NUM = "5";

        var err;
        var task;
        try {
            task = populateTasks.createTaskInfo(0);
        } catch (error) {
            err = error;
        }
        expect(task).to.be.an("object");
        expect(task.allowScaling).to.be.true;
        expect(task.resources.ports).to.equal(5);
        expect(err).to.not.be.an.error;
    });
    it("createTaskInfo with enabled scaling and static ports", function () {
        process.env.TASK0_NAME = "fsafsa";
        process.env.TASK0_NUM_INSTANCES = "2";
        process.env.TASK0_CPUS = "0.5";
        process.env.TASK0_MEM = "256";
        process.env.TASK0_IMAGE = "alpine";
        process.env.TASK0_ALLOW_SCALING = "true";
        process.env.TASK0_FIXED_PORTS = "5,32";

        var err;
        var task;
        try {
            task = populateTasks.createTaskInfo(0);
        } catch (error) {
            err = error;
        }
        expect(task).to.be.an("object");
        expect(task.allowScaling).to.be.true;
        expect(task.resources.staticPorts[0]).to.equal(5);
        expect(task.resources.staticPorts[1]).to.equal(32);
        expect(err).to.not.be.an.error;
    });
    it("createTaskInfo with enabled scaling and health check", function () {
        process.env.TASK0_NAME = "fsafsa";
        process.env.TASK0_NUM_INSTANCES = "2";
        process.env.TASK0_CPUS = "0.5";
        process.env.TASK0_MEM = "256";
        process.env.TASK0_IMAGE = "alpine";
        process.env.TASK0_ALLOW_SCALING = "true";
        process.env.TASK0_HEALTHCHECK = "/fdsfds/fdsf";
        process.env.TASK0_HEALTHCHECK_PORT = "0";
        process.env.TASK0_NOCOLOCATION = "false";

        var err;
        var task;
        try {
            task = populateTasks.createTaskInfo(0);
        } catch (error) {
            err = error;
        }
        expect(task).to.be.an("object");
        expect(task.allowScaling).to.be.true;
        expect(task.noColocation).to.be.false;
        expect(err).to.not.be.an.error;
    });
    it("createTaskInfo with enabled scaling and task env", function () {
        process.env.TASK0_NAME = "fsafsa";
        process.env.TASK0_NUM_INSTANCES = "2";
        process.env.TASK0_CPUS = "0.5";
        process.env.TASK0_MEM = "256";
        process.env.TASK0_IMAGE = "alpine";
        process.env.TASK0_ALLOW_SCALING = "true";
        process.env.TASK0_ENV = "{\"VAR2\": \"value\"}";

        var err;
        var task;
        try {
            task = populateTasks.createTaskInfo(0);
        } catch (error) {
            err = error;
        }
        expect(task).to.be.an("object");
        expect(task.allowScaling).to.be.true;
        expect(task.noColocation).to.be.false;
        expect(err).to.not.be.an.error;
    });
    it("createTaskInfo with enabled scaling and no collocation", function () {
        process.env.TASK0_NAME = "fsafsa";
        process.env.TASK0_NUM_INSTANCES = "2";
        process.env.TASK0_CPUS = "0.5";
        process.env.TASK0_MEM = "256";
        process.env.TASK0_IMAGE = "alpine";
        process.env.TASK0_ALLOW_SCALING = "true";
        process.env.TASK0_ENV = "{\"VAR2\": \"value\"}";
        process.env.TASK0_NOCOLOCATION = "true";

        var err;
        var task;
        try {
            task = populateTasks.createTaskInfo(0);
        } catch (error) {
            err = error;
        }
        expect(task).to.be.an("object");
        expect(task.noColocation).to.be.true;
        expect(err).to.not.be.an.error;
    });
    it("createContainerInfo - basic", function () {
        process.env.TASK0_NAME = "fsafsa";
        process.env.TASK0_NUM_INSTANCES = "2";
        process.env.TASK0_CPUS = "0.5";
        process.env.TASK0_MEM = "256";
        process.env.TASK0_IMAGE = "alpine";
        process.env.TASK0_ALLOW_SCALING = "true";
        process.env.TASK0_ENV = "{\"VAR2\": \"value\"}";

        var err;
        var container;
        try {
            container = populateTasks.createContainerInfo(0);
        } catch (error) {
            err = error;
        }
        expect(container).to.be.an("object");
        //expect(container.allowScaling).to.be.true;
        expect(err).to.not.be.an.error;
    });
});
