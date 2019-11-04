## redux-rest-actions

Redux middleware with simple configuration for handling REST requests with minimal code.

To install:

`npm install --save redux-rest-actions`

or

`yarn add redux-rest-actions`

## Description

One of the primary functions that React / Redux apps need to deal with is transferring data between REST endpoints and the application's redux state. While this is straightforward with middleware like `redux-thunk`, it still requires developers to write and test async actions. This middleware removes the need to write or test any asynchronous actions for REST API requests.

Features:

- Declarative structure. All REST API request URLs, methods, actions, and options configured in one place.
- No need to write or test async actions or use thunks or sagas for API requests. The middleware dispatches synchronous actions with REST API results.
- Uses [Flux Standard Actions](https://github.com/redux-utilities/flux-standard-action) to provide response data in the `payload` property and request/response params in the `meta` property.
- Uses Axios and provides full control of the global and per-request [configuration](https://github.com/axios/axios#request-config) in a very simple way.
- Option to use `axios-mock-adapter` for development.
- Provides a useful default behavior and options for handling overlapping requests, including debouncing.
- Provides a simple mechanism for request cancelation (ignoring a previous request).

## Quick Start

There are three methods exported: `configureApiMiddleware` to access the Redux middleware, `configureApi` to configure your REST API, and `api` to initiate (and cancel) API requests.

This is a full example showing how to render a TODO list in your UI.

1. Add the middleware to Redux:

```js
import { createStore, applyMiddleware } from 'redux';
import { configureApiMiddleware } from 'redux-rest-actions';
import todos from './reducers'

const apiMiddleware = configureApiMiddleware();

// include with your other middleware
const store = createStore(todos, [], applyMiddleware(apiMiddleware,...));
```

2. Create your actions and reducer as usual. This example uses [redux-actions](https://redux-actions.js.org/):

```js
import { createAction, handleActions } from 'redux-actions';
export const getTodos = createAction('GET_TODOS'); // request action
export const getTodosComplete = createAction('GET_TODOS_COMPLETE'); // success action

const reducer = handleActions({
  [getTodos]: (action, state) => ({...state, pending: true}),
  [getTodosComplete]: (action, state) => ({todos: action.payload}),
  {todos: []}
});

export default reducer;
```

3. Configure the API to define the REST endpoints and actions to dispatch:

```js
import {configureApi} from 'redux-rest-actions';
import {getTodos, getTodosComplete} from './todos';

const store = configureStore();

// store is used to dispatch actions, and also allows you to provide request
// params from current state as described below.
configureApi(store, {
  getTodos: {
    url: '/api/todos',
    actions: [getTodos, getTodosComplete] // can also add error/canceled actions
  }
});
```

4. Initiate REST requests in your UI components:

```js
// Inside UI components, request data by invoking methods on "api". The container
// maps state.todos -> todos. Methods on api are already bound to dispatch:

import { api } from 'redux-rest-actions';

<TodosContainer>
  <TodosView todos={todos} fetchTodos={api.getTodos} cancel={api.getTodos.cancel}>
</TodosContainer>
```

## Configuring API Actions

Each property in the API config defines a request action, and adds a property with the same name to `api` (e.g. `api.getTodos`). In the `actions` parameter, you define the actions to dispatch, the first two being required:

```js
// API Config
{
  requestAction: {
    ...
    actions: [requestAction, successAction, errorAction, canceledAction]
  }
}
```

Actions can be action creator `functions` or action type `strings`.

### Using Action Creator Functions

If your actions are functions, invoking `api.requestAction` will do the following:

- Invoke your `requestAction` with whatever arguments are passed to `api.requestAction`, and check the returned `action.payload` and `action.meta` properties to determine values for url placeholders, query parameters, post/put data, and any other per-request parameters, as described below. There is also a way to get request parameters from your redux `state`.

- Generate a [request config](https://github.com/axios/axios#request-config), and sends the REST request after checking any `overlappingRequests` or `debounce` options.

- Dispatch `requestAction`.

- Dispatch `successAction` or `errorAction` with API results or errors.

Your `successAction` is invoked as `successAction(response.data, response)`. The second argument is provided in case you want to access anything from [the full response](https://github.com/axios/axios#response-schema).

If an error occurs, your `errorAction` will be invoked with the `Error` that was thrown. The error response is described [here](https://github.com/axios/axios#handling-errors). If `error.response` is not defined it means no response was received from the server.

If `api.requestAction.cancel(reason)` is invoked while a request is pending, the results will be ignored and a `canceledAction`, if defined, will be invoked with `reason` and dispatched.

### Using Action Type Strings

If you specify actions as `type` strings, like `GET_TODOS`, `GET_TODOS_COMPLETE`, `GET_TODOS_ERROR`, they will be dispatched as:

```js
// requestAction
{type: 'GET_TODOS'}

// successAction
{type: 'GET_TODOS_COMPLETE', payload: response.data, meta: response}

// errorAction
{type: 'GET_TODOS_ERROR', payload: error, meta: response, error: true}

```

## Providing Request Parameters and URL Placeholders

The most common per-request parameters needed are URL `placeholders`, `query params`, and `data` for POST, PUT or PATCH requests.

### Using Action Creators

If `requestAction` is an action creator `function`, the default behavior is as follows:

- It is invoked, and the returned `action.payload` and `action.meta` properties are checked.
- Any property in `action.payload` will be used to substitute URL `placeholders`. So `/todos/:id` would replace `:id` with the value of `payload.id`.
- By default, the entire `action.payload` is used as `data` for POST/PUT/PATCH requests. However if there is an `action.payload.data` property, then that will be used as data.
- All properties of `action.meta` will be added to the generated request config. Note that any property in `action.meta` will override corresponding properties in `action.payload`. If you provide a `meta` property it's probably best to just include URL placeholders in `payload` and put all request params in `meta`.

*Example*. Providing a URL placeholder and PUT data using an action creator:

```js
import { createAction } from 'redux-actions';

export const updateTodo = createAction('UPDATE_TODO', (id, todo) => ({id, data: todo}))

// Your API Config
{
  updateTodo: {
    url: '/todos/:id',
    actions: [updateTodo, updateTodoComplete]
  }
}
```

Then invoking `api.updateTodo('1234', todo)` will result in the request:

```
PUT /todos/1234 data=todo
```

You can also include a `metaCreator` to specify any request config values:

```js
export const updateTodo = createAction(
  'UPDATE_TODO',
  (id, todo) => ({id}), // for URL placeholder
  (id, todo) => ({headers: ..., data: todo, timeout: 1000, ...})
);
```

### Using Action Type Strings

If `requestAction` is a `string`, then you can pass `api.requestAction` two objects, one representing the `payload` (with URL placeholders) and one representing `meta` properties, with request config properties. 

Using the same example:

```js
// API Config
{
  updateTodo: {
    url: '/todos/:id',
    actions: ['UPDATE_TODO', 'UPDATE_TODO_COMPLETE']
  }
}
```

Then you need to invoke `api.updateTodos` with two objects, one for URL placeholders and one with request parameters:

```js
function updateTodo(id, todo) {
  api.updateTodo({id}, {data: todo});
}
```

And the resulting `PUT` request would be the same as above.

Don't forget to include an empty object or `null` as the first paramter if you don't have any URL placeholders:

```js
// API Config
{
  createTodo: {
    url: '/todos',
    actions: ['SAVE_TODO', 'SAVE_TODO_COMPLETE'],
    method: 'post'
  }
}

function createTodo(todo) {
  api.createTodo(null, {data: todo});
}
```

### Getting Data and Request Parameters from Redux

As noted, invoking `api.requestAction(...args)` will invoke your `requestAction(...args)` before dispatching it. However, if the _only_ or _last_ argument is a `function`, it will be invoked with the current Redux `state`, and all properties in the returned object will added to the request config. The `function` will be removed from the argument list before invoking your `requestAction`.

For example, `getTodos` takes no arguments, but you can invoke `api.getTodos` like this to include query param filters from Redux:

```js
import {api} from 'redux-rest-actions';
import selectFilters from './selectors';

function onFetchTodos() {
  api.getTodos(state => ({
      params: selectFilters(state)
  });
}
```

If using action type `strings`, the same applies to `api.requestAction` where you specify a `function` as the third parameter:

```js
const placeholders = {id: '123'};
const requestParams = {headers: ..., data: ...};

api.doRequest(placeholders, requestParams, (state) => state.filters);
```

In this case `state.filters` will be added to `requestParams`.

## Making multiple REST requests with a single action

In the API config, you can specify an array of URLs with the `urls` property. They will be sent in parallel using `Promise.all`, and your `successAction` will be invoked with two arrays, the first array containing `response.data` from each URL, and the second array containing `response` (the full response object) corresponding to each URL.

As an example, if your API config has:

```js
  getMultipleThings: {
    urls: ['/api/things1', '/api/things2'],
    actions: [
      getMultipleThings,
      getMultipleThingsSuccess,
      getMultipleThingsError
    ]
  }
```

Then `getMultipleThingsSuccess` will be invoked with:

```js
api.mockAdapter.onGet('/api/things1').reply(200, 'Thing One');
api.mockAdapter.onGet('/api/things2').reply(200, 'Thing Two');

// getMultipleThings will be called with:
getMultipleThings(['Things One, 'Things Two'], [response1, response2]);
```

If you used `string` actions, then `action.payload` will be the first array, and `action.meta` will be the second array.

If you want your action creator function invoked with separate arguments for the results, you can specify the `spread` option:

```js
const getMultipleThingsSuccess = createAction('MULTIPLE_THINGS_SUCCESS', (one, two) => ({one, two}));

// in api config
{
  getMultipleThings: {
    urls: ['api/things1', 'api/things2'],
    spread: true,
    actions[getMultipleThings, getMultipleThingsSuccess]
  }
}
```

Then `one` will be `"Thing One"` and `two` will be `"Thing Two"`. Your `successAction` will still be passed the array of all response objects as the last argument.

## Behavior when invoking overlapping API requests

When `api.requestAction` is invoked while a request is already in progress, you can configure options for how this is handled using the `overlappingRequests` api config option. The values are as follows:

- `sendLatest` (default) - Each time the request action is invoked, a new axios config is generated, but the latest request is not sent until the pending request completes. When the request completes, the `successAction` is immediately dispatched, and a new `requestAction` is sent _if_ the latest request config is different from that of the last request (e.g. the query params have changed).

- `debounce` - Similar to `sendLatest` in that a new request config is generated for each call to `api.requestAction`, but the actual sending of the request is debounced. If `overlappingRequests` is set to `debounce`, you can configure the `debounceWait` time, and `debounceLeading` and/or `debounceTrailing` options [see lodach docs](https://lodash.com/docs/4.17.15#debounce). The default `debounceWait` is `500` ms, with `debounceLeading` and `debounceTrailing` set to `true`.

- `ignore` - Ignore all overlapping requests. You can use this for things like form submissions, however it's a better UI experience to also enforce this by disable buttons and input elements while the current request is pending

The last two options are probably not as useful, but for completeness:

- `sendAll` - All requests are sent.

- `cancelPending` - If a request is sent while one is pending, the inprogress request is canceled, and the latest one is sent.

The `sendLatest` option sends requests as fast as the server can process them, but only allowing one pending request at a time. An example would be an autocomplete or search function, where the query params change on each request. The default handling of `api.search(filter)` with the user typing "ABCD" into the search input would be:

```
  api.search(filters='A')

    dispatch(searchAction('A'))

    request => GET /api/search?q='A'

  api.search(filters='AB')

        X (update request config, don't send) => GET /api/search?q='AB'

  api.search(filters='ABC')

        X (update request config, don't send) => GET /api/search?q='ABC'

  api.search(filters='ABCD')

        X (update request config, don't send) => GET /api/search?q='ABCD'

    <-- response arrives for 'A'
    dispatch(searchSuccess(resp.data))

    (Since the URL params have changed the request config):
    dispatch(searchAction('ABCD'))

    request => GET /api/search?q='ABCD'

      <-- response arrives for 'ABCD'
      dispatch(searchSuccess(resp.data))

```

If you want to limit the rate at which requests can be sent, use the `debounce` option.

If you want to use the same method for all requests, You can specify a third argument to `configureApi` which is an object containing any of the `overlappingRequests` or `debounce` properties above. They will be applied to any request config that does not specifically apply them.

## API

### `configureApiMiddleware`

`configureApiMiddleware(config = {}, options = {})`

The first argument to `configureApiMiddleware` is used to [configure](https://github.com/axios/axios#request-config) the Axios instance used by the middleware. All configuration values can be overriden per-request as described above. 

Valid `options` are:
* `mockAdapter` - Instance of `axios-mock-adapter`, see next section.
* `mockDelay` - Mock delay in milliseconds.
* `enableTracing` - `true` to enable console log trace of middleware actions.

#### Using a mock adapter in development

For development, you can set an option to wrap the axios instance with `axios-mock-adapter` as shown below. If you use this option then the mock adapter will be available as `api.mockAdapter`. It also accepts a `mockDelay` value in milliseconds (default 0):

```js
import MockAdapter from 'axios-mock-adapter';

const options = {};
if (process.env.REACT_APP_USE_MOCKS) {
  options.mockAdapter = MockAdapter;
  options.mockDelay = 2000;
}

const apiMiddleware = configureApiMiddleware({}, opts);

// making requests
if (process.env.REACT_APP_USE_MOCKS) {
  api.mockAdapter.onGet('/api/todos').reply(200, ['do stuff']);
}
```

For testing you can also override the axios instance using `jest` or any other mock function. **NOTE:** If you do this, you must also add the `isCancel` and `CancelToken` functions on the mock:

```javascript
import { configureApiMiddleware } from 'redux-rest-actions';

let mockAxios;

beforeEach(() => {
  mockApi = jest.fn();
  mockApi.isCancel = jest.fn(); // used internally
  mockApi.CancelToken = jest.fn(); // used internally
  configureApiMiddleware({}, {axios: mockAxios});
});

test('getTodosSuccess', () => {
  mockApi.mockImplementation(() => Promise.resolve({data: ['do stuff']}));
  ...
});
```

### `configureApi`

`configureApi(store, apiConfig, overlappingDefaults = {overlappingRequests: 'sendLatest'})`

The first argument is the redux `store`. The store is used to dispatch actions invoked on `api`. It is also used to provide a way for your actions to get data and URL params from redux state as described above.

The second argument defines API configuration.

The third argument provides default values for handling overlapping requests that get applied to API requests that do not specify the `overlappingRequest` or `debounce` options.

#### apiConfig properties

Each named property defines a request action with the following properties:

- `url` (string) or `urls` (array of string) - `required`. The REST URL to invoke, which may contain placeholders, like `/api/todos/:id` which will be substitued as desribed below. You can use `baseURL` of the axios config to prepend a common base. If the URL is fully qualified, `baseURL` will not be used. If you specify an array of URLs they will be fetched in parallel with `Promise.all`, and the data delivered to your action will be an array of the response data in the same order.

- `actions` (array of strings or objects) - `required`. The actions are ordered as `requestAction`, `successAction`, `errorAction` and `canceledAction`, with the request and success actions being required. If these are action creator functions, they will be invoked before dispatch. Invoking the `requestAction` allows you to pass data and url params to the API as described below. If the actions are strins (action types), the dispatched action will be `{type: action, payload: {response or error}}`.

- `method` (string) - `optional` if the method can be detected from the request property name as described below.

- `overlappingRequests` (string) - `optional`, default is `sendLatest`. May also be `debounce`, `ignore`, `sendAll`, or `cancelPending.

- `debounceWait` (number) - the debounce wait time, in milliseconds. Default is `500`.

- `debounceLeading` (boolean) - Send debounced requests on leading edge. Default is `true`.

- `debounceTrailing` (boolean) - Send debounced requests on trailing edge. Default is `true`.

- `configOption` - `optional`. Any per-request configuration defined [here](https://github.com/axios/axios#request-config).

Default method names, based on the name of the request action prefix are determined as follows:

```javascript
const getNamePrefixes = ['fetch', 'get', 'retrieve']; // get
const postNamePrefixes = ['add', 'create']; // post
const putNamePrefixes = ['update', 'save', 'put']; // put
const deleteNamePrefixes = ['remove', 'delete']; // delete
```

### `api.requestAction`

The return value from `api.requestAction` is a promise in all cases except when `overlappingRequests` is set to `debounce` (in which case it's `undefined`, because the function is always invoked later). You can use this in your UI components to take action when the promise completes successfully. For example, if your action submits a form using `overlappingRequests` set to `ignore`, you can navigate to the home page when the submit is complete:

```js
function onSubmitForm(data) {
  api.onSubmit(data)
    .then(() => history.push('/home'));
}
```



