/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

import { precacheFiberNode, updateFiberProps, getClosestInstanceFromNode, getFiberFromScopeInstance, getInstanceFromNode as getInstanceFromNodeDOMTree, isContainerMarkedAsRoot, detachDeletedInstance, isMarkedResource } from './ReactDOMComponentTree';
export { detachDeletedInstance };
import { hasRole } from './DOMAccessibilityRoles';
import { createElement, createTextNode, setInitialProperties, diffProperties, updateProperties, diffHydratedProperties, diffHydratedText, trapClickOnNonInteractiveElement, checkForUnmatchedText, warnForDeletedHydratableElement, warnForDeletedHydratableText, warnForInsertedHydratedElement, warnForInsertedHydratedText, getOwnerDocumentFromRootContainer } from './ReactDOMComponent';
import { getSelectionInformation, restoreSelection } from './ReactInputSelection';
import setTextContent from './setTextContent';
import { validateDOMNesting, updatedAncestorInfoDev } from './validateDOMNesting';
import { isEnabled as ReactBrowserEventEmitterIsEnabled, setEnabled as ReactBrowserEventEmitterSetEnabled, getEventPriority } from '../events/ReactDOMEventListener';
import { getChildNamespace, SVG_NAMESPACE } from '../shared/DOMNamespaces';
import { ELEMENT_NODE, TEXT_NODE, COMMENT_NODE, DOCUMENT_NODE, DOCUMENT_TYPE_NODE, DOCUMENT_FRAGMENT_NODE } from '../shared/HTMLNodeType';
import dangerousStyleValue from '../shared/dangerousStyleValue';
import { retryIfBlockedOn } from '../events/ReactDOMEventReplaying';
import { enableCreateEventHandleAPI, enableScopeAPI, enableFloat, enableHostSingletons } from 'shared/ReactFeatureFlags';
import { HostComponent, HostResource, HostText, HostSingleton } from 'react-reconciler/src/ReactWorkTags';
import { listenToAllSupportedEvents } from '../events/DOMPluginEventSystem';
import { DefaultEventPriority } from 'react-reconciler/src/ReactEventPriorities';

