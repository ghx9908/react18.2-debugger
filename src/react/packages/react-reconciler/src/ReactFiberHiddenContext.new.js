/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

import { createCursor, push, pop } from './ReactFiberStack.new';
import { getRenderLanes, setRenderLanes } from './ReactFiberWorkLoop.new';
import { NoLanes, mergeLanes } from './ReactFiberLane.new';

// TODO: Remove `renderLanes` context in favor of hidden context

// TODO: This isn't being used yet, but it's intended to replace the
// InvisibleParentContext that is currently managed by SuspenseContext.
export const currentTreeHiddenStackCursor = createCursor(null);
export const prevRenderLanesStackCursor = createCursor(NoLanes);
export function pushHiddenContext(fiber, context) {
  const prevRenderLanes = getRenderLanes();
  push(prevRenderLanesStackCursor, prevRenderLanes, fiber);
  push(currentTreeHiddenStackCursor, context, fiber);

  // When rendering a subtree that's currently hidden, we must include all
  // lanes that would have rendered if the hidden subtree hadn't been deferred.
  // That is, in order to reveal content from hidden -> visible, we must commit
  // all the updates that we skipped when we originally hid the tree.
  setRenderLanes(mergeLanes(prevRenderLanes, context.baseLanes));
}
export function reuseHiddenContextOnStack(fiber) {
  // This subtree is not currently hidden, so we don't need to add any lanes
  // to the render lanes. But we still need to push something to avoid a
  // context mismatch. Reuse the existing context on the stack.
  push(prevRenderLanesStackCursor, getRenderLanes(), fiber);
  push(currentTreeHiddenStackCursor, currentTreeHiddenStackCursor.current, fiber);
}
export function popHiddenContext(fiber) {
  // Restore the previous render lanes from the stack
  setRenderLanes(prevRenderLanesStackCursor.current);
  pop(currentTreeHiddenStackCursor, fiber);
  pop(prevRenderLanesStackCursor, fiber);
}
export function isCurrentTreeHidden() {
  return currentTreeHiddenStackCursor.current !== null;
}