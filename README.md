# com.idoctum.deviceattitude

This plugin provides access to the device's motion sensor and getting a mathematical representation of attitude as [Euler angles](http://en.wikipedia.org/wiki/Euler_angles) (roll, pitch, and yaw values).

![iPhone attitude](http://www.dulaccc.me/images/iphone-attitude.png)

Access is via a global `navigator.devicemotion` object.

Although the object is attached to the global scoped `navigator`, it is not available until after the `deviceready` event.

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        console.log(navigator.devicemotion);
    }

## Installation

    cordova plugin add https://github.com/bdi/com-idoctum-deviceattitude.git

## Supported Platforms

- iOS

## Methods

- navigator.devicemotion.getCurrentAttitude
- navigator.devicemotion.watchAttitude
- navigator.devicemotion.clearWatch

## Objects

- Attitude

## navigator.devicemotion.getCurrentAttitude

Get the current attitude along the _x_, _y_, and _z_ (roll, pitch, and yaw) axes.

These attitude values are returned to the `onSuccess` callback function.

    navigator.devicemotion.getCurrentAttitude(onSuccess, [onError]);


### Example

    function onSuccess(attitude) {
        alert('Attitude alpha: ' + attitude.alpha + '\n' +
              'Attitude beta:  ' + attitude.beta  + '\n' +
              'Attitude gamma: ' + attitude.gamma + '\n' +
              'Timestamp: '  + attitude.timestamp + '\n');
    };

    function onError() {
        alert('onError!');
    };

    navigator.devicemotion.getCurrentAttitude(onSuccess, onError);

## navigator.devicemotion.watchAttitude

The returned watch ID references the attitude watch interval. The watch
ID can be used with `navigator.devicemotion.clearWatch` to stop watching the navigator.devicemotion.

    var watchID = navigator.devicemotion.watchAttitude(onSuccess, [onError], [options]);

`options` may contain the following keys:

- __frequency__: How often to retrieve the motion data in milliseconds. _(Number)_ (Default: 1000/60 = 60 fps)

### Example

    function onSuccess(attitude) {
        var element = document.getElementById('attitude');
        element.innerHTML = 'Attitude alpha: ' + attitude.alpha + '<br>' +
                            'Attitude beta:  ' + attitude.beta  + '<br>' +
                            'Attitude gamma: ' + attitude.gamma + '<br>' +
                            'Timestamp: '  + attitude.timestamp + '<br>';
    };

    function onError(error) {
        alert('Sensor error: ' + error);
    };

    var options = {
        frequency: 3000
    }; // Update every 3 seconds

    var watchID = navigator.devicemotion.watchAttitude(onSuccess, onError, options);

### iOS Quirks

Only one `watchAttitude` can be in effect at one time in iOS.

## navigator.compass.clearWatch

Stop watching the attitude referenced by the watch ID parameter.

    navigator.devicemotion.clearWatch(watchID);

- __watchID__: The ID returned by `navigator.devicemotion.watchAttitude`.

### Example

    var watchID = navigator.devicemotion.watchAttitude(onSuccess, onError, options);

    // ... later on ...

    navigator.devicemotion.clearWatch(watchID);

## Attitude

An `attitude` object is returned to the `onSuccess` callback function.

### Properties

- __alpha__: The roll of the device, in degree. _(Number)_

- __beta__: The pitch of the device, in degree. _(Number)_

- __gamma__: The yaw of the device, in degree. _(Number)_

- __timestamp__: The time at which this attitude was determined.  _(milliseconds)_

