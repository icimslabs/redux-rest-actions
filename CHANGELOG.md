# Change log

## [1.1.7] - 2023-09-07

- Merged dependabot pull requests
- Explicitely use lodash debounce

## [1.1.6] - 2019-12-26

Applied all git auto generated pull requests:

- Merged all Git auto generated pull requests, merge# 19 - 32.
- Removed browser entry from package.json so Webpack does not default to using the UMD bundle (which isn't tree shakable) instead of the ESM bundle

## [1.1.5] - 2019-12-26

Applied all git auto generated pull requests:

- Bump xios 0.19 to 0.21.1
- Bump ini from 1.3.5 to 1.3.8
- Bump http-proxy from 1.18.0 to 1.18.1
- Bump handlebars from 4.4.3 to 4.7.6
- Bump tree-kill from 1.2.1 to 1.2.2
- Bump elliptic from 6.5.1 to 6.5.3
- Bump lodash from 4.17.15 to 4.17.19
- Bump websocket-extensions from 0.1.3 to 0.1.4
- Bump acorn from 5.7.3 to 5.7.4

Fix for failure to substitute multiple URL params: https://github.com/icimslabs/redux-rest-actions/issues/8

## [1.1.4] - 2019-12-26

Fixed bug where `overlappingRequests` set to `sendLatest` failed to clear the earlier request, resulting in requests after the first change not to be sent.

## [1.1.3] - 2019-12-12

Related to 1.1.2, also removed babel/plugin-transform-runtime.

## [1.1.2] - 2019-12-12

Added corejs version 3 to `.babelrc`. This fixed error `Can't resolve 'core-js/modules/es6.array.iterator'` occurring in apps generated with the latest `create-react-app` version.

## [1.1.1] - 2019-12-04

Removed non-serializable properties from axios config in response payload. These cause console warnings when using reduxjs/toolkit in development.

## [1.1.0] - 2019-11-12

Added feature to support a `then` option in the API config to allow for chaining of requests.

## [1.0.0] - 2019-10-21

Initial release.
