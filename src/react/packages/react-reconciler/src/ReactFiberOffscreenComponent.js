/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

// We use the existence of the state object as an indicator that the component
// is hidden.

export const OffscreenVisible = /*                     */0b001;
export const OffscreenDetached = /*                    */0b010;
export const OffscreenPassiveEffectsConnected = /*     */0b100;
export function isOffscreenManual(offscreenFiber) {
  return offscreenFiber.memoizedProps !== null && offscreenFiber.memoizedProps.mode === 'manual';
}