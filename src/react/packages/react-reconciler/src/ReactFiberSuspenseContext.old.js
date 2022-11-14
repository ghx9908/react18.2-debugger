/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

import { enableSuspenseAvoidThisFallback } from 'shared/ReactFeatureFlags';
import { createCursor, push, pop } from './ReactFiberStack.old';
import { isCurrentTreeHidden } from './ReactFiberHiddenContext.old';
import { SuspenseComponent, OffscreenComponent } from './ReactWorkTags';

// The Suspense handler is the boundary that should capture if something
// suspends, i.e. it's the nearest `catch` block on the stack.
const suspenseHandlerStackCursor = createCursor(null);
function shouldAvoidedBoundaryCapture(workInProgress, handlerOnStack, props) {
  if (enableSuspenseAvoidThisFallback) {
    // If the parent is already showing content, and we're not inside a hidden
    // tree, then we should show the avoided fallback.
    if (handlerOnStack.alternate !== null && !isCurrentTreeHidden()) {
      return true;
    }

    // If the handler on the stack is also an avoided boundary, then we should
    // favor this inner one.
    if (handlerOnStack.tag === SuspenseComponent && handlerOnStack.memoizedProps.unstable_avoidThisFallback === true) {
      return true;
    }

    // If this avoided boundary is dehydrated, then it should capture.
    const suspenseState = workInProgress.memoizedState;
    if (suspenseState !== null && suspenseState.dehydrated !== null) {
      return true;
    }
  }

  // If none of those cases apply, then we should avoid this fallback and show
  // the outer one instead.
  return false;
}
export function isBadSuspenseFallback(current, nextProps) {
  // Check if this is a "bad" fallback state or a good one. A bad fallback state
  // is one that we only show as a last resort; if this is a transition, we'll
  // block it from displaying, and wait for more data to arrive.
  if (current !== null) {
    const prevState = current.memoizedState;
    const isShowingFallback = prevState !== null;
    if (!isShowingFallback && !isCurrentTreeHidden()) {
      // It's bad to switch to a fallback if content is already visible
      return true;
    }
  }
  if (enableSuspenseAvoidThisFallback && nextProps.unstable_avoidThisFallback === true) {
    // Experimental: Some fallbacks are always bad
    return true;
  }
  return false;
}
export function pushPrimaryTreeSuspenseHandler(handler) {
  const props = handler.pendingProps;
  const handlerOnStack = suspenseHandlerStackCursor.current;
  if (enableSuspenseAvoidThisFallback && props.unstable_avoidThisFallback === true && handlerOnStack !== null && !shouldAvoidedBoundaryCapture(handler, handlerOnStack, props)) {
    // This boundary should not capture if something suspends. Reuse the
    // existing handler on the stack.
    push(suspenseHandlerStackCursor, handlerOnStack, handler);
  } else {
    // Push this handler onto the stack.
    push(suspenseHandlerStackCursor, handler, handler);
  }
}
export function pushFallbackTreeSuspenseHandler(fiber) {
  // We're about to render the fallback. If something in the fallback suspends,
  // it's akin to throwing inside of a `catch` block. This boundary should not
  // capture. Reuse the existing handler on the stack.
  reuseSuspenseHandlerOnStack(fiber);
}
export function pushOffscreenSuspenseHandler(fiber) {
  if (fiber.tag === OffscreenComponent) {
    push(suspenseHandlerStackCursor, fiber, fiber);
  } else {
    // This is a LegacyHidden component.
    reuseSuspenseHandlerOnStack(fiber);
  }
}
export function reuseSuspenseHandlerOnStack(fiber) {
  push(suspenseHandlerStackCursor, getSuspenseHandler(), fiber);
}
export function getSuspenseHandler() {
  return suspenseHandlerStackCursor.current;
}
export function popSuspenseHandler(fiber) {
  pop(suspenseHandlerStackCursor, fiber);
}

// SuspenseList context
// TODO: Move to a separate module? We may change the SuspenseList
// implementation to hide/show in the commit phase, anyway.

const DefaultSuspenseContext = 0b00;
const SubtreeSuspenseContextMask = 0b01;

// ForceSuspenseFallback can be used by SuspenseList to force newly added
// items into their fallback state during one of the render passes.
export const ForceSuspenseFallback = 0b10;
export const suspenseStackCursor = createCursor(DefaultSuspenseContext);
export function hasSuspenseListContext(parentContext, flag) {
  return (parentContext & flag) !== 0;
}
export function setDefaultShallowSuspenseListContext(parentContext) {
  return parentContext & SubtreeSuspenseContextMask;
}
export function setShallowSuspenseListContext(parentContext, shallowContext) {
  return parentContext & SubtreeSuspenseContextMask | shallowContext;
}
export function pushSuspenseListContext(fiber, newContext) {
  push(suspenseStackCursor, newContext, fiber);
}
export function popSuspenseListContext(fiber) {
  pop(suspenseStackCursor, fiber);
}