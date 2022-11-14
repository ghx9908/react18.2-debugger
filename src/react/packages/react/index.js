/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

// Keep in sync with https://github.com/facebook/flow/blob/main/lib/react.js

// Export all exports so that they're available in tests.
// We can't use export * from in Flow for some reason.
export { __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, act as unstable_act, Children, Component, Fragment, Profiler, PureComponent, StrictMode, Suspense, SuspenseList, cloneElement, createContext, createElement, createFactory, createMutableSource, createRef, createServerContext, use, forwardRef, isValidElement, lazy, memo, cache, startTransition, unstable_Cache, unstable_DebugTracingMode, unstable_LegacyHidden, unstable_Offscreen, unstable_Scope, unstable_TracingMarker, unstable_getCacheSignal, unstable_getCacheForType, unstable_useCacheRefresh, unstable_useMemoCache, useId, useCallback, useContext, useDebugValue, useDeferredValue, useEffect, experimental_useEvent, useImperativeHandle, useInsertionEffect, useLayoutEffect, useMemo, useMutableSource, useSyncExternalStore, useReducer, useRef, useState, useTransition, version } from './src/React';