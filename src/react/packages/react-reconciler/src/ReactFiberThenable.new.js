/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

import ReactSharedInternals from 'shared/ReactSharedInternals';
const {
  ReactCurrentActQueue
} = ReactSharedInternals;
// An error that is thrown (e.g. by `use`) to trigger Suspense. If we
// detect this is caught by userspace, we'll log a warning in development.
export const SuspenseException = new Error("Suspense Exception: This is not a real error! It's an implementation " + 'detail of `use` to interrupt the current render. You must either ' + 'rethrow it immediately, or move the `use` call outside of the ' + '`try/catch` block. Capturing without rethrowing will lead to ' + 'unexpected behavior.\n\n' + 'To handle async errors, wrap your component in an error boundary, or ' + "call the promise's `.catch` method and pass the result to `use`");
let thenableState = null;
export function createThenableState() {
  // The ThenableState is created the first time a component suspends. If it
  // suspends again, we'll reuse the same state.
  return [];
}
export function prepareThenableState(prevThenableState) {
  // This function is called before every function that might suspend
  // with `use`. Right now, that's only Hooks, but in the future we'll use the
  // same mechanism for unwrapping promises during reconciliation.
  thenableState = prevThenableState;
}
export function getThenableStateAfterSuspending() {
  // Called by the work loop so it can stash the thenable state. It will use
  // the state to replay the component when the promise resolves.
  const state = thenableState;
  thenableState = null;
  return state;
}
export function isThenableStateResolved(thenables) {
  const lastThenable = thenables[thenables.length - 1];
  if (lastThenable !== undefined) {
    const status = lastThenable.status;
    return status === 'fulfilled' || status === 'rejected';
  }
  return true;
}
function noop() {}
export function trackUsedThenable(thenable, index) {
  if (__DEV__ && ReactCurrentActQueue.current !== null) {
    ReactCurrentActQueue.didUsePromise = true;
  }
  if (thenableState === null) {
    thenableState = [thenable];
  } else {
    const previous = thenableState[index];
    if (previous === undefined) {
      thenableState.push(thenable);
    } else {
      if (previous !== thenable) {
        // Reuse the previous thenable, and drop the new one. We can assume
        // they represent the same value, because components are idempotent.

        // Avoid an unhandled rejection errors for the Promises that we'll
        // intentionally ignore.
        thenable.then(noop, noop);
        thenable = previous;
      }
    }
  }

  // We use an expando to track the status and result of a thenable so that we
  // can synchronously unwrap the value. Think of this as an extension of the
  // Promise API, or a custom interface that is a superset of Thenable.
  //
  // If the thenable doesn't have a status, set it to "pending" and attach
  // a listener that will update its status and result when it resolves.
  switch (thenable.status) {
    case 'fulfilled':
      {
        const fulfilledValue = thenable.value;
        return fulfilledValue;
      }
    case 'rejected':
      {
        const rejectedError = thenable.reason;
        throw rejectedError;
      }
    default:
      {
        if (typeof thenable.status === 'string') {
          // Only instrument the thenable if the status if not defined. If
          // it's defined, but an unknown value, assume it's been instrumented by
          // some custom userspace implementation. We treat it as "pending".
        } else {
          const pendingThenable = thenable;
          pendingThenable.status = 'pending';
          pendingThenable.then(fulfilledValue => {
            if (thenable.status === 'pending') {
              const fulfilledThenable = thenable;
              fulfilledThenable.status = 'fulfilled';
              fulfilledThenable.value = fulfilledValue;
            }
          }, error => {
            if (thenable.status === 'pending') {
              const rejectedThenable = thenable;
              rejectedThenable.status = 'rejected';
              rejectedThenable.reason = error;
            }
          });

          // Check one more time in case the thenable resolved synchronously
          switch (thenable.status) {
            case 'fulfilled':
              {
                const fulfilledThenable = thenable;
                return fulfilledThenable.value;
              }
            case 'rejected':
              {
                const rejectedThenable = thenable;
                throw rejectedThenable.reason;
              }
          }
        }

        // Suspend.
        //
        // Throwing here is an implementation detail that allows us to unwind the
        // call stack. But we shouldn't allow it to leak into userspace. Throw an
        // opaque placeholder value instead of the actual thenable. If it doesn't
        // get captured by the work loop, log a warning, because that means
        // something in userspace must have caught it.
        suspendedThenable = thenable;
        if (__DEV__) {
          needsToResetSuspendedThenableDEV = true;
        }
        throw SuspenseException;
      }
  }
}

// This is used to track the actual thenable that suspended so it can be
// passed to the rest of the Suspense implementation — which, for historical
// reasons, expects to receive a thenable.
let suspendedThenable = null;
let needsToResetSuspendedThenableDEV = false;
export function getSuspendedThenable() {
  // This is called right after `use` suspends by throwing an exception. `use`
  // throws an opaque value instead of the thenable itself so that it can't be
  // caught in userspace. Then the work loop accesses the actual thenable using
  // this function.
  if (suspendedThenable === null) {
    throw new Error('Expected a suspended thenable. This is a bug in React. Please file ' + 'an issue.');
  }
  const thenable = suspendedThenable;
  suspendedThenable = null;
  if (__DEV__) {
    needsToResetSuspendedThenableDEV = false;
  }
  return thenable;
}
export function checkIfUseWrappedInTryCatch() {
  if (__DEV__) {
    // This was set right before SuspenseException was thrown, and it should
    // have been cleared when the exception was handled. If it wasn't,
    // it must have been caught by userspace.
    if (needsToResetSuspendedThenableDEV) {
      needsToResetSuspendedThenableDEV = false;
      return true;
    }
  }
  return false;
}