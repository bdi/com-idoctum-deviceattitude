/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
 */

#import <CoreMotion/CoreMotion.h>
#import <GLKit/GLKit.h>
#import "CDVMotion.h"

@interface CDVMotion () {}
@property (readwrite, assign) BOOL isRunning;
@property (readwrite, assign) BOOL haveReturnedResult;
@property (readwrite, strong) CMMotionManager* motionManager;
@end

@implementation CDVMotion

@synthesize callbackId, isRunning;

// defaults to 60 fps
#define updateInterval 1000/60/1000

- (CDVMotion*)init
{
    self = [super init];
    if (self) {
        x = 0;
        y = 0;
        z = 0;
        timestamp = 0;
        self.callbackId = nil;
        self.isRunning = NO;
        self.haveReturnedResult = YES;
        self.motionManager = nil;
    }
    return self;
}

- (void)dealloc
{
    [self stop:nil];
}

- (void)start:(CDVInvokedUrlCommand*)command
{
    self.haveReturnedResult = NO;
    self.callbackId = command.callbackId;

    if (!self.motionManager)
    {
        self.motionManager = [[CMMotionManager alloc] init];
    }

    if ([self.motionManager isDeviceMotionAvailable] == YES) {
        // Assign the update interval to the motion manager and start updates
        [self.motionManager setDeviceMotionUpdateInterval:updateInterval];  // expected in seconds
        __weak CDVMotion* weakSelf = self;
        [self.motionManager startDeviceMotionUpdatesToQueue:[NSOperationQueue mainQueue] withHandler:^(CMDeviceMotion *deviceMotionData, NSError *error) {
            x = GLKMathRadiansToDegrees(deviceMotionData.attitude.roll);
            y = GLKMathRadiansToDegrees(deviceMotionData.attitude.pitch);
            z = GLKMathRadiansToDegrees(deviceMotionData.attitude.yaw);
            timestamp = ([[NSDate date] timeIntervalSince1970] * 1000);
            [weakSelf returnCompassInfo];
        }];

        if (!self.isRunning) {
            self.isRunning = YES;
        }
    }

}

- (void)onReset
{
    [self stop:nil];
}

- (void)stop:(CDVInvokedUrlCommand*)command
{
    if ([self.motionManager isDeviceMotionAvailable] == YES) {
        if (self.haveReturnedResult == NO){
            // block has not fired before stop was called, return whatever result we currently have
            [self returnCompassInfo];
        }
        [self.motionManager stopDeviceMotionUpdates];
    }
    self.isRunning = NO;
}

- (void)returnCompassInfo
{
    // Create an acceleration object
    NSMutableDictionary* compassProps = [NSMutableDictionary dictionaryWithCapacity:4];

    [compassProps setValue:[NSNumber numberWithDouble:x] forKey:@"x"];
    [compassProps setValue:[NSNumber numberWithDouble:y] forKey:@"y"];
    [compassProps setValue:[NSNumber numberWithDouble:z] forKey:@"z"];
    [compassProps setValue:[NSNumber numberWithDouble:timestamp] forKey:@"timestamp"];

    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:compassProps];
    [result setKeepCallback:[NSNumber numberWithBool:YES]];
    [self.commandDelegate sendPluginResult:result callbackId:self.callbackId];
    self.haveReturnedResult = YES;
}

@end
