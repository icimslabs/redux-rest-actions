import {api, configureApi, configureApiMiddleware} from './main';
import {SEND_LATEST, CANCEL_PENDING, IGNORE, SEND_ALL, DEBOUNCE} from './types';

describe('configureApi tests', () => {
  let store;
  beforeEach(() => {
    store = {
      getState: jest.fn(),
      dispatch: jest.fn()
    };
  });

  it('should add and clear mock methods', () => {
    api.addMockMethod('foo', () => {});
    api.addMockMethod('bar', () => {});
    expect(typeof api.foo).toBe('function');
    expect(typeof api.bar).toBe('function');
    api.clearMocks();
    expect(typeof api.foo).toBe('undefined');
    expect(typeof api.bar).toBe('undefined');
  });

  it('should configure middleware with defaults', () => {
    const mw = configureApiMiddleware();
    expect(typeof mw).toBe('function');
  });

  it('should reject missing store or config items', () => {
    expect(() => {
      configureApi();
    }).toThrow(/store/);

    expect(() => {
      configureApi(store);
    }).toThrow(/config/);

    expect(() => {
      configureApi(store, {});
    }).toThrow(/not contain any valid/);
  });

  it('should validate url and action properties', () => {
    let apiConfig = {getTodos: {}};

    expect(() => {
      configureApi(store, apiConfig);
    }).toThrow(/requires a URL/);

    apiConfig = {getTodos: {url: 'something'}};
    expect(() => {
      configureApi(store, apiConfig);
    }).toThrow(/actions property is required/);

    apiConfig = {getTodos: {url: 'something', actions: []}};
    expect(() => {
      configureApi(store, apiConfig);
    }).toThrow(/actions property is required/);

    apiConfig = {getTodos: {url: 'something', actions: [{}, {}]}};
    expect(() => {
      configureApi(store, apiConfig);
    }).toThrow(/functions or strings/);

    apiConfig = {getTodos: {url: 'something', actions: ['something', 'somethingComplete']}};
    expect(() => {
      configureApi(store, apiConfig);
    }).not.toThrow();
  });

  it('should validate overlappingRequests property', () => {
    let cfg;
    let apiConfig = {
      getTodos: {
        url: '/api/todos',
        actions: ['GET_TODOS', 'GET_TODOS_COMPLETE']
      }
    };

    expect(() => {
      cfg = configureApi(store, apiConfig);
    }).not.toThrow();
    expect(cfg.getTodos.overlappingRequests).toBe(SEND_LATEST);

    apiConfig.getTodos.overlappingRequests = 'bad';
    expect(() => {
      configureApi(store, apiConfig);
    }).toThrow(/Invalid overlappingRequests/);

    apiConfig.getTodos.overlappingRequests = CANCEL_PENDING;
    expect(() => {
      configureApi(store, apiConfig);
    }).not.toThrow();
    expect(cfg.getTodos.overlappingRequests).toBe(CANCEL_PENDING);

    apiConfig.getTodos.overlappingRequests = IGNORE;
    expect(() => {
      configureApi(store, apiConfig);
    }).not.toThrow();
    expect(cfg.getTodos.overlappingRequests).toBe('ignore');

    apiConfig.getTodos.overlappingRequests = SEND_LATEST;
    expect(() => {
      configureApi(store, apiConfig);
    }).not.toThrow();
    expect(cfg.getTodos.overlappingRequests).toBe(SEND_LATEST);

    apiConfig.getTodos.overlappingRequests = SEND_ALL;
    expect(() => {
      configureApi(store, apiConfig);
    }).not.toThrow();
    expect(cfg.getTodos.overlappingRequests).toBe(SEND_ALL);
  });

  it('should throw for invalid or missing method', () => {
    let apiConfig = {
      getTodos: {
        url: '/api/todos',
        method: 'bad',
        actions: ['GET_TODOS', 'GET_TODOS_COMPLETE']
      }
    };
    expect(() => {
      configureApi(store, apiConfig);
    }).toThrow(/Unsupported method/);

    apiConfig = {
      someMethod: {
        url: '/api/todos',
        actions: ['GET_TODOS', 'GET_TODOS_COMPLETE']
      }
    };
    expect(() => {
      configureApi(store, apiConfig);
    }).toThrow(/Cannot detect method/);
  });

  it('should throw for too many actions', () => {
    let apiConfig = {
      getTodos: {
        url: '/api/todos',
        actions: ['GET_TODOS', 'GET_TODOS_COMPLETE', 'BLAH', 'BLAHH', 'BLAHHH']
      }
    };
    expect(() => {
      configureApi(store, apiConfig);
    }).toThrow(/must have between 2 and 4 actions/);

    apiConfig.getTodos.actions = ['GET_TODOS', 'GET_TODOS_COMPLETE', 'BLAH', 'BLAHH'];
    expect(() => {
      configureApi(store, apiConfig);
    }).not.toThrow();
  });

  it('should check invalid debounce options', () => {
    let apiConfig = {
      getTodos: {
        url: '/api/todos',
        actions: ['GET_TODOS', 'GET_TODOS_COMPLETE'],
        overlappingRequests: 'debounce',
        debounceWait: 'bad'
      }
    };
    expect(() => {
      configureApi(store, apiConfig);
    }).toThrow(/number/);

    apiConfig.getTodos.debounceWait = -1;
    expect(() => {
      configureApi(store, apiConfig);
    }).toThrow(/non-negative/);

    apiConfig.getTodos.debounceWait = 1;
    apiConfig.getTodos.debounceTrailing = 'bad';
    expect(() => {
      configureApi(store, apiConfig);
    }).toThrow(/Invalid debounceTrailing option, must be a boolean/);

    apiConfig.getTodos.debounceTrailing = 'false';
    apiConfig.getTodos.debounceLeading = 'bad';
    expect(() => {
      configureApi(store, apiConfig);
    }).toThrow(/Invalid debounceLeading option, must be a boolean/);
  });

  it('should have default debounce options', () => {
    let cfg;
    let apiConfig = {
      getTodos: {
        url: '/api/todos',
        actions: ['GET_TODOS', 'GET_TODOS_COMPLETE'],
        overlappingRequests: 'debounce'
      }
    };
    expect(() => {
      cfg = configureApi(store, apiConfig);
    }).not.toThrow();

    expect(cfg.getTodos.debounceWait).toBe(500);
    expect(cfg.getTodos.debounceLeading).toBe(true);
    expect(cfg.getTodos.debounceTrailing).toBe(true);
  });

  it('should configure valid debounce options', () => {
    let cfg;
    let apiConfig = {
      getTodos: {
        url: '/api/todos',
        actions: ['GET_TODOS', 'GET_TODOS_COMPLETE'],
        overlappingRequests: 'debounce',
        debounceWait: 1000,
        debounceLeading: false,
        debounceTrailing: false
      }
    };
    expect(() => {
      cfg = configureApi(store, apiConfig);
    }).not.toThrow();

    expect(cfg.getTodos.debounceWait).toBe(1000);
    expect(cfg.getTodos.debounceLeading).toBe(false);
    expect(cfg.getTodos.debounceTrailing).toBe(false);
  });

  it('should have default overlappingRequest options', () => {
    let cfg;
    let apiConfig = {
      getTodos: {
        url: '/api/todos',
        actions: ['GET_TODOS', 'GET_TODOS_COMPLETE']
      }
    };
    expect(() => {
      cfg = configureApi(store, apiConfig);
    }).not.toThrow();

    expect(cfg.getTodos.overlappingRequests).toBe(SEND_LATEST);
  });

  it('should reject invalid overlappingRequest defaults', () => {
    let apiConfig = {
      getTodos: {
        url: '/api/todos',
        actions: ['GET_TODOS', 'GET_TODOS_COMPLETE']
      }
    };
    expect(() => {
      configureApi(store, apiConfig, {overlappingRequests: 'bad'});
    }).toThrow(/Invalid overlappingRequests/);

    expect(() => {
      configureApi(store, apiConfig, {debounceWait: 'bad'});
    }).toThrow(/Invalid debounceWait option, must be a number/);

    expect(() => {
      configureApi(store, apiConfig, {debounceWait: -1});
    }).toThrow(/Invalid debounceWait option, must be non-negative/);

    expect(() => {
      configureApi(store, apiConfig, {debounceLeading: 'bad'});
    }).toThrow(/Invalid debounceLeading option, must be a boolean/);

    expect(() => {
      configureApi(store, apiConfig, {debounceTrailing: 'bad'});
    }).toThrow(/Invalid debounceTrailing option, must be a boolean/);
  });

  it('should apply default overlappingRequests to items without it specified', () => {
    let cfg;
    let apiConfig = {
      useDefault: {
        url: '/default',
        actions: ['ONE', 'TWO'],
        method: 'get'
      },
      useIgnore: {
        url: '/ignore',
        actions: ['ONE', 'TWO'],
        method: 'get',
        overlappingRequests: 'ignore'
      }
    };
    cfg = configureApi(store, apiConfig, {overlappingRequests: CANCEL_PENDING});
    expect(cfg.useDefault.overlappingRequests).toBe(CANCEL_PENDING);
    expect(cfg.useIgnore.overlappingRequests).toBe(IGNORE);
  });

  it('should apply default debounce wait to items without it specified', () => {
    let cfg;
    let apiConfig = {
      debounce1: {
        url: '/default',
        actions: ['ONE', 'TWO'],
        method: 'get',
        overlappingRequests: 'debounce',
        debounceWait: 0
      },
      debounce2: {
        url: '/ignore',
        actions: ['ONE', 'TWO'],
        method: 'get',
        overlappingRequests: 'debounce',
        debounceLeading: false,
        debounceTrailing: false
      },
      getTodos: {
        url: '/todos',
        actions: ['GET_TODOS', 'GET_TODOS_SUCCESS']
      }
    };

    cfg = configureApi(store, apiConfig, {debounceWait: 200});
    expect(cfg.debounce1.overlappingRequests).toBe(DEBOUNCE);
    expect(cfg.debounce2.overlappingRequests).toBe(DEBOUNCE);

    expect(cfg.debounce1.debounceWait).toBe(0);
    expect(cfg.debounce2.debounceWait).toBe(200);

    expect(cfg.debounce1.debounceLeading).toBe(true);
    expect(cfg.debounce1.debounceTrailing).toBe(true);
    expect(cfg.debounce2.debounceLeading).toBe(false);
    expect(cfg.debounce2.debounceTrailing).toBe(false);

    expect(cfg.getTodos.overlappingRequests).toBe(SEND_LATEST);
  });

  it('should apply default debounce lead/trailing to items without it specified', () => {
    let cfg;
    let apiConfig = {
      debounce1: {
        url: '/default',
        actions: ['ONE', 'TWO'],
        method: 'get',
        overlappingRequests: 'debounce',
        debounceWait: 0,
        debounceLeading: true,
        debounceTrailing: true
      },
      debounce2: {
        url: '/ignore',
        actions: ['ONE', 'TWO'],
        method: 'get',
        overlappingRequests: 'debounce'
      }
    };

    const defaults = {debounceWait: 200, debounceLeading: false, debounceTrailing: false};
    cfg = configureApi(store, apiConfig, defaults);
    expect(cfg.debounce1.overlappingRequests).toBe(DEBOUNCE);
    expect(cfg.debounce2.overlappingRequests).toBe(DEBOUNCE);

    expect(cfg.debounce1.debounceLeading).toBe(true);
    expect(cfg.debounce1.debounceTrailing).toBe(true);
    expect(cfg.debounce2.debounceLeading).toBe(false);
    expect(cfg.debounce2.debounceTrailing).toBe(false);
  });

  it('should not allow missing then targets', () => {
    let apiConfig = {
      one: {
        url: '/one',
        method: 'get',
        actions: ['one', 'oneSuccess'],
        then: 'two'
      },
      two: {
        url: '/two',
        method: 'get',
        actions: ['two', 'twoSuccess'],
        then: 'three'
      }
    };

    expect(() => {
      configureApi(store, apiConfig);
    }).toThrow(/Invalid then target in one, three is not defined/);
  });

  it('should not allow circular then targets', () => {
    let apiConfig = {
      one: {
        url: '/one',
        method: 'get',
        actions: ['one', 'oneSuccess'],
        then: 'two'
      },
      two: {
        url: '/two',
        method: 'get',
        actions: ['two', 'twoSuccess'],
        then: 'three'
      },
      three: {
        url: '/three',
        method: 'get',
        actions: ['three', 'threeSuccess'],
        then: 'four'
      },
      four: {
        url: '/four',
        method: 'get',
        actions: ['four', 'fourSuccess'],
        then: 'two'
      }
    };

    expect(() => {
      configureApi(store, apiConfig);
    }).toThrow(/Invalid then target, two called more than once/);
  });

  it('should allow valid then targets', () => {
    let apiConfig = {
      one: {
        url: '/one',
        method: 'get',
        actions: ['one', 'oneSuccess'],
        then: 'two'
      },
      two: {
        url: '/two',
        method: 'get',
        actions: ['two', 'twoSuccess'],
        then: 'three'
      },
      three: {
        url: '/three',
        method: 'get',
        actions: ['three', 'threeSuccess'],
        then: 'four'
      },
      four: {
        url: '/four',
        method: 'get',
        actions: ['four', 'fourSuccess']
      }
    };

    expect(() => {
      configureApi(store, apiConfig);
    }).not.toThrow();
  });
});
