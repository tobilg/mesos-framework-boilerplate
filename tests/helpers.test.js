/*global describe, before, beforeEach, after, afterEach, it
*/
/*jslint
this: true,
es6: true,
node: true
*/
"use strict";
var helpers = require("../lib/helpers");

var expect = require("chai").expect;

describe("helpers", function () {
    describe("checkBooleanString", function () {
        var cases = [
            // No defaultValue true false words
            {string: "true", result: true},
            {string: "  true  ", result: true},
            {string: "  TrUe  ", result: true},
            {string: "  false  ", result: false},
            {string: "false", result: false},
            {string: "  FaLse  ", result: false},
            {string: "", result: false},

            // defaultValue true false words
            {string: "true", result: true, defaultValue: true},
            {string: "  true  ", result: true, defaultValue: true},
            {string: "  TrUe  ", result: true, defaultValue: true},
            {string: "  false  ", result: false, defaultValue: true},
            {string: "false", result: false, defaultValue: true},
            {string: "  FaLse  ", result: false, defaultValue: true},
            {string: "", result: true, defaultValue: true},
            {string: " ", result: true, defaultValue: true},

            // Number 1
            {string: "1", result: true},
            {string: "1", result: true, defaultValue: true},
            {string: "1", result: true, defaultValue: false},
            {string: "1.0", result: true},
            {string: "1.0", result: true, defaultValue: true},
            {string: "1.0", result: true, defaultValue: false},
            {string: "-1", result: true},
            {string: "-1", result: true, defaultValue: true},
            {string: "-1", result: true, defaultValue: false},
            {string: "-1.0", result: true},
            {string: "-1.0", result: true, defaultValue: true},
            {string: "-1.0", result: true, defaultValue: false},

            // Number 0
            {string: "0", result: false},
            {string: "0", result: false, defaultValue: true},
            {string: "0", result: false, defaultValue: false},
            {string: "0.0", result: false},
            {string: "0.0", result: false, defaultValue: true},
            {string: "0.0", result: false, defaultValue: false},
            {string: "-0", result: false},
            {string: "-0", result: false, defaultValue: true},
            {string: "-0", result: false, defaultValue: false},
            {string: "-0.0", result: false},
            {string: "-0.0", result: false, defaultValue: true},
            {string: "-0.0", result: false, defaultValue: false},

            // Number 354(.234)
            {string: "354", result: true},
            {string: "354", result: true, defaultValue: true},
            {string: "354", result: true, defaultValue: false},
            {string: "354.234", result: true},
            {string: "354.234", result: true, defaultValue: true},
            {string: "354.234", result: true, defaultValue: false},
            {string: "-354", result: true},
            {string: "-354", result: true, defaultValue: true},
            {string: "-354", result: true, defaultValue: false},
            {string: "-354.234", result: true},
            {string: "-354.234", result: true, defaultValue: true},
            {string: "-354.234", result: true, defaultValue: false},

            // Number .04364
            {string: ".04364", result: true},
            {string: ".04364", result: true, defaultValue: true},
            {string: ".04364", result: true, defaultValue: false},
            {string: "-.04364", result: true},
            {string: "-.04364", result: true, defaultValue: true},
            {string: "-.04364", result: true, defaultValue: false},

            // Special cases
            {string: undefined, result: false},
            {string: undefined, result: true, defaultValue: true},
            {string: undefined, result: false, defaultValue: false},
            {string: null, result: false},
            {string: null, result: true, defaultValue: true},
            {string: null, result: false, defaultValue: false}
        ];
        cases.forEach(function (testCase) {
            it("string: \"" + testCase.string + "\" defaultValue: " + testCase.defaultValue + " expected result: " + testCase.result, function () {
                expect(helpers.checkBooleanString(testCase.string, testCase.defaultValue)).to.equal(testCase.result);
            });
        });
    });
});
