/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

import { enableCache } from 'shared/ReactFeatureFlags';
import { readContext } from './ReactFiberNewContext.new';
import { CacheContext } from './ReactFiberCacheComponent.new';
function getCacheSignal() {
  if (!enableCache) {
    throw new Error('Not implemented.');
  }
  const cache = readContext(CacheContext);
  return cache.controller.signal;
}
function getCacheForType(resourceType) {
  if (!enableCache) {
    throw new Error('Not implemented.');
  }
  const cache = readContext(CacheContext);
  let cacheForType = cache.data.get(resourceType);
  if (cacheForType === undefined) {
    cacheForType = resourceType();
    cache.data.set(resourceType, cacheForType);
  }
  return cacheForType;
}
export const DefaultCacheDispatcher = {
  getCacheSignal,
  getCacheForType
};