// TODO: Remove this deep import when we delete the legacy root API
import { ConcurrentMode, NoMode } from 'react-reconciler/src/ReactTypeOfMode';
import { prepareToRenderResources, cleanupAfterRenderResources, clearRootResources } from './ReactDOMFloatClient';
import { validateLinkPropsForStyleResource } from '../shared/ReactDOMResourceValidation';
const SUPPRESS_HYDRATION_WARNING = 'suppressHydrationWarning';
const SUSPENSE_START_DATA = '$';
const SUSPENSE_END_DATA = '/$';
const SUSPENSE_PENDING_START_DATA = '$?';
const SUSPENSE_FALLBACK_START_DATA = '$!';
const STYLE = 'style';
let eventsEnabled = null;
let selectionInformation = null;
export * from 'react-reconciler/src/ReactFiberHostConfigWithNoPersistence';
export function getRootHostContext(rootContainerInstance) {
  let type;
  let namespace;
  const nodeType = rootContainerInstance.nodeType;
  switch (nodeType) {
    case DOCUMENT_NODE:
    case DOCUMENT_FRAGMENT_NODE:
      {
        type = nodeType === DOCUMENT_NODE ? '#document' : '#fragment';
        const root = rootContainerInstance.documentElement;
        namespace = root ? root.namespaceURI : getChildNamespace(null, '');
        break;
      }
    default:
      {
        const container = nodeType === COMMENT_NODE ? rootContainerInstance.parentNode : rootContainerInstance;
        const ownNamespace = container.namespaceURI || null;
        type = container.tagName;
        namespace = getChildNamespace(ownNamespace, type);
        break;
      }
  }
  if (__DEV__) {
    const validatedTag = type.toLowerCase();
    const ancestorInfo = updatedAncestorInfoDev(null, validatedTag);
    return {
      namespace,
      ancestorInfo
    };
  }
  return namespace;
}
export function getChildHostContext(parentHostContext, type) {
  if (__DEV__) {
    const parentHostContextDev = parentHostContext;
    const namespace = getChildNamespace(parentHostContextDev.namespace, type);
    const ancestorInfo = updatedAncestorInfoDev(parentHostContextDev.ancestorInfo, type);
    return {
      namespace,
      ancestorInfo
    };
  }
  const parentNamespace = parentHostContext;
  return getChildNamespace(parentNamespace, type);
}
export function getPublicInstance(instance) {
  return instance;
}
export function prepareForCommit(containerInfo) {
  eventsEnabled = ReactBrowserEventEmitterIsEnabled();
  selectionInformation = getSelectionInformation();
  let activeInstance = null;
  if (enableCreateEventHandleAPI) {
    const focusedElem = selectionInformation.focusedElem;
    if (focusedElem !== null) {
      activeInstance = getClosestInstanceFromNode(focusedElem);
    }
  }
  ReactBrowserEventEmitterSetEnabled(false);
  return activeInstance;
}
export function beforeActiveInstanceBlur(internalInstanceHandle) {
  if (enableCreateEventHandleAPI) {
    ReactBrowserEventEmitterSetEnabled(true);
    dispatchBeforeDetachedBlur(selectionInformation.focusedElem, internalInstanceHandle);
    ReactBrowserEventEmitterSetEnabled(false);
  }
}
export function afterActiveInstanceBlur() {
  if (enableCreateEventHandleAPI) {
    ReactBrowserEventEmitterSetEnabled(true);
    dispatchAfterDetachedBlur(selectionInformation.focusedElem);
    ReactBrowserEventEmitterSetEnabled(false);
  }
}
export function resetAfterCommit(containerInfo) {
  restoreSelection(selectionInformation);
  ReactBrowserEventEmitterSetEnabled(eventsEnabled);
  eventsEnabled = null;
  selectionInformation = null;
}
export function createInstance(type, props, rootContainerInstance, hostContext, internalInstanceHandle) {
  let parentNamespace;
  if (__DEV__) {
    // TODO: take namespace into account when validating.
    const hostContextDev = hostContext;
    validateDOMNesting(type, null, hostContextDev.ancestorInfo);
    if (typeof props.children === 'string' || typeof props.children === 'number') {
      const string = '' + props.children;
      const ownAncestorInfo = updatedAncestorInfoDev(hostContextDev.ancestorInfo, type);
      validateDOMNesting(null, string, ownAncestorInfo);
    }
    parentNamespace = hostContextDev.namespace;
  } else {
    parentNamespace = hostContext;
  }
  const domElement = createElement(type, props, rootContainerInstance, parentNamespace);
  precacheFiberNode(internalInstanceHandle, domElement);
  updateFiberProps(domElement, props);
  return domElement;
}
export function appendInitialChild(parentInstance, child) {
  parentInstance.appendChild(child);
}
export function finalizeInitialChildren(domElement, type, props, hostContext) {
  setInitialProperties(domElement, type, props);
  switch (type) {
    case 'button':
    case 'input':
    case 'select':
    case 'textarea':
      return !!props.autoFocus;
    case 'img':
      return true;
    default:
      return false;
  }
}
export function prepareUpdate(domElement, type, oldProps, newProps, hostContext) {
  if (__DEV__) {
    const hostContextDev = hostContext;
    if (typeof newProps.children !== typeof oldProps.children && (typeof newProps.children === 'string' || typeof newProps.children === 'number')) {
      const string = '' + newProps.children;
      const ownAncestorInfo = updatedAncestorInfoDev(hostContextDev.ancestorInfo, type);
      validateDOMNesting(null, string, ownAncestorInfo);
    }
  }
  return diffProperties(domElement, type, oldProps, newProps);
}
export function shouldSetTextContent(type, props) {
  return type === 'textarea' || type === 'noscript' || typeof props.children === 'string' || typeof props.children === 'number' || typeof props.dangerouslySetInnerHTML === 'object' && props.dangerouslySetInnerHTML !== null && props.dangerouslySetInnerHTML.__html != null;
}
export function createTextInstance(text, rootContainerInstance, hostContext, internalInstanceHandle) {
  if (__DEV__) {
    const hostContextDev = hostContext;
    validateDOMNesting(null, text, hostContextDev.ancestorInfo);
  }
  const textNode = createTextNode(text, rootContainerInstance);
  precacheFiberNode(internalInstanceHandle, textNode);
  return textNode;
}
export function getCurrentEventPriority() {
  const currentEvent = window.event;
  if (currentEvent === undefined) {
    return DefaultEventPriority;
  }
  return getEventPriority(currentEvent.type);
}
export const isPrimaryRenderer = true;
export const warnsIfNotActing = true;
// This initialization code may run even on server environments
// if a component just imports ReactDOM (e.g. for findDOMNode).
// Some environments might not have setTimeout or clearTimeout.
export const scheduleTimeout = typeof setTimeout === 'function' ? setTimeout : undefined;
export const cancelTimeout = typeof clearTimeout === 'function' ? clearTimeout : undefined;
export const noTimeout = -1;
const localPromise = typeof Promise === 'function' ? Promise : undefined;
const localRequestAnimationFrame = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : scheduleTimeout;
export function getInstanceFromNode(node) {
  return getClosestInstanceFromNode(node) || null;
}
export function preparePortalMount(portalInstance) {
  listenToAllSupportedEvents(portalInstance);
}
export function prepareScopeUpdate(scopeInstance, internalInstanceHandle) {
  if (enableScopeAPI) {
    precacheFiberNode(internalInstanceHandle, scopeInstance);
  }
}
export function getInstanceFromScope(scopeInstance) {
  if (enableScopeAPI) {
    return getFiberFromScopeInstance(scopeInstance);
  }
  return null;
}

// -------------------
//     Microtasks
// -------------------
export const supportsMicrotasks = true;
export const scheduleMicrotask = typeof queueMicrotask === 'function' ? queueMicrotask : typeof localPromise !== 'undefined' ? callback => localPromise.resolve(null).then(callback).catch(handleErrorInNextTick) : scheduleTimeout; // TODO: Determine the best fallback here.

function handleErrorInNextTick(error) {
  setTimeout(() => {
    throw error;
  });
}

// -------------------
//     Mutation
// -------------------

