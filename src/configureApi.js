import Axios from 'axios';
import debounce from 'lodash.debounce';

import {getPlaceholders, methodFromName, validateMethod, formatAction} from './utils';
import {getMiddleware, sendRequest} from './apiMiddleware';
/* eslint-disable */
import {
  API_REQUEST_TYPE,
  API_CANCEL_TYPE,
  SEND_ALL,
  SEND_LATEST,
  CANCEL_PENDING,
  IGNORE,
  DEBOUNCE,
  DEBOUNCE_WAIT,
  DEBOUNCE_TRAILING,
  DEBOUNCE_LEADING,
  DEFAULT_WAIT
} from './types';
/* eslint-disable */

//
// This is export with request methods added by configureApi.
//
const api = {};

// for testing
api.addedMocks = [];
api.addMockMethod = (name, func) => {
  api[name] = func;
  api.addedMocks.push(name);
};
// only remove mocks added by addMockMethod
api.clearMocks = () => {
  api.addedMocks.forEach(name => delete api[name]);
  api.addedMocks = [];
};

//
// The configurations for all api actions, keyed by name. This
// reference gets passed to the middleware in configureApiMiddleware,
// but poplated by configureApi.
//
const apiConfiguration = {};

// Get url or urls property, throw exception if not valid
function getUrls(item) {
  let urls = null;
  if (item.url) {
    urls = [item.url];
  } else if (item.urls && item.urls.length) {
    urls = [...item.urls];
  } else {
    throw new Error('configureApi requires a URL or a URL list');
  }
  return urls;
}

// validate the request method name
function getMethod(name, item) {
  let method = null;
  if (item.method) {
    method = validateMethod(item.method);
  } else {
    method = methodFromName(name);
  }
  return method;
}

// validate all actions
function getActions(item) {
  // request and success
  const minActions = 2;
  // request, success, error
  const requestSuccessError = 3;
  // request, success, error, cancel
  const maxActions = 4;

  let requestAction = null;
  let successAction = null;
  let errorAction = null;
  let canceledAction = null;

  if (!item.actions || !item.actions.length) {
    throw new Error('config actions property is required');
  }
  if (item.actions.length < minActions || item.actions.length > maxActions) {
    throw new Error(`api config must have between ${minActions} and ${maxActions} actions`);
  }

  if (item.actions.length === minActions) {
    requestAction = formatAction(item.actions[0], true);
    successAction = formatAction(item.actions[1]);
  } else if (item.actions.length === requestSuccessError) {
    requestAction = formatAction(item.actions[0], true);
    successAction = formatAction(item.actions[1]);
    errorAction = formatAction(item.actions[2]);
  } else {
    requestAction = formatAction(item.actions[0], true);
    successAction = formatAction(item.actions[1]);
    errorAction = formatAction(item.actions[2]);
    // eslint-disable-next-line
    canceledAction = formatAction(item.actions[3]);
  }
  return {requestAction, successAction, errorAction, canceledAction};
}

function validateDebounceWait(value, defaultValue) {
  if (typeof value === 'undefined') {
    return defaultValue;
  }
  if (!(typeof value === 'number')) {
    throw new Error(`Invalid ${DEBOUNCE_WAIT} option, must be a number`);
  }
  if (value < 0) {
    throw new Error(`Invalid ${DEBOUNCE_WAIT} option, must be non-negative`);
  }
  return value;
}

function validateDebounceLeadingTrailing(which, value, defaultValue) {
  if (typeof value === 'undefined') {
    return defaultValue;
  }
  if (typeof value !== 'boolean') {
    throw new Error(`Invalid ${which} option, must be a boolean`);
  }
  return value;
}

function validateOverlapMethod(value, defaultValue) {
  if (typeof value === 'undefined') {
    return defaultValue;
  }
  const values = [SEND_LATEST, SEND_ALL, CANCEL_PENDING, IGNORE, DEBOUNCE];
  if (values.indexOf(value) < 0) {
    throw new Error(`Invalid overlappingRequests, must be one of: ${values.join(', ')}`);
  }
  return value;
}

