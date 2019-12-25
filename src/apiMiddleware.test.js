import {createAction} from 'redux-actions';
import configureMockStore from 'redux-mock-store';
import MockAdapter from 'axios-mock-adapter';
import {api, configureApiMiddleware, configureApi} from './main';
import {resetRequests} from './requestStatus';

const getTodos = createAction('GET_TODOS');
const getTodos2 = createAction('GET_TODOS2', () => {}, () => ({params: {a: 'b'}}));
const getTodosComplete = createAction('GET_TODOS_COMPLETE');
const getTodosComplete2 = createAction('GET_TODOS_COMPLETE', res => res, () => 'meta value');
const getTodosError = createAction('GET_TODOS_ERROR');
const getTodosCanceled = createAction('GET_TODOS_CANCELED');

const updateTodo = createAction('UPDATE_TODO', (id, todo) => ({id, todo}));
// stores todo in data param of payload
const updateTodo2 = createAction('UPDATE_TODO2', (id, todo) => ({id, data: todo}));
const updateTodoComplete = createAction('UPDATE_TODO_COMPLETE');
const updateTodoMissingUrlParam = createAction('UPDATE_TODO_MISSING_PARAM', todo => ({todo}));
const updateTodoMissingPayload = createAction('UPDATE_TODO_MISSING_PAYLOAD');
const updateTodoError = createAction('UPDATE_TODO_ERROR');

const getMultipleThings = createAction('GET_MULTIPLE_THINGS', params => {
  return params ? {params} : {};
});
const getMultipleThingsSuccess = createAction('GET_MULTIPLE_THINGS_SUCCESS');
const getMultipleThingsSuccess2 = createAction(
  'GET_MULTIPLE_THINGS_SUCCESS',
  res => res,
  // eslint-disable-next-line
  meta => 'meta value'
);
const getMultipleThingsSuccessSpread = createAction('GET_MULTIPLE_THINGS_SUCCESS', (one, two) => ({
  one,
  two
}));
const getMultipleThingsSuccessSpreadMeta = createAction(
  'GET_MULTIPLE_THINGS_SUCCESS',
  (one, two, meta) => ({one, two, meta})
);
const getMultipleThingsError = createAction('GET_MULTIPLE_THINGS_ERROR');
const getMultipleThingsCanceled = createAction('GET_MULTIPLE_THINGS_CANCELED');

// uses default, sendLatest
const search = createAction('SEARCH', filters => ({params: filters}));
// uses overlappingRequests = ignore
const searchIgnore = createAction('SEARCH_IGNORE', filters => ({params: filters}));
// uses overlappingRequests =  sendAll
const searchAll = createAction('SEARCH_ALL', filters => ({params: filters}));
// uses overlappingRequests =  cancelPending
const searchCancelPending = createAction('SEARCH_CANCEL_PENDING', filters => ({params: filters}));
const searchComplete = createAction('SEARCH_COMPLETE');
const searchError = createAction('SEARCH_ERROR');

const debounced = createAction('DEBOUNCED', params => ({params}));
const debouncedComplete = createAction('DEBOUNCED_COMPLETE');
const debouncedError = createAction('DEBOUNCED_ERROR');
const debouncedCanceled = createAction('DEBOUNCED_CANCELED');

const config = {
  getTodos: {
    url: '/api/todos',
    actions: [getTodos, getTodosComplete, getTodosError, getTodosCanceled]
    // overlappingRequests: 'debounce',
    // debounceWait: 1000,
    // debounceLeading: true,
    // debounceTrailing: true
  },
  getTodos2: {
    url: '/api/todos2',
    actions: [getTodos2, getTodosComplete]
  },
  getTodos3: {
    url: '/api/todos3',
    actions: ['GET_TODOS3', 'GET_TODOS3_COMPLETE', 'GET_TODOS3_ERROR']
  },
  getTodos4: {
    url: '/api/todos4',
    actions: ['GET_TODOS4', getTodosComplete2]
  },
  updateTodo: {
    url: '/api/todos/:id',
    actions: [updateTodo, updateTodoComplete]
  },
  updateTodo2: {
    url: '/api/todos/:id',
    actions: [updateTodo2, updateTodoComplete]
  },
  updateTodoMissingUrlParam: {
    url: '/api/todos/:id',
    actions: [updateTodoMissingUrlParam, updateTodoComplete, updateTodoError]
  },
  updateTodoMissingUrlParam2: {
    url: '/api/todos/:id',
    // no error action
    actions: [updateTodoMissingUrlParam, updateTodoComplete]
  },
  updateTodoMissingPayload: {
    url: '/api/todos/:id',
    actions: [updateTodoMissingPayload, updateTodoComplete, updateTodoError]
  },
  search: {
    url: '/api/search',
    method: 'get',
    actions: [search, searchComplete, searchError]
  },
  searchAll: {
    url: '/api/search',
    method: 'get',
    actions: [searchAll, searchComplete, searchError],
    overlappingRequests: 'sendAll'
  },
  searchIgnore: {
    url: '/api/search',
    method: 'get',
    actions: [searchIgnore, searchComplete, searchError],
    overlappingRequests: 'ignore'
  },
  searchCancelPending: {
    url: '/api/search',
    method: 'get',
    actions: [searchCancelPending, searchComplete, searchError],
    overlappingRequests: 'cancelPending'
  },
  getMultipleThings: {
    urls: ['/api/things1', '/api/things2'],
    actions: [
      getMultipleThings,
      getMultipleThingsSuccess,
      getMultipleThingsError,
      getMultipleThingsCanceled
    ]
  },
  getMultipleThings2: {
    urls: ['/api/things1', '/api/things2'],
    actions: [getMultipleThings, getMultipleThingsSuccess2]
  },
  getMultipleThingsSpread: {
    urls: ['/api/things1', '/api/things2'],
    spread: true,
    actions: [getMultipleThings, getMultipleThingsSuccessSpread]
  },
  getMultipleThingsSpreadMeta: {
    urls: ['/api/things1', '/api/things2'],
    spread: true,
    actions: [getMultipleThings, getMultipleThingsSuccessSpreadMeta]
  },
  getSomethingDebounced: {
    url: '/api/debounceMe',
    actions: [debounced, debouncedComplete, debouncedError, debouncedCanceled],
    overlappingRequests: 'debounce',
    debounceWait: 10,
    debounceLeading: true,
    debounceTrailing: true
  }
};