export const supportsMutation = true;
export function commitMount(domElement, type, newProps, internalInstanceHandle) {
  // Despite the naming that might imply otherwise, this method only
  // fires if there is an `Update` effect scheduled during mounting.
  // This happens if `finalizeInitialChildren` returns `true` (which it
  // does to implement the `autoFocus` attribute on the client). But
  // there are also other cases when this might happen (such as patching
  // up text content during hydration mismatch). So we'll check this again.
  switch (type) {
    case 'button':
    case 'input':
    case 'select':
    case 'textarea':
      if (newProps.autoFocus) {
        domElement.focus();
      }
      return;
    case 'img':
      {
        if (newProps.src) {
          domElement.src = newProps.src;
        }
        return;
      }
  }
}
export function commitUpdate(domElement, updatePayload, type, oldProps, newProps, internalInstanceHandle) {
  // Apply the diff to the DOM node.
  updateProperties(domElement, updatePayload, type, oldProps, newProps);
  // Update the props handle so that we know which props are the ones with
  // with current event handlers.
  updateFiberProps(domElement, newProps);
}
export function resetTextContent(domElement) {
  setTextContent(domElement, '');
}
export function commitTextUpdate(textInstance, oldText, newText) {
  textInstance.nodeValue = newText;
}
export function appendChild(parentInstance, child) {
  parentInstance.appendChild(child);
}
export function appendChildToContainer(container, child) {
  let parentNode;
  if (container.nodeType === COMMENT_NODE) {
    parentNode = container.parentNode;
    parentNode.insertBefore(child, container);
  } else {
    parentNode = container;
    parentNode.appendChild(child);
  }
  // This container might be used for a portal.
  // If something inside a portal is clicked, that click should bubble
  // through the React tree. However, on Mobile Safari the click would
  // never bubble through the *DOM* tree unless an ancestor with onclick
  // event exists. So we wouldn't see it and dispatch it.
  // This is why we ensure that non React root containers have inline onclick
  // defined.
  // https://github.com/facebook/react/issues/11918
  const reactRootContainer = container._reactRootContainer;
  if ((reactRootContainer === null || reactRootContainer === undefined) && parentNode.onclick === null) {
    // TODO: This cast may not be sound for SVG, MathML or custom elements.
    trapClickOnNonInteractiveElement(parentNode);
  }
}
export function insertBefore(parentInstance, child, beforeChild) {
  parentInstance.insertBefore(child, beforeChild);
}
export function insertInContainerBefore(container, child, beforeChild) {
  if (container.nodeType === COMMENT_NODE) {
    container.parentNode.insertBefore(child, beforeChild);
  } else {
    container.insertBefore(child, beforeChild);
  }
}
function createEvent(type, bubbles) {
  const event = document.createEvent('Event');
  event.initEvent(type, bubbles, false);
  return event;
}
function dispatchBeforeDetachedBlur(target, internalInstanceHandle) {
  if (enableCreateEventHandleAPI) {
    const event = createEvent('beforeblur', true);
    // Dispatch "beforeblur" directly on the target,
    // so it gets picked up by the event system and
    // can propagate through the React internal tree.
    // $FlowFixMe: internal field
    event._detachedInterceptFiber = internalInstanceHandle;
    target.dispatchEvent(event);
  }
}
function dispatchAfterDetachedBlur(target) {
  if (enableCreateEventHandleAPI) {
    const event = createEvent('afterblur', false);
    // So we know what was detached, make the relatedTarget the
    // detached target on the "afterblur" event.
    event.relatedTarget = target;
    // Dispatch the event on the document.
    document.dispatchEvent(event);
  }
}
export function removeChild(parentInstance, child) {
  parentInstance.removeChild(child);
}
export function removeChildFromContainer(container, child) {
  if (container.nodeType === COMMENT_NODE) {
    container.parentNode.removeChild(child);
  } else {
    container.removeChild(child);
  }
}
export function clearSuspenseBoundary(parentInstance, suspenseInstance) {
  let node = suspenseInstance;
  // Delete all nodes within this suspense boundary.
  // There might be nested nodes so we need to keep track of how
  // deep we are and only break out when we're back on top.
  let depth = 0;
  do {
    const nextNode = node.nextSibling;
    parentInstance.removeChild(node);
    if (nextNode && nextNode.nodeType === COMMENT_NODE) {
      const data = nextNode.data;
      if (data === SUSPENSE_END_DATA) {
        if (depth === 0) {
          parentInstance.removeChild(nextNode);
          // Retry if any event replaying was blocked on this.
          retryIfBlockedOn(suspenseInstance);
          return;
        } else {
          depth--;
        }
      } else if (data === SUSPENSE_START_DATA || data === SUSPENSE_PENDING_START_DATA || data === SUSPENSE_FALLBACK_START_DATA) {
        depth++;
      }
    }
    // $FlowFixMe[incompatible-type] we bail out when we get a null
    node = nextNode;
  } while (node);
  // TODO: Warn, we didn't find the end comment boundary.
  // Retry if any event replaying was blocked on this.
  retryIfBlockedOn(suspenseInstance);
}
export function clearSuspenseBoundaryFromContainer(container, suspenseInstance) {
  if (container.nodeType === COMMENT_NODE) {
    clearSuspenseBoundary(container.parentNode, suspenseInstance);
  } else if (container.nodeType === ELEMENT_NODE) {
    clearSuspenseBoundary(container, suspenseInstance);
  } else {
    // Document nodes should never contain suspense boundaries.
  }
  // Retry if any event replaying was blocked on this.
  retryIfBlockedOn(container);
}
export function hideInstance(instance) {
  // TODO: Does this work for all element types? What about MathML? Should we
  // pass host context to this method?
  instance = instance;
  const style = instance.style;
  // $FlowFixMe[method-unbinding]
  if (typeof style.setProperty === 'function') {
    style.setProperty('display', 'none', 'important');
  } else {
    style.display = 'none';
  }
}
export function hideTextInstance(textInstance) {
  textInstance.nodeValue = '';
}
export function unhideInstance(instance, props) {
  instance = instance;
  const styleProp = props[STYLE];
  const display = styleProp !== undefined && styleProp !== null && styleProp.hasOwnProperty('display') ? styleProp.display : null;
  instance.style.display = dangerousStyleValue('display', display);
}
export function unhideTextInstance(textInstance, text) {
  textInstance.nodeValue = text;
}
export function clearContainer(container) {
  if (enableHostSingletons) {
    const nodeType = container.nodeType;
    if (nodeType === DOCUMENT_NODE) {
      clearRootResources(container);
      clearContainerSparingly(container);
    } else if (nodeType === ELEMENT_NODE) {
      switch (container.nodeName) {
        case 'HEAD':
          {
            // If we are clearing document.head as a container we are essentially clearing everything
            // that was hoisted to the head and should forget the instances that will no longer be in the DOM
            clearRootResources(container);
            // fall through to clear child contents
          }
        // eslint-disable-next-line-no-fallthrough
        case 'HTML':
        case 'BODY':
          clearContainerSparingly(container);
          return;
        default:
          {
            container.textContent = '';
          }
      }
    }
  } else {
    if (container.nodeType === ELEMENT_NODE) {
      // We have refined the container to Element type
      const element = container;
      element.textContent = '';
    } else if (container.nodeType === DOCUMENT_NODE) {
      // We have refined the container to Document type
      const doc = container;
      if (doc.documentElement) {
        doc.removeChild(doc.documentElement);
      }
    }
  }
}
function clearContainerSparingly(container) {
  let node;
  let nextNode = container.firstChild;
  if (nextNode && nextNode.nodeType === DOCUMENT_TYPE_NODE) {
    nextNode = nextNode.nextSibling;
  }
  while (nextNode) {
    node = nextNode;
    nextNode = nextNode.nextSibling;
    switch (node.nodeName) {
      case 'HTML':
      case 'HEAD':
      case 'BODY':
        {
          const element = node;
          clearContainerSparingly(element);
          // If these singleton instances had previously been rendered with React they
          // may still hold on to references to the previous fiber tree. We detatch them
          // prospectively to reset them to a baseline starting state since we cannot create
          // new instances.
          detachDeletedInstance(element);
          continue;
        }
      case 'STYLE':
        {
          continue;
        }
      case 'LINK':
        {
          if (node.rel.toLowerCase() === 'stylesheet') {
            continue;
          }
        }
    }
    container.removeChild(node);
  }
  return;
}

