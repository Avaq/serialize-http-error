'use strict';

var inDevelopment = process.env.NODE_ENV === 'development';

function stringify(x) {

  if(typeof x === 'string') {
    return x;
  }

  try {

    var str;
    var toStr = x.toString;

    if(typeof toStr === 'function') {
      str = toStr.call(x);
    } else {
      str = String(x);
    }

    if(typeof str === 'string') {
      return str;
    }

    return JSON.stringify(str);

  } catch(e) {
    return '[Unconvertable]';
  }

}

function isJsonSafe(x) {
  try{
    JSON.stringify(x);
  }catch(e) {
    return false;
  }
  return true;
}

module.exports = function serializeHttpError(err, options) {

  options = options || {};
  options.unsafe = options.unsafe === true;
  options.flat = options.flat === true;
  options.expose = typeof options.expose === 'boolean' ? options.expose : inDevelopment;
  options.defaultName = typeof options.defaultName === 'string' ? options.defaultName : 'Error';
  options.defaultMessage = typeof options.defaultMessage === 'string'
    ? options.defaultMessage
    : 'Something went wrong';

  var defaultError = {
    name: options.defaultName,
    message: options.defaultMessage
  };

  if(!err) {
    return defaultError;
  }

  if(typeof err.toJSON === 'function') {
    err = err.toJSON();
  }

  if(!err) {
    return defaultError;
  }

  var expose = (err.expose === true)
            || (typeof err.status === 'number' && err.status < 500)
            || (options.expose);

  if(!expose) {
    return defaultError;
  }

  var serialized = {};

  var k, x;
  for(k in err) {
    x = err[k];
    if(x instanceof Error) {
      serialized[k] = options.flat ? x : serializeHttpError(x, options);
    }else if(options.unsafe || isJsonSafe(x)) {
      serialized[k] = x;
    }
  }

  serialized.name = err.name ? stringify(err.name) : 'Error';
  serialized.message = err.message ? stringify(err.message) : stringify(err);

  return serialized;

};
