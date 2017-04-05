# Serialize HTTP Error

[![NPM Version](https://badge.fury.io/js/serialize-http-error.svg)](https://www.npmjs.com/package/serialize-http-error)
[![Build Status](https://travis-ci.org/Avaq/serialize-http-error.svg?branch=master)](https://travis-ci.org/Avaq/serialize-http-error)
[![Code Coverage](https://codecov.io/gh/Avaq/serialize-http-error/branch/master/graph/badge.svg)](https://codecov.io/gh/Avaq/serialize-http-error)

Serializes any input (preferrably an Error) to a plain old JavaScript Object
which has the following guarantees:

1. The error will be exposed if:

    - The `NODE_ENV` is `"development"`, or;
    - The [`expose`](#expose) option is `true`, or;
    - the `expose` property is `true`, or;
    - the `status` property contains a number less than `500`.

2. Has at least a `name` property and a `message` property, both *always* Strings.
   They default to `"Error"` and `"Something went wrong"`

3. Other enumerable properties are copied under the following conditions:

    - The error is exposed, and;
    - the property is safe for `JSON.stringify` (unless [`unsafe`](#unsafe)).

## Usage

```js
const serializeHttpError = require('serialize-http-error');
const app = require('express')();

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json(serializeHttpError(err));
});
```

## Options

The second argument to `serializeHttpError` may be an object with options, eg:

```js
serializeHttpError(err, {
  unsafe: true,
  flat: true,
  expose: false
});
```

### `unsafe`

> `false`

If set to `true`, all enumerable properties, even recursive ones, will be
copied. This allows for customized resolution of these properties, for example
by using the `replacer` argument in `JSON.stringify`.

### `flat`

> `false`

By default, nested Error objects are also serialized. If set to `true`, they
will be left intact.

### `expose`

> `process.NODE_ENV === 'development'`

If set to `true`, *all* errors will be exposed. If set to false, only exposable
errors are exposed.

### `defaultName`

> `'Error'`

The default name to use for values which don't have a name, or errors which
may not be exposed.

### `defaultMessage`

> `'Something went wrong'`

The default message to use for values which don't have a message, or errors
which may not be exposed.