// Making this so we can eventually move all of the instance caching to the commit phase.
// Currently this is only used to associate fiber and props to instances for hydrating
// HostSingletons. The reason we need it here is we only want to make this binding on commit
// because only one fiber can own the instance at a time and render can fail/restart
export function bindInstance(instance, props, internalInstanceHandle) {
  precacheFiberNode(internalInstanceHandle, instance);
  updateFiberProps(instance, props);
}

// -------------------
//     Hydration
// -------------------

export const supportsHydration = true;

// With Resources, some HostComponent types will never be server rendered and need to be
// inserted without breaking hydration
export function isHydratable(type, props) {
  if (enableFloat) {
    if (type === 'link') {
      if (props.rel === 'stylesheet' && typeof props.precedence !== 'string') {
        return true;
      }
      return false;
    } else if (type === 'script') {
      const {
        async,
        onLoad,
        onError
      } = props;
      return !(async && (onLoad || onError));
    }
    return true;
  } else {
    return true;
  }
}
export function canHydrateInstance(instance, type, props) {
  if (instance.nodeType !== ELEMENT_NODE || type.toLowerCase() !== instance.nodeName.toLowerCase()) {
    return null;
  }
  // This has now been refined to an element node.
  return instance;
}
export function canHydrateTextInstance(instance, text) {
  if (text === '' || instance.nodeType !== TEXT_NODE) {
    // Empty strings are not parsed by HTML so there won't be a correct match here.
    return null;
  }
  // This has now been refined to a text node.
  return instance;
}
export function canHydrateSuspenseInstance(instance) {
  if (instance.nodeType !== COMMENT_NODE) {
    // Empty strings are not parsed by HTML so there won't be a correct match here.
    return null;
  }
  // This has now been refined to a suspense node.
  return instance;
}
export function isSuspenseInstancePending(instance) {
  return instance.data === SUSPENSE_PENDING_START_DATA;
}
export function isSuspenseInstanceFallback(instance) {
  return instance.data === SUSPENSE_FALLBACK_START_DATA;
}
export function getSuspenseInstanceFallbackErrorDetails(instance) {
  const dataset = instance.nextSibling && instance.nextSibling.dataset;
  let digest, message, stack;
  if (dataset) {
    digest = dataset.dgst;
    if (__DEV__) {
      message = dataset.msg;
      stack = dataset.stck;
    }
  }
  if (__DEV__) {
    return {
      message,
      digest,
      stack
    };
  } else {
    // Object gets DCE'd if constructed in tail position and matches callsite destructuring
    return {
      digest
    };
  }
}
export function registerSuspenseInstanceRetry(instance, callback) {
  instance._reactRetry = callback;
}
function getNextHydratable(node) {
  // Skip non-hydratable nodes.
  for (; node != null; node = node.nextSibling) {
    const nodeType = node.nodeType;
    if (enableFloat && enableHostSingletons) {
      if (nodeType === ELEMENT_NODE) {
        const element = node;
        switch (element.tagName) {
          // This is subtle. in SVG scope the title tag is case sensitive. we don't want to skip
          // titles in svg but we do want to skip them outside of svg. there is an edge case where
          // you could do `React.createElement('TITLE', ...)` inside an svg scope but the SSR serializer
          // will still emit lowercase. Practically speaking the only time the DOM will have a non-uppercased
          // title tagName is if it is inside an svg.
          // Other Resource types like META, BASE, LINK, and SCRIPT should be treated as resources even inside
          // svg scope because they are invalid otherwise. We still don't need to handle the lowercase variant
          // because if they are present in the DOM already they would have been hoisted outside the SVG scope
          // as Resources. So while it would be correct to skip a <link> inside <svg> and this algorithm won't
          // skip that link because the tagName will not be uppercased it functionally is irrelevant. If one
          // tries to render incompatible types such as a non-resource stylesheet inside an svg the server will
          // emit that invalid html and hydration will fail. In Dev this will present warnings guiding the
          // developer on how to fix.
          case 'TITLE':
          case 'META':
          case 'BASE':
          case 'HTML':
          case 'HEAD':
          case 'BODY':
            {
              continue;
            }
          case 'LINK':
            {
              const linkEl = element;
              // All links that are server rendered are resources except
              // stylesheets that do not have a precedence
              if (linkEl.rel === 'stylesheet' && !linkEl.hasAttribute('data-precedence')) {
                break;
              }
              continue;
            }
          case 'STYLE':
            {
              const styleEl = element;
              if (styleEl.hasAttribute('data-precedence')) {
                continue;
              }
              break;
            }
          case 'SCRIPT':
            {
              const scriptEl = element;
              if (scriptEl.hasAttribute('async')) {
                continue;
              }
              break;
            }
        }
        break;
      } else if (nodeType === TEXT_NODE) {
        break;
      }
    } else if (enableFloat) {
      if (nodeType === ELEMENT_NODE) {
        const element = node;
        switch (element.tagName) {
          case 'TITLE':
          case 'META':
          case 'BASE':
            {
              continue;
            }
          case 'LINK':
            {
              const linkEl = element;
              // All links that are server rendered are resources except
              // stylesheets that do not have a precedence
              if (linkEl.rel === 'stylesheet' && !linkEl.hasAttribute('data-precedence')) {
                break;
              }
              continue;
            }
          case 'STYLE':
            {
              const styleEl = element;
              if (styleEl.hasAttribute('data-precedence')) {
                continue;
              }
              break;
            }
          case 'SCRIPT':
            {
              const scriptEl = element;
              if (scriptEl.hasAttribute('async')) {
                continue;
              }
              break;
            }
        }
        break;
      } else if (nodeType === TEXT_NODE) {
        break;
      }
    } else if (enableHostSingletons) {
      if (nodeType === ELEMENT_NODE) {
        const tag = node.tagName;
        if (tag === 'HTML' || tag === 'HEAD' || tag === 'BODY') {
          continue;
        }
        break;
      } else if (nodeType === TEXT_NODE) {
        break;
      }
    } else {
      if (nodeType === ELEMENT_NODE || nodeType === TEXT_NODE) {
        break;
      }
    }
    if (nodeType === COMMENT_NODE) {
      const nodeData = node.data;
      if (nodeData === SUSPENSE_START_DATA || nodeData === SUSPENSE_FALLBACK_START_DATA || nodeData === SUSPENSE_PENDING_START_DATA) {
        break;
      }
      if (nodeData === SUSPENSE_END_DATA) {
        return null;
      }
    }
  }
  return node;
}
export function getNextHydratableSibling(instance) {
  return getNextHydratable(instance.nextSibling);
}
export function getFirstHydratableChild(parentInstance) {
  return getNextHydratable(parentInstance.firstChild);
}
export function getFirstHydratableChildWithinContainer(parentContainer) {
  return getNextHydratable(parentContainer.firstChild);
}
export function getFirstHydratableChildWithinSuspenseInstance(parentInstance) {
  return getNextHydratable(parentInstance.nextSibling);
}
export function hydrateInstance(instance, type, props, hostContext, internalInstanceHandle, shouldWarnDev) {
  precacheFiberNode(internalInstanceHandle, instance);
  // TODO: Possibly defer this until the commit phase where all the events
  // get attached.
  updateFiberProps(instance, props);
  let parentNamespace;
  if (__DEV__) {
    const hostContextDev = hostContext;
    parentNamespace = hostContextDev.namespace;
  } else {
    parentNamespace = hostContext;
  }

  // TODO: Temporary hack to check if we're in a concurrent root. We can delete
  // when the legacy root API is removed.
  const isConcurrentMode = (internalInstanceHandle.mode & ConcurrentMode) !== NoMode;
  return diffHydratedProperties(instance, type, props, parentNamespace, isConcurrentMode, shouldWarnDev);
}
export function hydrateTextInstance(textInstance, text, internalInstanceHandle, shouldWarnDev) {
  precacheFiberNode(internalInstanceHandle, textInstance);

  // TODO: Temporary hack to check if we're in a concurrent root. We can delete
  // when the legacy root API is removed.
  const isConcurrentMode = (internalInstanceHandle.mode & ConcurrentMode) !== NoMode;
  return diffHydratedText(textInstance, text, isConcurrentMode);
}
export function hydrateSuspenseInstance(suspenseInstance, internalInstanceHandle) {
  precacheFiberNode(internalInstanceHandle, suspenseInstance);
}
export function getNextHydratableInstanceAfterSuspenseInstance(suspenseInstance) {
  let node = suspenseInstance.nextSibling;
  // Skip past all nodes within this suspense boundary.
  // There might be nested nodes so we need to keep track of how
  // deep we are and only break out when we're back on top.
  let depth = 0;
  while (node) {
    if (node.nodeType === COMMENT_NODE) {
      const data = node.data;
      if (data === SUSPENSE_END_DATA) {
        if (depth === 0) {
          return getNextHydratableSibling(node);
        } else {
          depth--;
        }
      } else if (data === SUSPENSE_START_DATA || data === SUSPENSE_FALLBACK_START_DATA || data === SUSPENSE_PENDING_START_DATA) {
        depth++;
      }
    }
    node = node.nextSibling;
  }
  // TODO: Warn, we didn't find the end comment boundary.
  return null;
}

