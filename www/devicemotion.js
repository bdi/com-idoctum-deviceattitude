/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

/**
 * This class provides access to device motion data.
 * @constructor
 */
var argscheck = require('cordova/argscheck'),
    utils = require("cordova/utils"),
    exec = require("cordova/exec"),
    Attitude = require('./Attitude');

// Is the sensor running?
var running = false;

// Keeps reference to watchAttitude calls.
var timers = {};

// Array of listeners; used to keep track of when we should call start and stop.
var listeners = [];

// Last returned attitude object from native
var att = null;

// Tells native to start.
function start() {
    exec(function(a) {
        var tempListeners = listeners.slice(0);
        att = new Attitude(a.x, a.y, a.z, a.timestamp);
        for (var i = 0, l = tempListeners.length; i < l; i++) {
            tempListeners[i].win(att);
        }
    }, function(e) {
        var tempListeners = listeners.slice(0);
        for (var i = 0, l = tempListeners.length; i < l; i++) {
            tempListeners[i].fail(e);
        }
    }, "DeviceMotion", "start", []);
    running = true;
}

// Tells native to stop.
function stop() {
    exec(null, null, "DeviceMotion", "stop", []);
    running = false;
}

// Adds a callback pair to the listeners array
function createCallbackPair(win, fail) {
    return {win:win, fail:fail};
}

// Removes a win/fail listener pair from the listeners array
function removeListeners(l) {
    var idx = listeners.indexOf(l);
    if (idx > -1) {
        listeners.splice(idx, 1);
        if (listeners.length === 0) {
            stop();
        }
    }
}

var devicemotion = {
    /**
     * Asynchronously acquires the current attitude.
     *
     * @param {Function} successCallback    The function to call when the motion data is available
     * @param {Function} errorCallback      The function to call when there is an error getting the motion data. (OPTIONAL)
     * @param {Object} options              The options for getting the motion data such as timeout. (OPTIONAL)
     */
    getCurrentAttitude: function(successCallback, errorCallback, options) {
        argscheck.checkArgs('fFO', 'devicemotion.getCurrentAttitude', arguments);

        var p;
        var win = function(a) {
            removeListeners(p);
            successCallback(a);
        };
        var fail = function(e) {
            removeListeners(p);
            if (errorCallback) {
                errorCallback(e);
            }
        };

        p = createCallbackPair(win, fail);
        listeners.push(p);

        if (!running) {
            start();
        }
    },

    /**
     * Asynchronously acquires the attitude repeatedly at a given interval.
     *
     * @param {Function} successCallback    The function to call each time the motion data is available
     * @param {Function} errorCallback      The function to call when there is an error getting the motion data. (OPTIONAL)
     * @param {Object} options              The options for getting the motion data such as timeout. (OPTIONAL)
     * @return String                       The watch id that must be passed to #clearWatch to stop watching.
     */
    watchAttitude: function(successCallback, errorCallback, options) {
        argscheck.checkArgs('fFO', 'devicemotion.watchAttitude', arguments);
        // Default interval (1000/60 millisec = 60 fps)
        var frequency = (options && options.frequency && typeof options.frequency == 'number') ? options.frequency : 1000/60;

        // Keep reference to watch id, and report attitude readings as often as defined in frequency
        var id = utils.createUUID();

        var p = createCallbackPair(function(){}, function(e) {
            removeListeners(p);
            if (errorCallback) {
                errorCallback(e);
            }
        });
        listeners.push(p);

        timers[id] = {
            timer:window.setInterval(function() {
                if (att) {
                    successCallback(att);
                }
            }, frequency),
            listeners:p
        };

        if (running) {
            // If we're already running then immediately invoke the success callback
            // but only if we have retrieved a value, sample code does not check for null ...
            if (att) {
                successCallback(att);
            }
        } else {
            start();
        }

        return id;
    },

    /**
     * Clears the specified attitude watch.
     *
     * @param {String} id       The id of the watch returned from #watchAttitude.
     */
    clearWatch: function(id) {
        // Stop javascript timer & remove from timer list
        if (id && timers[id]) {
            window.clearInterval(timers[id].timer);
            removeListeners(timers[id].listeners);
            delete timers[id];
        }
    }
};
module.exports = devicemotion;
