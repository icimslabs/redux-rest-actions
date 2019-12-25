import {
  createRequest,
  cancelRequest,
  completeRequest,
  getSavedRequest,
  getLatestRequest,
  getRequestCount,
  resetRequests,
  saveRequest
} from './requestStatus';

describe('requestStatus tests', () => {
  beforeEach(() => {
    resetRequests();
  });

  test('manage requests', () => {
    const request1 = 'request1';
    const cancel1 = {cancel: jest.fn()};
    const config1 = {one: 1};

    const request1_save = 'request1-save';
    const cancel1_save = {cancel: jest.fn()};
    const config1_save = {one_save: 1};

    const request2 = 'request2';
    const cancel2 = {cancel: jest.fn()};
    const config2 = {two: 1};

    const request3 = 'request3';
    const cancel3 = {cancel: jest.fn()};
    const config3 = {three: 1};

    let canceled = cancelRequest('getTodos');
    expect(canceled).toBe(false);

    expect(getRequestCount()).toBe(0);
    expect(getSavedRequest('getTodos')).toEqual([null, null, null]);
    expect(getSavedRequest('blah')).toEqual([null, null, null]);
    expect(getLatestRequest('getTodos')).toEqual([null, null, null]);
    expect(getLatestRequest('blah')).toEqual([null, null, null]);

    createRequest('getTodos', request1, config1, cancel1);
    expect(getSavedRequest('getTodos')).toEqual([null, null, null]);
    expect(getLatestRequest('getTodos')).toEqual([request1, config1, cancel1]);
    expect(getRequestCount()).toBe(1);

    createRequest('getTodos', request2, config2, cancel2);
    expect(getLatestRequest('getTodos')).toEqual([request2, config2, cancel2]);
    expect(getRequestCount()).toBe(2);

    createRequest('getTodos', request3, config3, cancel3);
    expect(getLatestRequest('getTodos')).toEqual([request3, config3, cancel3]);
    expect(getRequestCount()).toBe(3);

    saveRequest('getTodos', request1_save, config1_save, cancel1_save);
    expect(getSavedRequest('getTodos')).toEqual([request1_save, config1_save, cancel1_save]);

    canceled = cancelRequest('getTodos', config1);
    expect(canceled).toBe(true);
    expect(getRequestCount()).toBe(2);
    expect(cancel1.cancel).toHaveBeenCalled();
    expect(cancel2.cancel).not.toHaveBeenCalled();
    expect(cancel3.cancel).not.toHaveBeenCalled();

    cancelRequest('getTodos', config2);
    expect(cancel2.cancel).toHaveBeenCalled();
    expect(cancel3.cancel).not.toHaveBeenCalled();
    expect(getRequestCount()).toBe(1);

    cancelRequest('getTodos', config3);
    expect(cancel3.cancel).toHaveBeenCalled();
    expect(getRequestCount()).toBe(0);

    completeRequest('getTodos', config1);
    expect(getRequestCount()).toBe(0);

    // no effect
    completeRequest('getTodos', config1);
    completeRequest('getTodos', config2);
    completeRequest('getTodos', config3);
    expect(getRequestCount()).toBe(0);
    expect(getRequestCount('getTodos')).toBe(0);
  });

  test('manage requests for different types', () => {
    const request1 = 'request1';
    const cancel1 = {cancel: jest.fn()}; // getTodos
    const config1 = {one: 1};

    const request2 = 'request2';
    const cancel2 = {cancel: jest.fn()}; // getTodos
    const config2 = {two: 1};

    const request3 = 'request3';
    const cancel3 = {cancel: jest.fn()}; // updateTodo
    const config3 = {three: 1};

    createRequest('getTodos', request1, config1, cancel1);
    createRequest('getTodos', request2, config2, cancel2);
    createRequest('updateTodo', request3, config3, cancel3);
    expect(getRequestCount()).toBe(3);
    expect(getRequestCount('getTodos')).toBe(2);
    expect(getRequestCount('updateTodo')).toBe(1);

    cancelRequest('getTodos', config1);
    expect(cancel1.cancel).toHaveBeenCalled();
    expect(cancel2.cancel).not.toHaveBeenCalled();
    expect(cancel3.cancel).not.toHaveBeenCalled();
    expect(getRequestCount()).toBe(2);
    expect(getRequestCount('getTodos')).toBe(1);
    expect(getRequestCount('updateTodo')).toBe(1);

    cancelRequest('getTodos', config2);
    expect(cancel2.cancel).toHaveBeenCalled();
    expect(cancel3.cancel).not.toHaveBeenCalled();
    expect(getRequestCount('getTodos')).toBe(0);

    cancelRequest('updateTodo', config3);
    expect(cancel3.cancel).toHaveBeenCalled();
    expect(getRequestCount()).toBe(0);
    expect(getRequestCount('getTodos')).toBe(0);
    expect(getRequestCount('updateTodo')).toBe(0);
  });

  test('cancel all requests', () => {
    expect(cancelRequest('getTodos')).toBe(false);

    const request1 = 'request1';
    const cancel1 = {cancel: jest.fn()}; // getTodos
    const config1 = {one: 1};
    const request2 = 'request2';
    const cancel2 = {cancel: jest.fn()}; // getTodos
    const config2 = {two: 1};
    const request3 = 'request3';
    const cancel3 = {cancel: jest.fn()}; // updateTodo
    const config3 = {three: 1};

    createRequest('getTodos', request1, config1, cancel1);
    createRequest('getTodos', request2, config2, cancel2);
    createRequest('updateTodo', request3, config3, cancel3);

    expect(getRequestCount()).toBe(3);
    cancelRequest('getTodos'); // cancels all for getTodos
    expect(cancel1.cancel).toHaveBeenCalled();
    expect(cancel2.cancel).toHaveBeenCalled();
    expect(cancel3.cancel).not.toHaveBeenCalled();
    expect(getRequestCount()).toBe(1);

    completeRequest('getTodos', config1);
    completeRequest('getTodos', config2);
    expect(getRequestCount()).toBe(1);
    completeRequest('updateTodo', config3);
    expect(getRequestCount()).toBe(0);
  });

  test('reset requests', () => {
    const request1 = 'request1';
    const cancel1 = {cancel: jest.fn()}; // getTodos
    const config1 = {one: 1};
    const request2 = 'request2';
    const cancel2 = {cancel: jest.fn()}; // getTodos
    const config2 = {two: 1};
    const request3 = 'request3';
    const cancel3 = {cancel: jest.fn()}; // updateTodo
    const config3 = {three: 1};

    createRequest('getTodos', request1, config1, cancel1);
    createRequest('getTodos', request2, config2, cancel2);
    createRequest('updateTodo', request3, config3, cancel3);

    expect(getRequestCount()).toBe(3);
    resetRequests();
    expect(getRequestCount()).toBe(0);
  });

  test('manage latest requests', () => {
    const request1 = 'request1';
    const cancel1 = {cancel: jest.fn()};
    const config1 = {one: 1};

    const request2 = 'request2';
    const cancel2 = {cancel: jest.fn()};
    const config2 = {two: 1};

    const request1_save = 'request1-save';
    const cancel1_save = {cancel: jest.fn()};
    const config1_save = {one_save_1: 2};

    const request2_save = 'request2-save';
    const cancel2_save = {cancel: jest.fn()};
    const config2_save = {one_save_2: 2};

    // not saved, no request in progress
    saveRequest('getTodos', request1_save, config1_save, cancel1_save);
    expect(getSavedRequest('getTodos')).toEqual([null, null, null]);

    createRequest('getTodos', request1, config1, cancel1);
    createRequest('getTodos', request2, config2, cancel2);
    expect(getSavedRequest('getTodos')).toEqual([null, null, null]);

    saveRequest('getTodos', request1_save, config1_save, cancel1_save);
    expect(getSavedRequest('getTodos')).toEqual([request1_save, config1_save, cancel1_save]);

    saveRequest('getTodos', request2_save, config2_save, cancel2_save);
    expect(getSavedRequest('getTodos')).toEqual([request2_save, config2_save, cancel2_save]);
  });
});
