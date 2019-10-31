// Returns an array with all placeholders in str, or
// an empty array if there are none.
export function getPlaceholders(urls) {
  const pattern = /:([a-zA-Z])+/g;
  const result = [];
  urls.forEach(str => {
    const matches = str.match(pattern);
    if (!matches) return;
    // remove leading : from each
    matches.forEach(param => {
      const key = param.replace(':', '');
      if (result.indexOf(key) < 0) {
        result.push(key);
      }
    });
  });
  return result;
}

const getNamePrefixes = ['fetch', 'get', 'retrieve'];
const postNamePrefixes = ['add', 'create'];
const putNamePrefixes = ['update', 'save', 'put'];
const deleteNamePrefixes = ['remove', 'delete'];

// Called only if no method is specified. Tries
// to determine the method based on the action name
// prefixes above.
export function methodFromName(name) {
  const n = name.toLowerCase();
  let found = false;
  getNamePrefixes.forEach(val => {
    if (n.startsWith(val)) found = true;
  });
  if (found) return 'get';
  postNamePrefixes.forEach(val => {
    if (n.startsWith(val)) found = true;
  });
  if (found) return 'post';
  putNamePrefixes.forEach(val => {
    if (n.startsWith(val)) found = true;
  });
  if (found) return 'put';
  deleteNamePrefixes.forEach(val => {
    if (n.startsWith(val)) found = true;
  });
  if (found) return 'delete';
  throw new Error(`Cannot detect method for acton ${name}, please provide a method`);
}

// Called if a method is provided to validate it
export function validateMethod(method) {
  const m = method.toLowerCase();
  const validMethods = ['get', 'post', 'put', 'delete', 'options', 'patch'];
  if (validMethods.indexOf(m) >= 0) return m;
  throw new Error(`Unsupported method: ${m}`);
}

// If the action is not a function creator, if it's a string
// turn it into an action creator with the specified type.
export function formatAction(action, isRequestAction) {
  if (typeof action === 'function') return action;
  else if (typeof action === 'string') {
    // For request actions that are strings, the client can pass in
    // objects for payload and meta
    if (isRequestAction) {
      return (payload, meta) => {
        const result = {type: action};
        if (payload && typeof payload === 'object' && Object.keys(payload).length) {
          result.payload = payload;
        }
        if (typeof meta === 'object' && Object.keys(meta).length) {
          result.meta = meta;
        }
        return result;
      };
    }
    return payload => ({
      type: action,
      payload
    });
  }
  throw new Error('Actions must be functions or strings');
}

// Given an args array, check if the last argument is a function.
// If it is, return the function and new args, with the last one
// removed.
export function getFunctionArg(args) {
  let newArgs = [];
  if (args && args.length) {
    if (typeof args[args.length - 1] === 'function') {
      newArgs = args.slice(0, args.length - 1);
      const fn = args[args.length - 1];
      return [newArgs, fn];
    }
    return [args, null];
  }
  return [newArgs, null];
}

export function getProperty(name, obj) {
  if (!obj) return;
  return obj[name];
}

export function substituteUrlParams(urls, placeholders, payload) {
  const newUrls = [];
  urls.forEach(url => {
    let newUrl = url;
    placeholders.forEach(key => {
      if (newUrl.indexOf(`:${key}`) >= 0) {
        const prop = getProperty(key, payload);
        if (prop) {
          newUrl = url.replace(`:${key}`, prop);
        } else {
          // Throw exception if the URL actually contains the parameter
          // but it is not found in the action payload
          throw new Error(`url ${url} missing parameter ${key}`);
        }
      }
    });
    newUrls.push(newUrl);
  });
  return newUrls;
}

function acceptsData(method) {
  const m = method.toLowerCase();
  return m === 'put' || m === 'post' || m === 'patch';
}

function getRequestUrls(config, requestAction, name) {
  let requestUrls = config.urls;
  if (config.placeholders.length) {
    if (!requestAction.payload) {
      throw new Error(`action ${name} has url placeholders but did not generate a payload`);
    }
    // this will throw an exception if any URL parameters don't have values
    requestUrls = substituteUrlParams(config.urls, config.placeholders, requestAction.payload);
  }
  return requestUrls;
}

/**
 * Generate the axios config for this request
 * @param {*} config - the API config for this action
 * @param {*} action - the API action {name, args}
 * @param {*} store - the store instance
 * @param {*} axios - the axios instance
 */
export function createAxiosConfig(config, action, store, axios) {
  // checks for config function, and removes it from args
  const [args, configFn] = getFunctionArg(action.args);

  // create request action
  const requestAction = config.requestAction(...args);

  // get request URLs with any URL parameters substituted
  const requestUrls = getRequestUrls(config, requestAction, action.name);

  let requestConfig = {
    method: config.method
  };

  // check payload for data and params
  let data = null;
  if (requestAction.payload) {
    data = requestAction.payload.data || requestAction.payload;
    if (requestAction.payload.params) {
      requestConfig.params = requestAction.payload.params;
    }
  }
  if (data && acceptsData(config.method)) {
    requestConfig.data = data;
  }
  // if meta property is present, take all axios request options from it
  if (requestAction.meta && typeof requestAction.meta === 'object') {
    requestConfig = {...requestConfig, ...requestAction.meta};
  }

  // if config function was in args, invoke it and merge results into the request config
  if (configFn) {
    const customConfig = configFn(store.getState());
    requestConfig = {
      ...requestConfig,
      ...customConfig
    };
  }

  const cancelSource = axios.CancelToken.source();
  requestConfig.cancelToken = cancelSource.token;

  return [requestAction, requestConfig, requestUrls, cancelSource];
}
