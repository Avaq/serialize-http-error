'use strict';

var C = require('jsverify');
var expect = require('chai').expect;
var serialize = require('..');

function assertSerialized(x) {
  expect(x).to.be.an('object');
  expect(x).to.have.property('name');
  expect(x.name).to.be.a('string');
  expect(x.message).to.be.a('string');
}

var error = new Error('Kaputt');

var naughty = C.oneof([
  {toString: NaN},
  {toString: function() { return this; }},
  {toString: function() { throw error; }},
  Object.create(null),
  (function() {
    var rec = {};
    rec.rec = rec;
    rec.toString = function() { return this; };
    return rec;
  }()),
  (function() {
    var o = {};
    Object.defineProperty(o, 'toString', {
      get: function() { throw error; }
    });
    return o;
  }())
].map(C.constant));

var any = C.letrec(function(tie) {
  return {
    errorLike: C.record({
      name: tie('any'),
      message: tie('any'),
      expose: tie('any'),
      status: tie('any'),
      toJSON: tie('any')
    }),
    any: C.oneof(
      naughty,
      C.number,
      C.string,
      C.bool,
      C.datetime,
      C.falsy,
      C.constant(error),
      C.fn(tie('any')),
      tie('errorLike')
    )
  };
}).any;

describe('serializeHttpError', function() {

  this.timeout(20000);

  it('is a binary function', function() {
    expect(serialize).to.be.a('function');
    expect(serialize.length).to.equal(2);
  });

  it('uses default options', function() {
    assertSerialized(serialize(new Error));
  });

  it('uses toJSON', function() {
    var actual = serialize({toJSON: function() { return {foo: 'bar'}; }}, {expose: true});
    assertSerialized(actual);
    expect(actual).to.have.property('foo', 'bar');
  });

  it('works with any input', function() {
    C.check(C.forall(any, any, any, any, any, any, function(x, a, b, c, d, e) {
      var out = serialize(x, {unsafe: a, flat: b, expose: c, defaultName: d, defaultMessage: e});
      assertSerialized(out);
      return true;
    }), {tests: 10000, size: 100, quiet: true});
  });

  it('copies enumerable properties', function() {
    var actual = serialize({a: 1, b: 2, c: 3}, {expose: true});
    assertSerialized(actual);
    expect(actual).to.have.property('a', 1);
    expect(actual).to.have.property('b', 2);
    expect(actual).to.have.property('c', 3);
  });

  it('ignores recursive properties', function() {
    var rec = {};
    rec.rec = rec;
    var actual = serialize(rec, {expose: true});
    assertSerialized(actual);
    expect(actual).to.not.have.property('rec');
  });

  it('keeps recursive properties if unsafe', function() {
    var rec = {};
    rec.rec = rec;
    var actual = serialize(rec, {expose: true, unsafe: true});
    assertSerialized(actual);
    expect(actual).to.have.property('rec');
  });

  it('serializes nested errors', function() {
    var actual = serialize({err: error}, {expose: true});
    assertSerialized(actual);
    expect(actual).to.have.property('err');
    expect(actual.err).to.not.equal(error);
    expect(actual.err).to.deep.equal({name: 'Error', message: 'Kaputt'});
  });

  it('keeps nested errors if flat', function() {
    var actual = serialize({err: error}, {expose: true, flat: true});
    assertSerialized(actual);
    expect(actual).to.have.property('err');
    expect(actual.err).to.equal(error);
  });

});
