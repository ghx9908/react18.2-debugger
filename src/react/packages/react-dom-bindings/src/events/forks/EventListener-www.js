/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

const EventListenerWWW = require('EventListener');
export function addEventBubbleListener(target, eventType, listener) {
  return EventListenerWWW.listen(target, eventType, listener);
}
export function addEventCaptureListener(target, eventType, listener) {
  return EventListenerWWW.capture(target, eventType, listener);
}
export function addEventCaptureListenerWithPassiveFlag(target, eventType, listener, passive) {
  return EventListenerWWW.captureWithPassiveFlag(target, eventType, listener, passive);
}
export function addEventBubbleListenerWithPassiveFlag(target, eventType, listener, passive) {
  return EventListenerWWW.bubbleWithPassiveFlag(target, eventType, listener, passive);
}
export function removeEventListener(target, eventType, listener, capture) {
  listener.remove();
}

// Flow magic to verify the exports of this file match the original version.
null;