// Returns the SuspenseInstance if this node is a direct child of a
// SuspenseInstance. I.e. if its previous sibling is a Comment with
// SUSPENSE_x_START_DATA. Otherwise, null.
export function getParentSuspenseInstance(targetInstance) {
  let node = targetInstance.previousSibling;
  // Skip past all nodes within this suspense boundary.
  // There might be nested nodes so we need to keep track of how
  // deep we are and only break out when we're back on top.
  let depth = 0;
  while (node) {
    if (node.nodeType === COMMENT_NODE) {
      const data = node.data;
      if (data === SUSPENSE_START_DATA || data === SUSPENSE_FALLBACK_START_DATA || data === SUSPENSE_PENDING_START_DATA) {
        if (depth === 0) {
          return node;
        } else {
          depth--;
        }
      } else if (data === SUSPENSE_END_DATA) {
        depth++;
      }
    }
    node = node.previousSibling;
  }
  return null;
}
export function commitHydratedContainer(container) {
  // Retry if any event replaying was blocked on this.
  retryIfBlockedOn(container);
}
export function commitHydratedSuspenseInstance(suspenseInstance) {
  // Retry if any event replaying was blocked on this.
  retryIfBlockedOn(suspenseInstance);
}

// @TODO remove this function once float lands and hydrated tail nodes
// are controlled by HostSingleton fibers
export function shouldDeleteUnhydratedTailInstances(parentType) {
  return parentType !== 'head' && parentType !== 'body';
}
export function didNotMatchHydratedContainerTextInstance(parentContainer, textInstance, text, isConcurrentMode, shouldWarnDev) {
  checkForUnmatchedText(textInstance.nodeValue, text, isConcurrentMode, shouldWarnDev);
}
export function didNotMatchHydratedTextInstance(parentType, parentProps, parentInstance, textInstance, text, isConcurrentMode, shouldWarnDev) {
  if (parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
    checkForUnmatchedText(textInstance.nodeValue, text, isConcurrentMode, shouldWarnDev);
  }
}
export function didNotHydrateInstanceWithinContainer(parentContainer, instance) {
  if (__DEV__) {
    if (instance.nodeType === ELEMENT_NODE) {
      warnForDeletedHydratableElement(parentContainer, instance);
    } else if (instance.nodeType === COMMENT_NODE) {
      // TODO: warnForDeletedHydratableSuspenseBoundary
    } else {
      warnForDeletedHydratableText(parentContainer, instance);
    }
  }
}
export function didNotHydrateInstanceWithinSuspenseInstance(parentInstance, instance) {
  if (__DEV__) {
    // $FlowFixMe: Only Element or Document can be parent nodes.
    const parentNode = parentInstance.parentNode;
    if (parentNode !== null) {
      if (instance.nodeType === ELEMENT_NODE) {
        warnForDeletedHydratableElement(parentNode, instance);
      } else if (instance.nodeType === COMMENT_NODE) {
        // TODO: warnForDeletedHydratableSuspenseBoundary
      } else {
        warnForDeletedHydratableText(parentNode, instance);
      }
    }
  }
}
export function didNotHydrateInstance(parentType, parentProps, parentInstance, instance, isConcurrentMode) {
  if (__DEV__) {
    if (isConcurrentMode || parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
      if (instance.nodeType === ELEMENT_NODE) {
        warnForDeletedHydratableElement(parentInstance, instance);
      } else if (instance.nodeType === COMMENT_NODE) {
        // TODO: warnForDeletedHydratableSuspenseBoundary
      } else {
        warnForDeletedHydratableText(parentInstance, instance);
      }
    }
  }
}
export function didNotFindHydratableInstanceWithinContainer(parentContainer, type, props) {
  if (__DEV__) {
    warnForInsertedHydratedElement(parentContainer, type, props);
  }
}
export function didNotFindHydratableTextInstanceWithinContainer(parentContainer, text) {
  if (__DEV__) {
    warnForInsertedHydratedText(parentContainer, text);
  }
}
export function didNotFindHydratableSuspenseInstanceWithinContainer(parentContainer) {
  if (__DEV__) {
    // TODO: warnForInsertedHydratedSuspense(parentContainer);
  }
}
export function didNotFindHydratableInstanceWithinSuspenseInstance(parentInstance, type, props) {
  if (__DEV__) {
    // $FlowFixMe: Only Element or Document can be parent nodes.
    const parentNode = parentInstance.parentNode;
    if (parentNode !== null) warnForInsertedHydratedElement(parentNode, type, props);
  }
}
export function didNotFindHydratableTextInstanceWithinSuspenseInstance(parentInstance, text) {
  if (__DEV__) {
    // $FlowFixMe: Only Element or Document can be parent nodes.
    const parentNode = parentInstance.parentNode;
    if (parentNode !== null) warnForInsertedHydratedText(parentNode, text);
  }
}
export function didNotFindHydratableSuspenseInstanceWithinSuspenseInstance(parentInstance) {
  if (__DEV__) {
    // const parentNode: Element | Document | null = parentInstance.parentNode;
    // TODO: warnForInsertedHydratedSuspense(parentNode);
  }
}
export function didNotFindHydratableInstance(parentType, parentProps, parentInstance, type, props, isConcurrentMode) {
  if (__DEV__) {
    if (isConcurrentMode || parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
      warnForInsertedHydratedElement(parentInstance, type, props);
    }
  }
}
export function didNotFindHydratableTextInstance(parentType, parentProps, parentInstance, text, isConcurrentMode) {
  if (__DEV__) {
    if (isConcurrentMode || parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
      warnForInsertedHydratedText(parentInstance, text);
    }
  }
}
export function didNotFindHydratableSuspenseInstance(parentType, parentProps, parentInstance) {
  if (__DEV__) {
    // TODO: warnForInsertedHydratedSuspense(parentInstance);
  }
}
export function errorHydratingContainer(parentContainer) {
  if (__DEV__) {
    // TODO: This gets logged by onRecoverableError, too, so we should be
    // able to remove it.
    console.error('An error occurred during hydration. The server HTML was replaced with client content in <%s>.', parentContainer.nodeName.toLowerCase());
  }
}

