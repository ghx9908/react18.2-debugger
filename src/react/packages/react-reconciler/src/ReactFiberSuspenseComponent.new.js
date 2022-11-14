/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

import { SuspenseComponent, SuspenseListComponent } from './ReactWorkTags';
import { NoFlags, DidCapture } from './ReactFiberFlags';
import { isSuspenseInstancePending, isSuspenseInstanceFallback } from './ReactFiberHostConfig';
export function findFirstSuspended(row) {
  let node = row;
  while (node !== null) {
    if (node.tag === SuspenseComponent) {
      const state = node.memoizedState;
      if (state !== null) {
        const dehydrated = state.dehydrated;
        if (dehydrated === null || isSuspenseInstancePending(dehydrated) || isSuspenseInstanceFallback(dehydrated)) {
          return node;
        }
      }
    } else if (node.tag === SuspenseListComponent &&
    // revealOrder undefined can't be trusted because it don't
    // keep track of whether it suspended or not.
    node.memoizedProps.revealOrder !== undefined) {
      const didSuspend = (node.flags & DidCapture) !== NoFlags;
      if (didSuspend) {
        return node;
      }
    } else if (node.child !== null) {
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === row) {
      return null;
    }
    while (node.sibling === null) {
      if (node.return === null || node.return === row) {
        return null;
      }
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
  return null;
}