function resolveWithDelay(value, delay) {
  return new Promise(resolve => {
    setTimeout(() => resolve({data: value}), delay);
  });
}

let store, apiMiddleware, AxiosMock, cancelMock;

// Sets up Axios mocked with jest.fn
function setup(delay = 0, initialState = {}) {
  cancelMock = jest.fn();
  AxiosMock = jest.fn();
  AxiosMock.isCancel = jest.fn();
  AxiosMock.CancelToken = {
    source: () => ({token: '123', cancel: cancelMock})
  };
  apiMiddleware = configureApiMiddleware({}, {axios: AxiosMock, mockDelay: delay});
  store = configureMockStore([apiMiddleware])(initialState);
  configureApi(store, config);
}

// Sets up Axios with mock adapter
function setupWithMockAdapter(delay = 0, initialState = {}, axiosConfig = {}) {
  apiMiddleware = configureApiMiddleware(axiosConfig, {
    mockAdapter: MockAdapter,
    mockDelay: delay,
    enableTracing: true
  });
  store = configureMockStore([apiMiddleware])(initialState);
  configureApi(store, config);
}

describe('Api Middleware tests', () => {
  beforeEach(() => {
    resetRequests();
  });

  it('should not accept mockAdapter that is not a function', () => {
    expect(() => {
      apiMiddleware = configureApiMiddleware({}, {axios: jest.fn(), mockAdapter: {}});
    }).toThrow();
  });

  it('should configure a mock adapter', () => {
    setupWithMockAdapter();
    expect(api.mockAdapter).not.toBe(null);
    expect(typeof api.mockAdapter.onGet).toBe('function');
  });

  it('should handle the completed action', async () => {
    setup();
    AxiosMock.mockImplementation(() => Promise.resolve({data: 'do stuff'}));
    const result = await api.getTodos();
    expect(result).toBe('do stuff');
    const actions = store.getActions();
    expect(actions[0]).toEqual(getTodos());
    expect(actions[1].payload).toEqual('do stuff');
  });

  it('should handle the error action', async () => {
    setup();
    const err = new Error('Request failed with status code 500');
    err.response = {
      status: 500,
      data: null
    };
    AxiosMock.mockImplementationOnce(() => {
      throw err;
    });
    const result = await api.getTodos();
    expect(result).toBe(null);
    const actions = store.getActions();
    expect(actions[0]).toEqual(getTodos());
    expect(actions[1].payload).toEqual(new Error('Request failed with status code 500'));
  });

  it('should handle cancellation', async () => {
    setupWithMockAdapter();
    api.mockAdapter.onGet('/api/todos').reply(200, 'do stuff');
    const promise = api.getTodos();
    api.getTodos.cancel('changed my mind');
    const result = await promise;
    expect(result).toBe(undefined);
    const actions = store.getActions();
    expect(actions.length).toBe(2);
    expect(actions[1]).toEqual(getTodosCanceled('changed my mind'));
  });

  it('should handle cancellation with no requests', async () => {
    setup();
    AxiosMock.mockImplementation(() => Promise.resolve({data: 'do stuff'}));
    api.getTodos.cancel('changed my mind');
    const actions = store.getActions();
    expect(actions.length).toBe(0);
  });

  it('should handle cancellation with no cancel action', async () => {
    setup(1);
    AxiosMock.mockImplementation(() => Promise.resolve({data: 'do stuff'}));
    api.getTodos2();
    api.getTodos2.cancel('changed my mind');
    const actions = store.getActions();
    expect(actions.length).toBe(1);
    expect(actions[0]).toEqual(getTodos2());
  });

  it('should handle url parameters', async () => {
    setupWithMockAdapter();
    api.mockAdapter.onPut('/api/todos/1').reply(200, 'do stuff');

    const result = await api.updateTodo('1', 'do stuff');
    expect(result).toBe('do stuff');

    const actions = store.getActions();
    expect(actions.length).toBe(2);
  });

  test('payload as post data', async () => {
    setup();
    AxiosMock.mockImplementation(() => Promise.resolve({data: 'ok'}));

    const result = await api.updateTodo('1', 'do stuff');
    expect(result).toBe('ok');
    const cfg = AxiosMock.mock.calls[0][0];
    expect(cfg.data).toEqual({id: '1', todo: 'do stuff'});
  });

  test('payload.data as post data', async () => {
    setup();
    AxiosMock.mockImplementation(() => Promise.resolve({data: 'ok'}));

    const result = await api.updateTodo2('1', 'do stuff');
    expect(result).toBe('ok');
    const cfg = AxiosMock.mock.calls[0][0];
    expect(cfg.data).toEqual('do stuff');
  });

  test('payload.meta as config params', async () => {
    setup();
    AxiosMock.mockImplementation(() => Promise.resolve({data: 'ok'}));

    const result = await api.getTodos2();
    expect(result).toBe('ok');
    const cfg = AxiosMock.mock.calls[0][0];
    expect(cfg).toEqual({
      params: {a: 'b'},
      url: '/api/todos2',
      method: 'get',
      cancelToken: '123'
    });
  });

  test('no error action', async () => {
    setup();
    AxiosMock.mockImplementation(() => Promise.reject(new Error('bad')));

    const result = await api.getTodos2();
    expect(result).toBe(null);
    const actions = store.getActions();
    expect(actions.length).toBe(1);
    expect(actions[0]).toEqual({type: 'GET_TODOS2', meta: {params: {a: 'b'}}});
  });

  test('actions as strings', async () => {
    setup();
    AxiosMock.mockImplementation(() => Promise.resolve({data: 'ok'}));

    const result = await api.getTodos3();
    expect(result).toBe('ok');
    const cfg = AxiosMock.mock.calls[0][0];
    expect(cfg).toEqual({
      url: '/api/todos3',
      method: 'get',
      cancelToken: '123'
    });

    const actions = store.getActions();
    expect(actions.length).toBe(2);
    expect(actions[0]).toEqual({type: 'GET_TODOS3'});
    expect(actions[1]).toEqual({
      type: 'GET_TODOS3_COMPLETE',
      payload: 'ok',
      meta: {data: 'ok'}
    });
  });

  test('actions as strings with meta properties', async () => {
    setup();
    AxiosMock.mockImplementation(() => Promise.resolve({data: 'ok'}));

    await api.getTodos3({}, {params: {a: 'b'}, data: 'stuff'});
    const cfg = AxiosMock.mock.calls[0][0];
    expect(cfg).toEqual({
      url: '/api/todos3',
      method: 'get',
      cancelToken: '123',
      params: {a: 'b'},
      data: 'stuff'
    });

    const actions = store.getActions();
    expect(actions.length).toBe(2);
    expect(actions[0]).toEqual({
      type: 'GET_TODOS3',
      meta: {
        params: {a: 'b'},
        data: 'stuff'
      }
    });
    expect(actions[1]).toEqual({
      type: 'GET_TODOS3_COMPLETE',
      payload: 'ok',
      meta: {data: 'ok'}
    });
  });

  test('actions as strings with payload property', async () => {
    setup();
    AxiosMock.mockImplementation(() => Promise.resolve({data: 'ok'}));

    await api.getTodos3({id: '123'});
    const cfg = AxiosMock.mock.calls[0][0];
    expect(cfg).toEqual({
      url: '/api/todos3',
      method: 'get',
      cancelToken: '123'
    });

    const actions = store.getActions();
    expect(actions.length).toBe(2);
    expect(actions[0]).toEqual({
      type: 'GET_TODOS3',
      payload: {id: '123'}
    });
    expect(actions[1]).toEqual({
      type: 'GET_TODOS3_COMPLETE',
      payload: 'ok',
      meta: {data: 'ok'}
    });
  });

  test('actions as strings with payload and properties', async () => {
    setup();
    AxiosMock.mockImplementation(() => Promise.resolve({data: 'ok'}));

    await api.getTodos3({id: '123'}, {params: {a: 'b'}});
    const cfg = AxiosMock.mock.calls[0][0];
    expect(cfg).toEqual({
      url: '/api/todos3',
      method: 'get',
      cancelToken: '123',
      params: {a: 'b'}
    });

    const actions = store.getActions();
    expect(actions.length).toBe(2);
    expect(actions[0]).toEqual({
      type: 'GET_TODOS3',
      payload: {id: '123'},
      meta: {params: {a: 'b'}}
    });
    expect(actions[1]).toEqual({
      type: 'GET_TODOS3_COMPLETE',
      payload: 'ok',
      meta: {data: 'ok'}
    });
  });

  it('should fail when url placeholder is missing', async () => {
    setupWithMockAdapter();
    api.mockAdapter.onPut('/api/todos/1').reply(200, 'do stuff');

    const promise = api.updateTodoMissingUrlParam('do stuff');
    const result = await promise;
    expect(result).toBe(null);

    const actions = store.getActions();
    expect(actions.length).toBe(1);
    expect(actions[0]).toEqual(
      updateTodoError(new Error('url /api/todos/:id missing parameter id'))
    );
  });

  test('missing placeholder with no error action', async () => {
    setupWithMockAdapter();
    api.mockAdapter.onPut('/api/todos/1').reply(200, 'do stuff');

    const promise = api.updateTodoMissingUrlParam2('do stuff');
    const result = await promise;
    expect(result).toBe(null);

    const actions = store.getActions();
    expect(actions.length).toBe(0);
  });

  it('should fail when payload is missing for URL params', async () => {
    setupWithMockAdapter();
    api.mockAdapter.onPut('/api/todos/1').reply(200, 'do stuff');

    const result = await api.updateTodoMissingPayload();
    expect(result).toBe(null);

    const actions = store.getActions();
    expect(actions.length).toBe(1);
    const msg =
      'action updateTodoMissingPayload has url placeholders but did not generate a payload';
    expect(actions[0]).toEqual(updateTodoError(new Error(msg)));
  });

  test('get request params from state using action creators', async () => {
    setup(0, {filters: {a: 123}});
    AxiosMock.mockImplementation(() => Promise.resolve({data: 'do stuff'}));

    const fn = state => ({params: state.filters});

    await api.getTodos(fn);

    const actions = store.getActions();
    expect(actions.length).toBe(2);
    expect(AxiosMock.mock.calls[0]).toEqual([
      {
        url: '/api/todos',
        method: 'get',
        params: {
          a: 123
        },
        cancelToken: '123'
      }
    ]);
  });

  test('get request params from state using action strings', async () => {
    setup(0, {headers: {'X-Header1': 'header1'}});
    AxiosMock.mockImplementation(() => Promise.resolve({data: 'do stuff'}));

    const fn = state => ({headers: state.headers});

    await api.getTodos3(null, {params: {a: 'b'}}, fn);

    const actions = store.getActions();
    console.log(JSON.stringify(actions));
    expect(actions.length).toBe(2);
    expect(AxiosMock.mock.calls[0]).toEqual([
      {
        url: '/api/todos3',
        method: 'get',
        params: {
          a: 'b'
        },
        headers: {'X-Header1': 'header1'},
        cancelToken: '123'
      }
    ]);
  });

  test('result is null if res.data is not present', async () => {
    setup();
    AxiosMock.mockImplementation(() => Promise.resolve('do stuff'));

    const result = await api.getTodos();
    expect(result).toBe(null);
  });

  it('should handle multiple requests in parallel', async () => {
    setupWithMockAdapter();
    api.mockAdapter.onGet('/api/things1').reply(200, 'Things One');
    api.mockAdapter.onGet('/api/things2').reply(200, 'Things Two');

    const result = await api.getMultipleThings();
    expect(result).toEqual(['Things One', 'Things Two']);

    const actions = store.getActions();
    expect(actions.length).toBe(2);
    expect(actions[1].payload).toEqual(['Things One', 'Things Two']);
  });

  it('should handle multiple requests in parallel with spread', async () => {
    setupWithMockAdapter();
    api.mockAdapter.onGet('/api/things1').reply(200, 'Things One');
    api.mockAdapter.onGet('/api/things2').reply(200, 'Things Two');

    const result = await api.getMultipleThingsSpread();
    expect(result).toEqual(['Things One', 'Things Two']);

    const actions = store.getActions();
    expect(actions.length).toBe(2);
    expect(actions[1].payload).toEqual({one: 'Things One', two: 'Things Two'});
  });

  it('should handle multiple requests in parallel with spread and meta', async () => {
    setupWithMockAdapter();
    api.mockAdapter.onGet('/api/things1').reply(200, 'Things One');
    api.mockAdapter.onGet('/api/things2').reply(200, 'Things Two');

    const result = await api.getMultipleThingsSpreadMeta();
    expect(result).toEqual(['Things One', 'Things Two']);

    const actions = store.getActions();
    expect(actions.length).toBe(2);
    expect(actions[1].payload.one).toEqual('Things One');
    expect(actions[1].payload.two).toEqual('Things Two');
    expect(actions[1].payload.meta.length).toBe(2);
  });

  it('should not overwrite a returned meta value from success action', async () => {
    setupWithMockAdapter();
    api.mockAdapter.onGet('/api/todos4').reply(200, 'do stuff');

    const result = await api.getTodos4();
    expect(result).toBe('do stuff');

    const actions = store.getActions();
    expect(actions.length).toBe(2);
    expect(actions[1].meta).toBe('meta value');
  });

  it('should not overwrite a returned meta value from  success action (multiple)', async () => {
    setupWithMockAdapter();
    api.mockAdapter.onGet('/api/things1').reply(200, 'Things One');
    api.mockAdapter.onGet('/api/things2').reply(200, 'Things Two');

    const result = await api.getMultipleThings2();
    expect(result).toEqual(['Things One', 'Things Two']);

    const actions = store.getActions();
    expect(actions.length).toBe(2);
    expect(actions[1].meta).toBe('meta value');
  });

  it('should handle multiple requests in parallel with rejection', async () => {
    setupWithMockAdapter();
    api.mockAdapter.onGet('/api/things1').reply(200, 'Things One');
    api.mockAdapter.onGet('/api/things2').reply(500, 'server down');

    const result = await api.getMultipleThings();
    expect(result).toBe(null);

    const actions = store.getActions();
    expect(actions.length).toBe(2);

    expect(actions[1]).toEqual(
      getMultipleThingsError(new Error('Request failed with status code 500'))
    );
  });

  it('should handle multiple requests in parallel with cancel', async () => {
    setupWithMockAdapter(2);
    api.mockAdapter.onGet('/api/things1').reply(200, 'Things One');
    api.mockAdapter.onGet('/api/things2').reply(200, 'server down');

    const promise = api.getMultipleThings();
    api.getMultipleThings.cancel('changed mind');

    const result = await promise;
    expect(result).toBe(undefined);

    const actions = store.getActions();
    expect(actions.length).toBe(2);
    expect(actions[1]).toEqual(getMultipleThingsCanceled('changed mind'));
  });

  //
  // test overlappingRequest optioins
  //

  test('overlappingRequests - sendLatest', async () => {
    setupWithMockAdapter(2);
    api.mockAdapter.onGet('/api/search', {params: {q: 'A'}}).reply(200, 'search results A');
    api.mockAdapter.onGet('/api/search', {params: {q: 'ABCD'}}).reply(200, 'search results ABCD');
    api.mockAdapter.onGet('/api/search').reply(200, 'search results');

    const initialRequest = api.search({q: 'A'});
    api.search({q: 'AB'});
    api.search({q: 'ABC'});
    api.search({q: 'ABCD'});
    let results = await initialRequest;
    expect(results).toBe('search results ABCD');
    let actions = store.getActions();

    expect(actions.length).toBe(4);
    expect(actions[0]).toEqual(search({q: 'A'}));
    expect(actions[1].payload).toEqual('search results A');
    expect(actions[2]).toEqual(search({q: 'ABCD'}));
    expect(actions[3].payload).toEqual('search results ABCD');

    const finalRequest = api.search({q: 'A'});
    results = await finalRequest;
    expect(results).toBe('search results A');
    actions = store.getActions();
    expect(actions.length).toBe(6);
  });

  test('overlappingRequests - ignore', async () => {
    setup();
    AxiosMock.mockImplementation(() => resolveWithDelay('search results', 3));

    const initialRequest = api.searchIgnore({q: 'A'});
    api.searchIgnore({q: 'AB'});
    api.searchIgnore({q: 'ABC'});
    api.searchIgnore({q: 'ABCD'});

    const results = await initialRequest;
    expect(results).toBe('search results');

    expect(AxiosMock.mock.calls[0][0]).toEqual({
      method: 'get',
      url: '/api/search',
      cancelToken: '123',
      params: {q: 'A'}
    });

    const actions = store.getActions();
    expect(actions.length).toBe(2);
    expect(actions[0]).toEqual(searchIgnore({q: 'A'}));
    expect(actions[1].payload).toEqual('search results');
  });

  test('overlappingRequests - sendAll', async () => {
    setupWithMockAdapter(3);
    api.mockAdapter.onGet('/api/search').reply(200, 'search results');

    const initialRequest = api.searchAll({q: 'A'});
    api.searchAll({q: 'AB'});
    api.searchAll({q: 'ABC'});
    const latestRequest = api.searchAll({q: 'ABCD'});

    await initialRequest;
    const results = await latestRequest;
    expect(results).toBe('search results');

    expect(AxiosMock.mock.calls[0][0]).toEqual({
      method: 'get',
      url: '/api/search',
      cancelToken: '123',
      params: {q: 'A'}
    });

    const actions = store.getActions();
    expect(actions.length).toBe(8);

    expect(actions[0]).toEqual(searchAll({q: 'A'}));
    expect(actions[1]).toEqual(searchAll({q: 'AB'}));
    expect(actions[2]).toEqual(searchAll({q: 'ABC'}));
    expect(actions[3]).toEqual(searchAll({q: 'ABCD'}));

    expect(actions[4].payload).toEqual('search results');
    expect(actions[4].meta.config.params).toEqual({q: 'A'});

    expect(actions[5].payload).toEqual('search results');
    expect(actions[5].meta.config.params).toEqual({q: 'AB'});

    expect(actions[6].payload).toEqual('search results');
    expect(actions[6].meta.config.params).toEqual({q: 'ABC'});

    expect(actions[7].payload).toEqual('search results');
    expect(actions[7].meta.config.params).toEqual({q: 'ABCD'});
  });

  test('overlappingRequests - cancelPending', async () => {
    setupWithMockAdapter(3);
    api.mockAdapter.onGet('/api/search').reply(200, 'search results');

    api.searchCancelPending({q: 'A'});
    api.searchCancelPending({q: 'AB'});
    api.searchCancelPending({q: 'ABC'});
    const results = await api.searchCancelPending({q: 'ABCD'});

    expect(results).toBe('search results');

    const actions = store.getActions();
    expect(actions.length).toBe(5);

    expect(actions[4].payload).toBe('search results');
    expect(actions[4].meta.config.params).toEqual({q: 'ABCD'});
  });

  test('overlappingRequests - cancelPending with just one request', async () => {
    setupWithMockAdapter(3);
    api.mockAdapter.onGet('/api/search').reply(200, 'search results');

    const results = await api.searchCancelPending({q: 'A'});
    expect(results).toBe('search results');

    const actions = store.getActions();
    expect(actions.length).toBe(2);
  });

  it('should handle multiple requests with sendLatest option', async () => {
    setupWithMockAdapter(2);
    api.mockAdapter.onGet('/api/things1').reply(200, 'Things One');
    api.mockAdapter.onGet('/api/things2').reply(200, 'Things Two');

    const promise = api.getMultipleThings();
    api.getMultipleThings({a: 'b'});
    api.getMultipleThings({a: 'bc'});
    api.getMultipleThings({a: 'bcd'});

    const result = await promise;
    expect(result).toEqual(['Things One', 'Things Two']);

    const actions = store.getActions();
    expect(actions.length).toBe(4);
    expect(actions[1].payload).toEqual(['Things One', 'Things Two']);
    expect(actions[3].payload).toEqual(['Things One', 'Things Two']);
    expect(actions[3].meta[0].config.params).toEqual({a: 'bcd'});
  });

  it('should handle multiple requests with sendLatest option', async () => {
    setupWithMockAdapter(2);
    api.mockAdapter.onGet('/api/things1').reply(200, 'Things One');
    api.mockAdapter.onGet('/api/things2').reply(200, 'Things Two');

    const promise = api.getMultipleThings();
    api.getMultipleThings({a: 'b'});
    api.getMultipleThings({a: 'bc'});
    api.getMultipleThings({a: 'bcd'});

    const result = await promise;
    expect(result).toEqual(['Things One', 'Things Two']);

    const actions = store.getActions();
    expect(actions.length).toBe(4);
    expect(actions[1].payload).toEqual(['Things One', 'Things Two']);
    expect(actions[3].payload).toEqual(['Things One', 'Things Two']);
    expect(actions[3].meta[0].config.params).toEqual({a: 'bcd'});
  });

  test('debounce leading and trailing', async () => {
    config.getSomethingDebounced.debounceLeading = true;
    config.getSomethingDebounced.debounceTrailing = true;
    setup(1);
    AxiosMock.mockImplementation(() => Promise.resolve({data: 'do stuff'}));

    api.getSomethingDebounced({p1: '1'});
    api.getSomethingDebounced({p1: '2'});
    api.getSomethingDebounced({p1: '3'});
    api.getSomethingDebounced({p1: '4'});
    api.getSomethingDebounced({p1: '5'});
    api.getSomethingDebounced({p1: '6'});
    api.getSomethingDebounced({p1: '7'});
    api.getSomethingDebounced({p1: '8'});

    await resolveWithDelay('anything', 15);

    const actions = store.getActions();
    expect(actions.length).toBe(4);
    expect(actions[0].payload.params).toEqual({p1: '1'});
    expect(actions[2].payload.params).toEqual({p1: '8'});
  });

  test('debounce trailing only', async () => {
    config.getSomethingDebounced.debounceLeading = false;
    config.getSomethingDebounced.debounceTrailing = true;
    setup(1);
    AxiosMock.mockImplementation(() => Promise.resolve({data: 'do stuff'}));

    api.getSomethingDebounced({p1: '1'});
    api.getSomethingDebounced({p1: '2'});
    api.getSomethingDebounced({p1: '3'});
    api.getSomethingDebounced({p1: '4'});
    api.getSomethingDebounced({p1: '5'});
    api.getSomethingDebounced({p1: '6'});
    api.getSomethingDebounced({p1: '7'});
    api.getSomethingDebounced({p1: '8'});

    await resolveWithDelay('anything', 15);

    const actions = store.getActions();
    expect(actions.length).toBe(2);
    expect(actions[0].payload.params).toEqual({p1: '8'});
  });

  test('debounce with cancel', async () => {
    config.getSomethingDebounced.debounceLeading = false;
    config.getSomethingDebounced.debounceTrailing = true;
    setup(1);
    AxiosMock.mockImplementation(() => Promise.resolve({data: 'do stuff'}));

    api.getSomethingDebounced({p1: '1'});
    api.getSomethingDebounced({p1: '2'});
    api.getSomethingDebounced({p1: '3'});
    api.getSomethingDebounced({p1: '4'});
    api.getSomethingDebounced({p1: '5'});
    api.getSomethingDebounced({p1: '6'});
    api.getSomethingDebounced({p1: '7'});
    api.getSomethingDebounced({p1: '8'});
    api.getSomethingDebounced.cancel();

    await resolveWithDelay('anything', 15);

    const actions = store.getActions();
    expect(actions.length).toBe(0);
  });

  it('should use a specific request config', async () => {
    const config = {
      baseURL: 'https://myserver',
      headers: {
        'X-Header1': 'header1',
        'X-Header2': 'header2'
      }
    };
    setupWithMockAdapter(0, {}, config);
    api.mockAdapter.onGet('https://myserver/api/todos3').reply(200, 'do stuff');

    await api.getTodos3();
    const actions = store.getActions();
    expect(actions.length).toBe(2);
    expect(actions[1].meta.config.url).toBe('https://myserver/api/todos3');
    expect(actions[1].meta.config.headers['X-Header1']).toBe('header1');
    expect(actions[1].meta.config.headers['X-Header2']).toBe('header2');
  });

  it('should use global request config with per-request config', async () => {
    const config = {
      baseURL: 'https://myserver',
      headers: {
        'X-Header1': 'header1',
        'X-Header2': 'header2'
      }
    };
    const requestConfig = {
      params: {a: 'b'}
    };

    setupWithMockAdapter(0, {}, config);
    api.mockAdapter.onGet('https://myserver/api/todos3').reply(200, 'do stuff');

    await api.getTodos3({}, requestConfig);
    const actions = store.getActions();
    expect(actions.length).toBe(2);
    expect(actions[1].meta.config.url).toBe('https://myserver/api/todos3');
    expect(actions[1].meta.config.headers['X-Header1']).toBe('header1');
    expect(actions[1].meta.config.headers['X-Header2']).toBe('header2');
    expect(actions[1].meta.config.params).toEqual({a: 'b'});
  });

  it('should use global request config with per-request config overwrite', async () => {
    const config = {
      baseURL: 'https://myserver',
      headers: {
        'X-Header1': 'header1',
        'X-Header2': 'header2'
      }
    };
    const requestConfig = {
      params: {a: 'b'},
      headers: {'X-Header1': 'changed'}
    };

    setupWithMockAdapter(0, {}, config);
    api.mockAdapter.onGet('https://myserver/api/todos3').reply(200, 'do stuff');

    await api.getTodos3({}, requestConfig);
    const actions = store.getActions();
    expect(actions.length).toBe(2);
    expect(actions[1].meta.config.url).toBe('https://myserver/api/todos3');
    expect(actions[1].meta.config.headers['X-Header1']).toBe('changed');
    expect(actions[1].meta.config.headers['X-Header2']).toBe('header2');
    expect(actions[1].meta.config.params).toEqual({a: 'b'});
  });

  test('multiple debounced requests', async () => {
    const apiConfig = {
      request1: {
        method: 'get',
        url: '/one',
        actions: ['ONE', 'ONE_SUCCESS']
      },
      request2: {
        method: 'get',
        url: '/two',
        actions: ['TWO', 'TWO_SUCCESS']
      },
      request3: {
        method: 'get',
        url: '/three',
        actions: ['THREE', 'THREE_SUCCESS']
      }
    };

    apiMiddleware = configureApiMiddleware(
      {},
      {
        mockAdapter: MockAdapter,
        mockDelay: 1
      }
    );

    const opts = {overlappingRequests: 'debounce', debounceWait: 4, debounceLeading: false};
    store = configureMockStore([apiMiddleware])({});
    configureApi(store, apiConfig, opts);
    api.mockAdapter.onGet('/one').reply(200, 'One');
    api.mockAdapter.onGet('/two').reply(200, 'Two');
    api.mockAdapter.onGet('/three').reply(200, 'Three');

    api.request1({}, {params: {one: 1}});
    api.request1({}, {params: {one: 2}});
    api.request1({}, {params: {one: 3}});

    api.request2({}, {params: {two: 1}});
    api.request2({}, {params: {two: 2}});
    api.request2({}, {params: {two: 3}});

    api.request3({}, {params: {three: 1}});
    api.request3({}, {params: {three: 2}});
    api.request3({}, {params: {three: 3}});

    await resolveWithDelay(null, 10);

    const actions = store.getActions();
    expect(actions.length).toBe(6);

    expect(actions[0].type).toBe('ONE');
    expect(actions[0].meta.params).toEqual({one: 3});
    expect(actions[1].type).toBe('TWO');
    expect(actions[1].meta.params).toEqual({two: 3});
    expect(actions[2].type).toBe('THREE');
    expect(actions[2].meta.params).toEqual({three: 3});

    expect(actions[3].type).toBe('ONE_SUCCESS');
    expect(actions[3].payload).toBe('One');
    expect(actions[3].meta.config.params).toEqual({one: 3});
    expect(actions[4].type).toBe('TWO_SUCCESS');
    expect(actions[4].payload).toBe('Two');
    expect(actions[4].meta.config.params).toEqual({two: 3});
    expect(actions[5].type).toBe('THREE_SUCCESS');
    expect(actions[5].payload).toBe('Three');
    expect(actions[5].meta.config.params).toEqual({three: 3});
  });

  test('chaining single to single actions', async () => {
    const getUser = createAction('GET_USER', id => ({id}));
    const getUserSuccess = createAction('GET_USER_SUCCESS');
    const getUserPosts = createAction('GET_USER_POSTS', idOrPayload => {
      if (typeof idOrPayload === 'string') return {userId: idOrPayload};
      else return {userId: idOrPayload.id};
    });
    const getUserPostsSuccess = createAction('GET_USER_POSTS_SUCCESS');

    const apiConfig = {
      getUser: {
        url: '/users/:id',
        actions: [getUser, getUserSuccess],
        then: 'getUserPosts'
      },
      getUserPosts: {
        url: '/posts/:userId',
        actions: [getUserPosts, getUserPostsSuccess]
      }
    };

    const opts = {mockAdapter: MockAdapter};
    apiMiddleware = configureApiMiddleware({}, opts);

    store = configureMockStore([apiMiddleware])({});
    configureApi(store, apiConfig);
    const user = {name: 'bill', id: '1234'};
    const posts = ['one', 'two'];
    api.mockAdapter.onGet('/users/1234').reply(200, user);
    api.mockAdapter.onGet('/posts/1234').reply(200, posts);

    await api.getUser('1234');
    await resolveWithDelay(null, 1); // wait for then request to complete

    const actions = store.getActions();
    expect(actions.length).toBe(4);

    expect(actions[1].payload).toEqual(user);
    expect(actions[2].type).toBe('GET_USER_POSTS');
    expect(actions[3].type).toBe('GET_USER_POSTS_SUCCESS');
    expect(actions[3].payload).toEqual(posts);
  });

  test('chaining single to multi actions, no spread', async () => {
    const check = jest.fn();

    const getUser = createAction('GET_USER', id => ({id}));
    const getUserSuccess = createAction('GET_USER_SUCCESS');
    const getMultipleThings = createAction('GET_MULTIPLE_THINGS', result => check(result));
    const getMultipleThingsSuccess = createAction('GET_MULTIPLE_THINGS_SUCCESS', result => {
      check(result);
      return result;
    });

    const apiConfig = {
      getUser: {
        url: '/users/:id',
        actions: [getUser, getUserSuccess],
        then: 'getMultipleThings'
      },
      getMultipleThings: {
        urls: ['/thing1', '/thing2'],
        actions: [getMultipleThings, getMultipleThingsSuccess]
      }
    };
    const opts = {mockAdapter: MockAdapter};
    apiMiddleware = configureApiMiddleware({}, opts);

    store = configureMockStore([apiMiddleware])({});
    configureApi(store, apiConfig);
    const user = {name: 'bill', id: '1234'};
    const things = ['Thing One', 'Thing Two'];
    api.mockAdapter.onGet('/users/1234').reply(200, user);
    api.mockAdapter.onGet('/thing1').reply(200, 'Thing One');
    api.mockAdapter.onGet('/thing2').reply(200, 'Thing Two');

    await api.getUser('1234');
    await resolveWithDelay(null, 1); // wait for then request to complete

    const actions = store.getActions();
    expect(actions.length).toBe(4);

    expect(check.mock.calls.length).toBe(2);
    expect(check.mock.calls[0][0]).toEqual(user);
    expect(check.mock.calls[1][0]).toEqual(things);

    expect(actions[1].payload).toEqual(user);
    expect(actions[2].type).toBe('GET_MULTIPLE_THINGS');
    expect(actions[3].type).toBe('GET_MULTIPLE_THINGS_SUCCESS');
    expect(actions[3].payload).toEqual(things);
  });

  test('chaining single to multi actions, with spread', async () => {
    const check = jest.fn();

    const getUser = createAction('GET_USER', id => ({id}));
    const getUserSuccess = createAction('GET_USER_SUCCESS');
    const getMultipleThings = createAction('GET_MULTIPLE_THINGS', result => check(result));
    const getMultipleThingsSuccess = createAction('GET_MULTIPLE_THINGS_SUCCESS', (one, two) => {
      check(one, two);
      return [one, two];
    });

    const apiConfig = {
      getUser: {
        url: '/users/:id',
        actions: [getUser, getUserSuccess],
        then: 'getMultipleThings'
      },
      getMultipleThings: {
        urls: ['/thing1', '/thing2'],
        actions: [getMultipleThings, getMultipleThingsSuccess],
        spread: true
      }
    };
    const opts = {mockAdapter: MockAdapter};
    apiMiddleware = configureApiMiddleware({}, opts);

    store = configureMockStore([apiMiddleware])({});
    configureApi(store, apiConfig);
    const user = {name: 'bill', id: '1234'};
    const things = ['Thing One', 'Thing Two'];
    api.mockAdapter.onGet('/users/1234').reply(200, user);
    api.mockAdapter.onGet('/thing1').reply(200, 'Thing One');
    api.mockAdapter.onGet('/thing2').reply(200, 'Thing Two');

    await api.getUser('1234');
    await resolveWithDelay(null, 1); // wait for then request to complete

    const actions = store.getActions();
    expect(actions.length).toBe(4);

    expect(check.mock.calls.length).toBe(2);
    expect(check.mock.calls[0][0]).toEqual(user);
    expect(check.mock.calls[1][0]).toEqual('Thing One');
    expect(check.mock.calls[1][1]).toEqual('Thing Two');

    expect(actions[1].payload).toEqual(user);
    expect(actions[2].type).toBe('GET_MULTIPLE_THINGS');
    expect(actions[3].type).toBe('GET_MULTIPLE_THINGS_SUCCESS');
    expect(actions[3].payload).toEqual(things);
  });

  test('chaining multiple to single action, without spread', async () => {
    const check = jest.fn();

    const getUser = createAction('GET_USER', (value1, value2) => {
      check(value1, value2);
      return {id: '1234'};
    });
    const getUserSuccess = createAction('GET_USER_SUCCESS');
    const getMultipleThings = createAction('GET_MULTIPLE_THINGS', result => check(result));
    const getMultipleThingsSuccess = createAction('GET_MULTIPLE_THINGS_SUCCESS', (one, two) => {
      check(one, two);
      return [one, two];
    });

    const apiConfig = {
      getUser: {
        url: '/users/:id',
        actions: [getUser, getUserSuccess]
      },
      getMultipleThings: {
        urls: ['/thing1', '/thing2'],
        actions: [getMultipleThings, getMultipleThingsSuccess],
        spread: false,
        then: 'getUser'
      }
    };
    const opts = {mockAdapter: MockAdapter};
    apiMiddleware = configureApiMiddleware({}, opts);

    store = configureMockStore([apiMiddleware])({});
    configureApi(store, apiConfig);
    const user = {name: 'bill', id: '1234'};
    const things = ['Thing One', 'Thing Two'];
    api.mockAdapter.onGet('/users/1234').reply(200, user);
    api.mockAdapter.onGet('/thing1').reply(200, 'Thing One');
    api.mockAdapter.onGet('/thing2').reply(200, 'Thing Two');

    await api.getMultipleThings();
    await resolveWithDelay(null, 1); // wait for then request to complete

    const actions = store.getActions();
    expect(actions.length).toBe(4);

    expect(check.mock.calls.length).toBe(3);
    expect(check.mock.calls[0][0]).toBe(undefined);
    expect(check.mock.calls[1][0]).toEqual(things);
    expect(check.mock.calls[1][1].length).toBe(2); // meta values

    expect(check.mock.calls[2][0]).toEqual(things);
    expect(check.mock.calls[2][1]).toBe(undefined);
  });

  test('chaining multiple to single action, with spread', async () => {
    const check = jest.fn();

    const getUser = createAction('GET_USER', (value1, value2, meta) => {
      check(value1, value2, meta);
      return {id: '1234'};
    });
    const getUserSuccess = createAction('GET_USER_SUCCESS');
    const getMultipleThings = createAction('GET_MULTIPLE_THINGS', result => check(result));
    const getMultipleThingsSuccess = createAction('GET_MULTIPLE_THINGS_SUCCESS', (one, two) => {
      check(one, two);
      return [one, two];
    });

    const apiConfig = {
      getUser: {
        url: '/users/:id',
        actions: [getUser, getUserSuccess]
      },
      getMultipleThings: {
        urls: ['/thing1', '/thing2'],
        actions: [getMultipleThings, getMultipleThingsSuccess],
        spread: true,
        then: 'getUser'
      }
    };
    const opts = {mockAdapter: MockAdapter};
    apiMiddleware = configureApiMiddleware({}, opts);

    store = configureMockStore([apiMiddleware])({});
    configureApi(store, apiConfig);
    const user = {name: 'bill', id: '1234'};
    api.mockAdapter.onGet('/users/1234').reply(200, user);
    api.mockAdapter.onGet('/thing1').reply(200, 'Thing One');
    api.mockAdapter.onGet('/thing2').reply(200, 'Thing Two');

    await api.getMultipleThings();
    await resolveWithDelay(null, 1); // wait for then request to complete

    const actions = store.getActions();
    expect(actions.length).toBe(4);

    expect(check.mock.calls.length).toBe(3);
    expect(check.mock.calls[0][0]).toBe(undefined);
    expect(check.mock.calls[1][0]).toEqual('Thing One');
    expect(check.mock.calls[1][1]).toEqual('Thing Two');
  });
});
