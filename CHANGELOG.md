# Change log

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
