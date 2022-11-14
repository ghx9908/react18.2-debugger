/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

import { Writable, Readable } from 'stream';
import ReactVersion from 'shared/ReactVersion';
import { createRequest, startWork, startFlowing, abort } from 'react-server/src/ReactFizzServer';
import { createResponseState, createRootFormatContext } from 'react-dom-bindings/src/server/ReactDOMServerFormatConfig';
function createFakeWritable(readable) {
  // The current host config expects a Writable so we create
  // a fake writable for now to push into the Readable.
  return {
    write(chunk) {
      return readable.push(chunk);
    },
    end() {
      readable.push(null);
    },
    destroy(error) {
      readable.destroy(error);
    }
  };
}
function prerenderToNodeStreams(children, options) {
  return new Promise((resolve, reject) => {
    const onFatalError = reject;
    function onAllReady() {
      const readable = new Readable({
        read() {
          startFlowing(request, writable);
        }
      });
      const writable = createFakeWritable(readable);
      const result = {
        prelude: readable
      };
      resolve(result);
    }
    const request = createRequest(children, createResponseState(options ? options.identifierPrefix : undefined, undefined, options ? options.bootstrapScriptContent : undefined, options ? options.bootstrapScripts : undefined, options ? options.bootstrapModules : undefined, options ? options.unstable_externalRuntimeSrc : undefined), createRootFormatContext(options ? options.namespaceURI : undefined), options ? options.progressiveChunkSize : undefined, options ? options.onError : undefined, onAllReady, undefined, undefined, onFatalError);
    if (options && options.signal) {
      const signal = options.signal;
      if (signal.aborted) {
        abort(request, signal.reason);
      } else {
        const listener = () => {
          abort(request, signal.reason);
          signal.removeEventListener('abort', listener);
        };
        signal.addEventListener('abort', listener);
      }
    }
    startWork(request);
  });
}
export { prerenderToNodeStreams, ReactVersion as version };