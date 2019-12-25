// allRequests object stores the inprogress requests for each
// request type, keyed by name. Each entry has:
// {
//   map -> key is requestConfig, value is cancelSource, for
//          all overlapping requests in progress. If the
//          request is canceled the entry is deleted.
//
//   savedConfig  -> the last saved requestConfig
//   savedRequest -> last saved requestAction
//   savedCancelSource -> to cancel last saved request
//
//   latestConfig  -> the latest requestConfig
//   latestRequest -> latest requestAction
//   latestCancelSource -> to cancel latest request
//
// }
const allRequests = {};

export const createRequest = (name, requestAction, requestConfig, cancelSource) => {
  let status = allRequests[name];
  if (status) {
    status.map.set(requestConfig, cancelSource);
    status.latestRequest = requestAction;
    status.latestConfig = requestConfig;
    status.latestCancelSource = cancelSource;
  } else {
    const requestMap = new Map();
    requestMap.set(requestConfig, cancelSource);
    allRequests[name] = {
      map: requestMap,
      savedRequest: null,
      savedConfig: null,
      savedCancelSource: null,
      latestRequest: requestAction,
      latestConfig: requestConfig,
      latestCancelSource: cancelSource
    };
  }
};

export const saveRequest = (name, requestAction, requestConfig, cancelSource) => {
  let status = allRequests[name];
  if (status) {
    status.savedRequest = requestAction;
    status.savedConfig = requestConfig;
    status.savedCancelSource = cancelSource;
  }
};

export const clearSavedRequests = name => {
  let status = allRequests[name];
  if (status) {
    status.savedRequest = null;
    status.savedConfig = null;
    status.savedCancelSource = null;
  }
};

export const cancelRequest = (name, requestConfig) => {
  const status = allRequests[name];
  if (!status) {
    return false;
  }
  if (requestConfig) {
    // cancel specific request
    const cancelSource = status.map.get(requestConfig);
    // cancel request and remove entry, delete
    // allRequests entry if there are no more
    // pending requests.
    cancelSource.cancel();
    status.map.delete(requestConfig);
    if (status.map.size === 0) {
      delete allRequests[name];
    }
    return true;
  } else {
    // cancel all requests
    const iter = status.map.entries();
    let result = iter.next();
    let count = 0;
    while (!result.done) {
      const cancelSource = result.value[1];
      cancelSource.cancel();
      result = iter.next();
      ++count;
    }
    delete allRequests[name];
    return count > 0;
  }
};

export const completeRequest = (name, requestConfig, log) => {
  const status = allRequests[name];
  if (!status) {
    log && log(`no existing requests found for ${name}`);
    return;
  }
  const cancelSource = status.map.get(requestConfig);
  if (cancelSource) {
    status.map.delete(requestConfig);
  }
  if (status.map.size === 0) {
    log && log(`all requests complete for for ${name}`);
    delete allRequests[name];
  } else {
    log && log(`requests still pending for ${name}`);
  }
};

export const getSavedRequest = name => {
  const status = allRequests[name];
  if (!status) {
    return [null, null, null];
  }
  return [status.savedRequest, status.savedConfig, status.savedCancelSource];
};

export const getLatestRequest = name => {
  const status = allRequests[name];
  if (!status) {
    return [null, null, null];
  }
  return [status.latestRequest, status.latestConfig, status.latestCancelSource];
};

export const getRequestCount = name => {
  let count = 0;
  if (name) {
    const status = allRequests[name];
    if (!status) return count;
    const iter = status.map.entries();
    while (!iter.next().done) {
      count = count + 1;
    }
  } else {
    Object.keys(allRequests).forEach(name => {
      const status = allRequests[name];
      count = count + status.map.size;
    });
  }
  return count;
};

export const resetRequests = () => {
  Object.keys(allRequests).forEach(name => {
    const status = allRequests[name];
    const iter = status.map.entries();
    let result = iter.next();
    while (!result.done) {
      const cancelSource = result.value[1];
      cancelSource.cancel();
      result = iter.next();
    }
    delete allRequests[name];
  });
};
