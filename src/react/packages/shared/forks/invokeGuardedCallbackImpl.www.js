/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Provided by www
const ReactFbErrorUtils = require('ReactFbErrorUtils');
if (typeof ReactFbErrorUtils.invokeGuardedCallback !== 'function') {
  throw new Error('Expected ReactFbErrorUtils.invokeGuardedCallback to be a function.');
}
const invokeGuardedCallbackImpl = function (name, func, context, a, b, c, d, e, f) {
  // This will call `this.onError(err)` if an error was caught.
  ReactFbErrorUtils.invokeGuardedCallback.apply(this, arguments);
};
export default invokeGuardedCallbackImpl;