// -------------------
//     Test Selectors
// -------------------

export const supportsTestSelectors = true;
export function findFiberRoot(node) {
  const stack = [node];
  let index = 0;
  while (index < stack.length) {
    const current = stack[index++];
    if (isContainerMarkedAsRoot(current)) {
      return getInstanceFromNodeDOMTree(current);
    }
    stack.push(...current.children);
  }
  return null;
}
export function getBoundingRect(node) {
  const rect = node.getBoundingClientRect();
  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height
  };
}
export function matchAccessibilityRole(node, role) {
  if (hasRole(node, role)) {
    return true;
  }
  return false;
}
export function getTextContent(fiber) {
  switch (fiber.tag) {
    case HostResource:
    case HostSingleton:
    case HostComponent:
      let textContent = '';
      const childNodes = fiber.stateNode.childNodes;
      for (let i = 0; i < childNodes.length; i++) {
        const childNode = childNodes[i];
        if (childNode.nodeType === Node.TEXT_NODE) {
          textContent += childNode.textContent;
        }
      }
      return textContent;
    case HostText:
      return fiber.stateNode.textContent;
  }
  return null;
}
export function isHiddenSubtree(fiber) {
  return fiber.tag === HostComponent && fiber.memoizedProps.hidden === true;
}
export function setFocusIfFocusable(node) {
  // The logic for determining if an element is focusable is kind of complex,
  // and since we want to actually change focus anyway- we can just skip it.
  // Instead we'll just listen for a "focus" event to verify that focus was set.
  //
  // We could compare the node to document.activeElement after focus,
  // but this would not handle the case where application code managed focus to automatically blur.
  let didFocus = false;
  const handleFocus = () => {
    didFocus = true;
  };
  const element = node;
  try {
    element.addEventListener('focus', handleFocus);
    // $FlowFixMe[method-unbinding]
    (element.focus || HTMLElement.prototype.focus).call(element);
  } finally {
    element.removeEventListener('focus', handleFocus);
  }
  return didFocus;
}
export function setupIntersectionObserver(targets, callback, options) {
  const rectRatioCache = new Map();
  targets.forEach(target => {
    rectRatioCache.set(target, {
      rect: getBoundingRect(target),
      ratio: 0
    });
  });
  const handleIntersection = entries => {
    entries.forEach(entry => {
      const {
        boundingClientRect,
        intersectionRatio,
        target
      } = entry;
      rectRatioCache.set(target, {
        rect: {
          x: boundingClientRect.left,
          y: boundingClientRect.top,
          width: boundingClientRect.width,
          height: boundingClientRect.height
        },
        ratio: intersectionRatio
      });
    });
    callback(Array.from(rectRatioCache.values()));
  };
  const observer = new IntersectionObserver(handleIntersection, options);
  targets.forEach(target => {
    observer.observe(target);
  });
  return {
    disconnect: () => observer.disconnect(),
    observe: target => {
      rectRatioCache.set(target, {
        rect: getBoundingRect(target),
        ratio: 0
      });
      observer.observe(target);
    },
    unobserve: target => {
      rectRatioCache.delete(target);
      observer.unobserve(target);
    }
  };
}
export function requestPostPaintCallback(callback) {
  localRequestAnimationFrame(() => {
    localRequestAnimationFrame(time => callback(time));
  });
}
// -------------------
//     Resources
// -------------------