function getDebounceOpts(overlapping, cfg, overlapDefaults) {
  // The sendRequest method is added as part of the config. If not
  // using debounce, it is called directly. If using debounce, then a
  // debounced version of the function is configured here.
  const opts = {sendRequest};
  if (overlapping !== DEBOUNCE) return opts;

  let wait = validateDebounceWait(cfg[DEBOUNCE_WAIT], overlapDefaults[DEBOUNCE_WAIT]);
  let leading = validateDebounceLeadingTrailing(
    DEBOUNCE_LEADING,
    cfg[DEBOUNCE_LEADING],
    overlapDefaults[DEBOUNCE_LEADING]
  );
  let trailing = validateDebounceLeadingTrailing(
    DEBOUNCE_TRAILING,
    cfg[DEBOUNCE_TRAILING],
    overlapDefaults[DEBOUNCE_TRAILING]
  );

  opts[DEBOUNCE_WAIT] = wait;
  opts[DEBOUNCE_LEADING] = leading;
  opts[DEBOUNCE_TRAILING] = trailing;
  // configure debounced version of sendRequest
  opts.sendRequest = debounce(sendRequest, wait, {leading, trailing});
  return opts;
}

function processConfigItem(name, item, overlapDefaults) {
  const urls = getUrls(item);
  const method = getMethod(name, item);
  const placeholders = getPlaceholders(urls);
  const spread = item.spread || false;

  const overlappingRequests = validateOverlapMethod(
    item.overlappingRequests,
    overlapDefaults.overlappingRequests
  );

  // requestAction, successAction, errorAction, cancelAction
  const actionFunctions = getActions(item);
  const debounceOptions = getDebounceOpts(overlappingRequests, item, overlapDefaults);

  return {
    name,
    method,
    urls,
    placeholders,
    spread,
    overlappingRequests,
    ...actionFunctions,
    ...debounceOptions
  };
}

function checkOverlapDefaults(overlapDefaults) {
  let newDefaults = {};
  newDefaults.overlappingRequests = validateOverlapMethod(
    overlapDefaults.overlappingRequests,
    SEND_LATEST
  );

  newDefaults[DEBOUNCE_WAIT] = validateDebounceWait(overlapDefaults[DEBOUNCE_WAIT], DEFAULT_WAIT);

  newDefaults[DEBOUNCE_LEADING] = validateDebounceLeadingTrailing(
    DEBOUNCE_LEADING,
    overlapDefaults[DEBOUNCE_LEADING],
    true
  );

  newDefaults[DEBOUNCE_TRAILING] = validateDebounceLeadingTrailing(
    DEBOUNCE_TRAILING,
    overlapDefaults[DEBOUNCE_TRAILING],
    true
  );
  return newDefaults;
}

const configureApi = (store, config, overlapDefaults = {overlappingRequests: SEND_LATEST}) => {
  if (!store) throw new Error('redux store is required for api config');
  if (!config && typeof config !== 'object') throw new Error('a config object is required');

  // If called multiple times, reset first
  Object.keys(apiConfiguration).forEach(key => {
    delete apiConfiguration[key];
  });

  // Check any overlap defaults that were specified, and add defaults
  // for any values not specified.
  overlapDefaults = checkOverlapDefaults(overlapDefaults);

  Object.keys(config).forEach(name => {
    const configObj = processConfigItem(name, config[name], overlapDefaults);
    apiConfiguration[name] = configObj;

    // Add a methods to api for initiating and canceling the request
    api[name] = (...args) =>
      store.dispatch({
        type: API_REQUEST_TYPE,
        name,
        args
      });
    api[name].cancel = (reason, token) =>
      store.dispatch({
        type: API_CANCEL_TYPE,
        name,
        reason,
        token
      });
  });

  if (Object.keys(apiConfiguration).length === 0) {
    throw new Error('configureApi did not contain any valid request configurations');
  }
  // returned for use with tests
  return apiConfiguration;
};

export {api, configureApi};
export const configureApiMiddleware = (axiosConfig = {}, opts = {}) => {
  let axiosInstance = Axios.create(axiosConfig);
  axiosInstance.CancelToken = Axios.CancelToken;
  axiosInstance.isCancel = Axios.isCancel;
  api.mockAdapter = null;

  if (opts.axios) {
    axiosInstance = opts.axios;
  }
  if (opts.mockAdapter) {
    if (!(typeof opts.mockAdapter === 'function')) {
      throw new Error('mockAdapter option must be a function');
    }
    let mockOpts = null;
    if (opts.mockDelay && typeof opts.mockDelay === 'number')
      mockOpts = {delayResponse: opts.mockDelay};
    const mockAdapter = new opts.mockAdapter(axiosInstance, mockOpts);
    api.mockAdapter = mockAdapter;
  }
  return getMiddleware(apiConfiguration, axiosInstance, opts.enableTracing);
};
