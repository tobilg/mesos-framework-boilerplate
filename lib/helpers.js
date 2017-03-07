"use strict";

module.exports = {
    checkBooleanString: function (string, defaultValue) {
        var result = false;
        if (defaultValue) {
            result = true;
        }
        if (string) {
            string = string.trim();
            string = string.toLowerCase();
        } else {
            return result;
        }
        if (string.length) {
            if (string === "true") {
                result = true;
            } else if (string === "1") {
                result = true;
            } else if (parseFloat(string) !== 0 && !isNaN(string) && !isNaN(parseFloat(string))) { // Checking any numeric value including infinity, excluding zero
                result = true;
            } else {
                result = false;
            }
        }
        return result;
    }
};