export const supportsResources = true;
export function isHostResourceType(type, props, hostContext) {
  let outsideHostContainerContext;
  let namespace;
  if (__DEV__) {
    const hostContextDev = hostContext;
    // We can only render resources when we are not within the host container context
    outsideHostContainerContext = !hostContextDev.ancestorInfo.containerTagInScope;
    namespace = hostContextDev.namespace;
  } else {
    const hostContextProd = hostContext;
    namespace = hostContextProd;
  }
  switch (type) {
    case 'base':
    case 'meta':
      {
        return true;
      }
    case 'title':
      {
        return namespace !== SVG_NAMESPACE;
      }
    case 'link':
      {
        const {
          onLoad,
          onError
        } = props;
        if (onLoad || onError) {
          if (__DEV__) {
            if (outsideHostContainerContext) {
              console.error('Cannot render a <link> with onLoad or onError listeners outside the main document.' + ' Try removing onLoad={...} and onError={...} or moving it into the root <head> tag or' + ' somewhere in the <body>.');
            } else if (namespace === SVG_NAMESPACE) {
              console.error('Cannot render a <link> with onLoad or onError listeners as a descendent of <svg>.' + ' Try removing onLoad={...} and onError={...} or moving it above the <svg> ancestor.');
            }
          }
          return false;
        }
        switch (props.rel) {
          case 'stylesheet':
            {
              const {
                href,
                precedence,
                disabled
              } = props;
              if (__DEV__) {
                validateLinkPropsForStyleResource(props);
                if (typeof precedence !== 'string') {
                  if (outsideHostContainerContext) {
                    console.error('Cannot render a <link rel="stylesheet" /> outside the main document without knowing its precedence.' + ' Consider adding precedence="default" or moving it into the root <head> tag.');
                  } else if (namespace === SVG_NAMESPACE) {
                    console.error('Cannot render a <link rel="stylesheet" /> as a descendent of an <svg> element without knowing its precedence.' + ' Consider adding precedence="default" or moving it above the <svg> ancestor.');
                  }
                }
              }
              return typeof href === 'string' && typeof precedence === 'string' && disabled == null;
            }
          default:
            {
              const {
                rel,
                href
              } = props;
              return typeof href === 'string' && typeof rel === 'string';
            }
        }
      }
    case 'script':
      {
        // We don't validate because it is valid to use async with onLoad/onError unlike combining
        // precedence with these for style resources
        const {
          src,
          async,
          onLoad,
          onError
        } = props;
        if (__DEV__) {
          if (async !== true) {
            if (outsideHostContainerContext) {
              console.error('Cannot render a sync or defer <script> outside the main document without knowing its order.' + ' Try adding async="" or moving it into the root <head> tag.');
            } else if (namespace === SVG_NAMESPACE) {
              console.error('Cannot render a sync or defer <script> as a descendent of an <svg> element.' + ' Try adding async="" or moving it above the ancestor <svg> element.');
            }
          } else if (onLoad || onError) {
            if (outsideHostContainerContext) {
              console.error('Cannot render a <script> with onLoad or onError listeners outside the main document.' + ' Try removing onLoad={...} and onError={...} or moving it into the root <head> tag or' + ' somewhere in the <body>.');
            } else if (namespace === SVG_NAMESPACE) {
              console.error('Cannot render a <script> with onLoad or onError listeners as a descendent of an <svg> element.' + ' Try removing onLoad={...} and onError={...} or moving it above the ancestor <svg> element.');
            }
          }
        }
        return async && typeof src === 'string' && !onLoad && !onError;
      }
    case 'noscript':
    case 'template':
    case 'style':
      {
        if (__DEV__) {
          if (outsideHostContainerContext) {
            console.error('Cannot render <%s> outside the main document. Try moving it into the root <head> tag.', type);
          }
        }
        return false;
      }
  }
  return false;
}
export function prepareRendererToRender(rootContainer) {
  if (enableFloat) {
    prepareToRenderResources(rootContainer);
  }
}
export function resetRendererAfterRender() {
  if (enableFloat) {
    cleanupAfterRenderResources();
  }
}
export { getResource, acquireResource, releaseResource } from './ReactDOMFloatClient';

