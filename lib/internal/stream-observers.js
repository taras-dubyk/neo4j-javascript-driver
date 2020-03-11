"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CompletedObserver = exports.FailedObserver = exports.ResetObserver = exports.LoginObserver = exports.ResultStreamObserver = exports.StreamObserver = void 0;

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _get2 = _interopRequireDefault(require("@babel/runtime/helpers/get"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _record = _interopRequireDefault(require("../record"));

var _connection = _interopRequireDefault(require("./connection"));

var _error = require("../error");

var _integer = _interopRequireDefault(require("../integer"));

var _requestMessage = require("./request-message");

/**
 * Copyright (c) 2002-2019 "Neo4j,"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var StreamObserver =
/*#__PURE__*/
function () {
  function StreamObserver() {
    (0, _classCallCheck2["default"])(this, StreamObserver);
  }

  (0, _createClass2["default"])(StreamObserver, [{
    key: "onNext",
    value: function onNext(rawRecord) {}
  }, {
    key: "onError",
    value: function onError(error) {}
  }, {
    key: "onCompleted",
    value: function onCompleted(meta) {}
  }]);
  return StreamObserver;
}();
/**
 * Handles a RUN/PULL_ALL, or RUN/DISCARD_ALL requests, maps the responses
 * in a way that a user-provided observer can see these as a clean Stream
 * of records.
 * This class will queue up incoming messages until a user-provided observer
 * for the incoming stream is registered. Thus, we keep fields around
 * for tracking head/records/tail. These are only used if there is no
 * observer registered.
 * @access private
 */


exports.StreamObserver = StreamObserver;

var ResultStreamObserver =
/*#__PURE__*/
function (_StreamObserver) {
  (0, _inherits2["default"])(ResultStreamObserver, _StreamObserver);

  /**
   *
   * @param {Object} param
   * @param {Connection} param.connection
   * @param {boolean} param.reactive
   * @param {function(connection: Connection, stmtId: number|Integer, n: number|Integer, observer: StreamObserver)} param.moreFunction -
   * @param {function(connection: Connection, stmtId: number|Integer, observer: StreamObserver)} param.discardFunction -
   * @param {number|Integer} param.fetchSize -
   * @param {function(err: Error): Promise|void} param.beforeError -
   * @param {function(err: Error): Promise|void} param.afterError -
   * @param {function(keys: string[]): Promise|void} param.beforeKeys -
   * @param {function(keys: string[]): Promise|void} param.afterKeys -
   * @param {function(metadata: Object): Promise|void} param.beforeComplete -
   * @param {function(metadata: Object): Promise|void} param.afterComplete -
   */
  function ResultStreamObserver() {
    var _this;

    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        connection = _ref.connection,
        _ref$reactive = _ref.reactive,
        reactive = _ref$reactive === void 0 ? false : _ref$reactive,
        moreFunction = _ref.moreFunction,
        discardFunction = _ref.discardFunction,
        _ref$fetchSize = _ref.fetchSize,
        fetchSize = _ref$fetchSize === void 0 ? _requestMessage.ALL : _ref$fetchSize,
        beforeError = _ref.beforeError,
        afterError = _ref.afterError,
        beforeKeys = _ref.beforeKeys,
        afterKeys = _ref.afterKeys,
        beforeComplete = _ref.beforeComplete,
        afterComplete = _ref.afterComplete;

    (0, _classCallCheck2["default"])(this, ResultStreamObserver);
    _this = (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(ResultStreamObserver).call(this));
    _this._connection = connection;
    _this._reactive = reactive;
    _this._streaming = false;
    _this._fieldKeys = null;
    _this._fieldLookup = null;
    _this._head = null;
    _this._queuedRecords = [];
    _this._tail = null;
    _this._error = null;
    _this._hasFailed = false;
    _this._observers = [];
    _this._meta = {};
    _this._beforeError = beforeError;
    _this._afterError = afterError;
    _this._beforeKeys = beforeKeys;
    _this._afterKeys = afterKeys;
    _this._beforeComplete = beforeComplete;
    _this._afterComplete = afterComplete;
    _this._queryId = null;
    _this._moreFunction = moreFunction;
    _this._discardFunction = discardFunction;
    _this._discard = false;
    _this._fetchSize = fetchSize;
    _this._finished = false;
    return _this;
  }
  /**
   * Will be called on every record that comes in and transform a raw record
   * to a Object. If user-provided observer is present, pass transformed record
   * to it's onNext method, otherwise, push to record que.
   * @param {Array} rawRecord - An array with the raw record
   */


  (0, _createClass2["default"])(ResultStreamObserver, [{
    key: "onNext",
    value: function onNext(rawRecord) {
      var record = new _record["default"](this._fieldKeys, rawRecord, this._fieldLookup);

      if (this._observers.some(function (o) {
        return o.onNext;
      })) {
        this._observers.forEach(function (o) {
          if (o.onNext) {
            o.onNext(record);
          }
        });
      } else {
        this._queuedRecords.push(record);
      }
    }
  }, {
    key: "onCompleted",
    value: function onCompleted(meta) {
      var _this2 = this;

      if (this._fieldKeys === null) {
        // Stream header, build a name->index field lookup table
        // to be used by records. This is an optimization to make it
        // faster to look up fields in a record by name, rather than by index.
        // Since the records we get back via Bolt are just arrays of values.
        this._fieldKeys = [];
        this._fieldLookup = {};

        if (meta.fields && meta.fields.length > 0) {
          this._fieldKeys = meta.fields;

          for (var i = 0; i < meta.fields.length; i++) {
            this._fieldLookup[meta.fields[i]] = i;
          } // remove fields key from metadata object


          delete meta.fields;
        } // Extract server generated query id for use in requestMore and discard
        // functions


        if (meta.qid) {
          this._queryId = meta.qid; // remove qid from metadata object

          delete meta.qid;
        }

        this._storeMetadataForCompletion(meta);

        var beforeHandlerResult = null;

        if (this._beforeKeys) {
          beforeHandlerResult = this._beforeKeys(this._fieldKeys);
        }

        var continuation = function continuation() {
          _this2._head = _this2._fieldKeys;

          if (_this2._observers.some(function (o) {
            return o.onKeys;
          })) {
            _this2._observers.forEach(function (o) {
              if (o.onKeys) {
                o.onKeys(_this2._fieldKeys);
              }
            });
          }

          if (_this2._afterKeys) {
            _this2._afterKeys(_this2._fieldKeys);
          }

          if (_this2._reactive) {
            _this2._handleStreaming();
          }
        };

        if (beforeHandlerResult) {
          Promise.resolve(beforeHandlerResult).then(function () {
            return continuation();
          });
        } else {
          continuation();
        }
      } else {
        this._streaming = false;

        if (meta.has_more) {
          // We've consumed current batch and server notified us that there're more
          // records to stream. Let's invoke more or discard function based on whether
          // the user wants to discard streaming or not
          this._handleStreaming();

          delete meta.has_more;
        } else {
          this._finished = true;
          var completionMetadata = Object.assign(this._connection ? {
            server: this._connection.server
          } : {}, this._meta, meta);
          var _beforeHandlerResult = null;

          if (this._beforeComplete) {
            _beforeHandlerResult = this._beforeComplete(completionMetadata);
          }

          var _continuation = function _continuation() {
            // End of stream
            _this2._tail = completionMetadata;

            if (_this2._observers.some(function (o) {
              return o.onCompleted;
            })) {
              _this2._observers.forEach(function (o) {
                if (o.onCompleted) {
                  o.onCompleted(completionMetadata);
                }
              });
            }

            if (_this2._afterComplete) {
              _this2._afterComplete(completionMetadata);
            }
          };

          if (_beforeHandlerResult) {
            Promise.resolve(_beforeHandlerResult).then(function () {
              return _continuation();
            });
          } else {
            _continuation();
          }
        }
      }
    }
  }, {
    key: "_handleStreaming",
    value: function _handleStreaming() {
      if (this._head && this._observers.some(function (o) {
        return o.onNext || o.onCompleted;
      }) && !this._streaming) {
        this._streaming = true;

        if (this._discard) {
          this._discardFunction(this._connection, this._queryId, this);
        } else {
          this._moreFunction(this._connection, this._queryId, this._fetchSize, this);
        }
      }
    }
  }, {
    key: "_storeMetadataForCompletion",
    value: function _storeMetadataForCompletion(meta) {
      var keys = Object.keys(meta);
      var index = keys.length;
      var key = '';

      while (index--) {
        key = keys[index];
        this._meta[key] = meta[key];
      }
    }
    /**
     * Stream observer defaults to handling responses for two messages: RUN + PULL_ALL or RUN + DISCARD_ALL.
     * Response for RUN initializes query keys. Response for PULL_ALL / DISCARD_ALL exposes the result stream.
     *
     * However, some operations can be represented as a single message which receives full metadata in a single response.
     * For example, operations to begin, commit and rollback an explicit transaction use two messages in Bolt V1 but a single message in Bolt V3.
     * Messages are `RUN "BEGIN" {}` + `PULL_ALL` in Bolt V1 and `BEGIN` in Bolt V3.
     *
     * This function prepares the observer to only handle a single response message.
     */

  }, {
    key: "prepareToHandleSingleResponse",
    value: function prepareToHandleSingleResponse() {
      this._head = [];
      this._fieldKeys = [];
    }
    /**
     * Mark this observer as if it has completed with no metadata.
     */

  }, {
    key: "markCompleted",
    value: function markCompleted() {
      this._head = [];
      this._fieldKeys = [];
      this._tail = {};
      this._finished = true;
    }
    /**
     * Cancel pending record stream
     */

  }, {
    key: "cancel",
    value: function cancel() {
      this._discard = true;
    }
    /**
     * Will be called on errors.
     * If user-provided observer is present, pass the error
     * to it's onError method, otherwise set instance variable _error.
     * @param {Object} error - An error object
     */

  }, {
    key: "onError",
    value: function onError(error) {
      var _this3 = this;

      if (this._hasFailed) {
        return;
      }

      this._finished = true;
      this._hasFailed = true;
      this._error = error;
      var beforeHandlerResult = null;

      if (this._beforeError) {
        beforeHandlerResult = this._beforeError(error);
      }

      var continuation = function continuation() {
        if (_this3._observers.some(function (o) {
          return o.onError;
        })) {
          _this3._observers.forEach(function (o) {
            if (o.onError) {
              o.onError(error);
            }
          });
        }

        if (_this3._afterError) {
          _this3._afterError(error);
        }
      };

      if (beforeHandlerResult) {
        Promise.resolve(beforeHandlerResult).then(function () {
          return continuation();
        });
      } else {
        continuation();
      }
    }
    /**
     * Subscribe to events with provided observer.
     * @param {Object} observer - Observer object
     * @param {function(keys: String[])} observer.onKeys - Handle stream header, field keys.
     * @param {function(record: Object)} observer.onNext - Handle records, one by one.
     * @param {function(metadata: Object)} observer.onCompleted - Handle stream tail, the metadata.
     * @param {function(error: Object)} observer.onError - Handle errors, should always be provided.
     */

  }, {
    key: "subscribe",
    value: function subscribe(observer) {
      if (this._error) {
        observer.onError(this._error);
        return;
      }

      if (this._head && observer.onKeys) {
        observer.onKeys(this._head);
      }

      if (this._queuedRecords.length > 0 && observer.onNext) {
        for (var i = 0; i < this._queuedRecords.length; i++) {
          observer.onNext(this._queuedRecords[i]);
        }
      }

      if (this._tail && observer.onCompleted) {
        observer.onCompleted(this._tail);
      }

      this._observers.push(observer);

      if (this._reactive && !this._finished) {
        this._handleStreaming();
      }
    }
  }, {
    key: "hasFailed",
    value: function hasFailed() {
      return this._hasFailed;
    }
  }]);
  return ResultStreamObserver;
}(StreamObserver);

exports.ResultStreamObserver = ResultStreamObserver;

var LoginObserver =
/*#__PURE__*/
function (_StreamObserver2) {
  (0, _inherits2["default"])(LoginObserver, _StreamObserver2);

  /**
   *
   * @param {Object} param -
   * @param {Connection} param.connection
   * @param {function(err: Error)} param.beforeError
   * @param {function(err: Error)} param.afterError
   * @param {function(metadata)} param.beforeComplete
   * @param {function(metadata)} param.afterComplete
   */
  function LoginObserver() {
    var _this4;

    var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        connection = _ref2.connection,
        beforeError = _ref2.beforeError,
        afterError = _ref2.afterError,
        beforeComplete = _ref2.beforeComplete,
        afterComplete = _ref2.afterComplete;

    (0, _classCallCheck2["default"])(this, LoginObserver);
    _this4 = (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(LoginObserver).call(this));
    _this4._connection = connection;
    _this4._beforeError = beforeError;
    _this4._afterError = afterError;
    _this4._beforeComplete = beforeComplete;
    _this4._afterComplete = afterComplete;
    return _this4;
  }

  (0, _createClass2["default"])(LoginObserver, [{
    key: "onNext",
    value: function onNext(record) {
      this.onError((0, _error.newError)('Received RECORD when initializing ' + JSON.stringify(record)));
    }
  }, {
    key: "onError",
    value: function onError(error) {
      if (this._beforeError) {
        this._beforeError(error);
      }

      this._connection._updateCurrentObserver(); // make sure this exact observer will not be called again


      this._connection._handleFatalError(error); // initialization errors are fatal


      if (this._afterError) {
        this._afterError(error);
      }
    }
  }, {
    key: "onCompleted",
    value: function onCompleted(metadata) {
      if (this._beforeComplete) {
        this._beforeComplete(metadata);
      }

      if (metadata) {
        // read server version from the response metadata, if it is available
        var serverVersion = metadata.server;

        if (!this._connection.version) {
          this._connection.version = serverVersion;
        } // read database connection id from the response metadata, if it is available


        var dbConnectionId = metadata.connection_id;

        if (!this._connection.databaseId) {
          this._connection.databaseId = dbConnectionId;
        }
      }

      if (this._afterComplete) {
        this._afterComplete(metadata);
      }
    }
  }]);
  return LoginObserver;
}(StreamObserver);

exports.LoginObserver = LoginObserver;

var ResetObserver =
/*#__PURE__*/
function (_StreamObserver3) {
  (0, _inherits2["default"])(ResetObserver, _StreamObserver3);

  /**
   *
   * @param {Object} param -
   * @param {Connection} param.connection
   * @param {function(err: Error)} param.onError
   * @param {function(metadata)} param.onComplete
   */
  function ResetObserver() {
    var _this5;

    var _ref3 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        connection = _ref3.connection,
        onError = _ref3.onError,
        onComplete = _ref3.onComplete;

    (0, _classCallCheck2["default"])(this, ResetObserver);
    _this5 = (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(ResetObserver).call(this));
    _this5._connection = connection;
    _this5._onError = onError;
    _this5._onComplete = onComplete;
    return _this5;
  }

  (0, _createClass2["default"])(ResetObserver, [{
    key: "onNext",
    value: function onNext(record) {
      this.onError((0, _error.newError)('Received RECORD when resetting: received record is: ' + JSON.stringify(record), _error.PROTOCOL_ERROR));
    }
  }, {
    key: "onError",
    value: function onError(error) {
      if (error.code === _error.PROTOCOL_ERROR) {
        this._connection._handleProtocolError(error.message);
      }

      if (this._onError) {
        this._onError(error);
      }
    }
  }, {
    key: "onCompleted",
    value: function onCompleted(metadata) {
      if (this._onComplete) {
        this._onComplete(metadata);
      }
    }
  }]);
  return ResetObserver;
}(StreamObserver);

exports.ResetObserver = ResetObserver;

var FailedObserver =
/*#__PURE__*/
function (_ResultStreamObserver) {
  (0, _inherits2["default"])(FailedObserver, _ResultStreamObserver);

  function FailedObserver(_ref4) {
    var _this6;

    var error = _ref4.error,
        onError = _ref4.onError;
    (0, _classCallCheck2["default"])(this, FailedObserver);
    _this6 = (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(FailedObserver).call(this, {
      beforeError: onError
    }));

    _this6.onError(error);

    return _this6;
  }

  return FailedObserver;
}(ResultStreamObserver);

exports.FailedObserver = FailedObserver;

var CompletedObserver =
/*#__PURE__*/
function (_ResultStreamObserver2) {
  (0, _inherits2["default"])(CompletedObserver, _ResultStreamObserver2);

  function CompletedObserver() {
    var _this7;

    (0, _classCallCheck2["default"])(this, CompletedObserver);
    _this7 = (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(CompletedObserver).call(this));
    (0, _get2["default"])((0, _getPrototypeOf2["default"])(CompletedObserver.prototype), "markCompleted", (0, _assertThisInitialized2["default"])(_this7)).call((0, _assertThisInitialized2["default"])(_this7));
    return _this7;
  }

  return CompletedObserver;
}(ResultStreamObserver);

exports.CompletedObserver = CompletedObserver;