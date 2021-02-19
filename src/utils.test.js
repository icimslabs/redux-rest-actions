import {createAction} from 'redux-actions';
import Axios from 'axios';

import {
  getPlaceholders,
  validateMethod,
  methodFromName,
  getFunctionArg,
  getProperty,
  substituteUrlParams,
  createAxiosConfig
} from './utils';
import {configureApi} from './main';

describe('utils tests', () => {
  let store;
  beforeEach(() => {
    store = {dispatch: jest.fn(), getState: jest.fn()};
  });

  test('placeholders are detected', () => {
    let result = getPlaceholders(['/a/b/c']);
    expect(result.length).toBe(0);

    result = getPlaceholders(['']);
    expect(result.length).toBe(0);

    result = getPlaceholders(['/:/:/:']);
    expect(result.length).toBe(0);

    result = getPlaceholders(['/:a/:abc/none/:Def']);
    expect(result.length).toBe(3);
    expect(result).toContain('a');
    expect(result).toContain('abc');
    expect(result).toContain('Def');

    result = getPlaceholders(['/:id/:user/nothing/:id']);
    expect(result.length).toBe(2);
    expect(result).toContain('id');
    expect(result).toContain('user');

    result = getPlaceholders(['/todos/:id', '/users/:group']);
    expect(result.length).toBe(2);
    expect(result).toContain('id');
    expect(result).toContain('group');
  });

  test('methods are validated', () => {
    expect(validateMethod('Get')).toBe('get');
    expect(validateMethod('PuT')).toBe('put');
    expect(validateMethod('post')).toBe('post');
    expect(validateMethod('Delete')).toBe('delete');
    expect(validateMethod('Options')).toBe('options');
    expect(validateMethod('PATCH')).toBe('patch');
    expect(() => {
      validateMethod('a');
    }).toThrow();
    expect(() => {
      validateMethod();
    }).toThrow();
  });

  test('method detection from name', () => {
    expect(methodFromName('getTodos')).toBe('get');
    expect(methodFromName('fetchTodos')).toBe('get');
    expect(methodFromName('addTodo')).toBe('post');
    expect(methodFromName('createTodo')).toBe('post');
    expect(methodFromName('updateTodo')).toBe('put');
    expect(methodFromName('saveTodo')).toBe('put');
    expect(methodFromName('deleteTodo')).toBe('delete');
    expect(methodFromName('RemoveTodo')).toBe('delete');
    expect(() => {
      methodFromName('doSomething');
    }).toThrow();
  });

  test('functionArgs', () => {
    let args = [];
    expect(getFunctionArg(args)).toEqual([[], null]);

    args = [1];
    expect(getFunctionArg(args)).toEqual([[1], null]);

    args = [1, 2];
    expect(getFunctionArg(args)).toEqual([[1, 2], null]);

    const fn = () => {};
    args = [fn];
    let [newArgs, configFn] = getFunctionArg(args);
    expect(newArgs).toEqual([]);
    expect(configFn).toBe(fn);

    args = [fn, 1];
    [newArgs, configFn] = getFunctionArg(args);
    expect(newArgs).toEqual([fn, 1]);
    expect(configFn).toBe(null);

    args = [1, fn];
    [newArgs, configFn] = getFunctionArg(args);
    expect(newArgs).toEqual([1]);
    expect(configFn).toBe(fn);

    args = [1, 2, fn];
    [newArgs, configFn] = getFunctionArg(args);
    expect(newArgs).toEqual([1, 2]);
    expect(configFn).toBe(fn);
  });

  test('getProperty', () => {
    let obj = {};
    expect(getProperty('stuff', obj)).toBe(undefined);

    obj = null;
    expect(getProperty('a', obj)).toBe(undefined);

    obj = {id: 123, todo: 'do stuff'};
    expect(getProperty('id', obj)).toBe(123);
  });

  test('substituteUrlParams', () => {
    let urls = ['/todos'];

    let placeholders = ['id', 'more'];
    let payload = {id: 123};
    let newUrls = substituteUrlParams(urls, placeholders, payload);
    expect(newUrls).toEqual(['/todos']);

    urls = ['/todos/:id'];
    newUrls = substituteUrlParams(urls, placeholders, payload);
    expect(newUrls).toEqual(['/todos/123']);

    urls = ['/todos/:id/and/:more'];
    payload.more = '456';
    newUrls = substituteUrlParams(urls, placeholders, payload);
    expect(newUrls).toEqual(['/todos/123/and/456']);
  });

  it('should create an axios config from payload and meta params', () => {
    const updateTodo = createAction(
      'UPDATE_TODO',
      (id, todo) => ({id, todo}),
      (id, todo, params) => ({params})
    );
    const updateTodoSuccess = createAction('UPDATE_TODO_COMPLETE');

    const {updateTodo: config} = configureApi(store, {
      updateTodo: {
        url: '/todos/:id',
        actions: [updateTodo, updateTodoSuccess]
      }
    });

    const action = {args: ['123', 'do stuff', {a: 'param'}]};
    const [requestAction, axiosConfig, requestUrls] = createAxiosConfig(
      config,
      action,
      store,
      Axios
    );
    expect(axiosConfig).toEqual({
      method: 'put',
      params: {a: 'param'},
      cancelToken: Axios.CancelToken.source().token,
      data: {
        id: '123',
        todo: 'do stuff'
      }
    });
    expect(requestUrls).toEqual(['/todos/123']);
    expect(requestAction).toEqual(updateTodo('123', 'do stuff', {a: 'param'}));
  });
});