// -------------------
//     Singletons
// -------------------

export const supportsSingletons = true;
export function isHostSingletonType(type) {
  return type === 'html' || type === 'head' || type === 'body';
}
export function resolveSingletonInstance(type, props, rootContainerInstance, hostContext, validateDOMNestingDev) {
  if (__DEV__) {
    if (validateDOMNestingDev) {
      const hostContextDev = hostContext;
      validateDOMNesting(type, null, hostContextDev.ancestorInfo);
    }
  }
  const ownerDocument = getOwnerDocumentFromRootContainer(rootContainerInstance);
  switch (type) {
    case 'html':
      {
        const documentElement = ownerDocument.documentElement;
        if (!documentElement) {
          throw new Error('React expected an <html> element (document.documentElement) to exist in the Document but one was' + ' not found. React never removes the documentElement for any Document it renders into so' + ' the cause is likely in some other script running on this page.');
        }
        return documentElement;
      }
    case 'head':
      {
        const head = ownerDocument.head;
        if (!head) {
          throw new Error('React expected a <head> element (document.head) to exist in the Document but one was' + ' not found. React never removes the head for any Document it renders into so' + ' the cause is likely in some other script running on this page.');
        }
        return head;
      }
    case 'body':
      {
        const body = ownerDocument.body;
        if (!body) {
          throw new Error('React expected a <body> element (document.body) to exist in the Document but one was' + ' not found. React never removes the body for any Document it renders into so' + ' the cause is likely in some other script running on this page.');
        }
        return body;
      }
    default:
      {
        throw new Error('resolveSingletonInstance was called with an element type that is not supported. This is a bug in React.');
      }
  }
}
export function acquireSingletonInstance(type, props, instance, internalInstanceHandle) {
  if (__DEV__) {
    const currentInstanceHandle = getInstanceFromNodeDOMTree(instance);
    if (currentInstanceHandle) {
      const tagName = instance.tagName.toLowerCase();
      console.error('You are mounting a new %s component when a previous one has not first unmounted. It is an' + ' error to render more than one %s component at a time and attributes and children of these' + ' components will likely fail in unpredictable ways. Please only render a single instance of' + ' <%s> and if you need to mount a new one, ensure any previous ones have unmounted first.', tagName, tagName, tagName);
    }
    switch (type) {
      case 'html':
      case 'head':
      case 'body':
        {
          break;
        }
      default:
        {
          console.error('acquireSingletonInstance was called with an element type that is not supported. This is a bug in React.');
        }
    }
  }
  const attributes = instance.attributes;
  while (attributes.length) {
    instance.removeAttributeNode(attributes[0]);
  }
  setInitialProperties(instance, type, props);
  precacheFiberNode(internalInstanceHandle, instance);
  updateFiberProps(instance, props);
}
export function releaseSingletonInstance(instance) {
  const attributes = instance.attributes;
  while (attributes.length) {
    instance.removeAttributeNode(attributes[0]);
  }
  detachDeletedInstance(instance);
}
export function clearSingleton(instance) {
  const element = instance;
  let node = element.firstChild;
  while (node) {
    const nextNode = node.nextSibling;
    const nodeName = node.nodeName;
    if (isMarkedResource(node) || nodeName === 'HEAD' || nodeName === 'BODY' || nodeName === 'STYLE' || nodeName === 'LINK' && node.rel.toLowerCase() === 'stylesheet') {
      // retain these nodes
    } else {
      element.removeChild(node);
    }
    node = nextNode;
  }
  return;
}