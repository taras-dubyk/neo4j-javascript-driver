"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _boltProtocolV = _interopRequireDefault(require("./bolt-protocol-v2"));

var _requestMessage = _interopRequireDefault(require("./request-message"));

var _boltProtocolUtil = require("./bolt-protocol-util");

var _streamObservers = require("./stream-observers");

var _constants = require("./constants");

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
var noOpObserver = new _streamObservers.StreamObserver();

var BoltProtocol =
/*#__PURE__*/
function (_BoltProtocolV) {
  (0, _inherits2["default"])(BoltProtocol, _BoltProtocolV);

  function BoltProtocol() {
    (0, _classCallCheck2["default"])(this, BoltProtocol);
    return (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(BoltProtocol).apply(this, arguments));
  }

  (0, _createClass2["default"])(BoltProtocol, [{
    key: "transformMetadata",
    value: function transformMetadata(metadata) {
      if ('t_first' in metadata) {
        // Bolt V3 uses shorter key 't_first' to represent 'result_available_after'
        // adjust the key to be the same as in Bolt V1 so that ResultSummary can retrieve the value
        metadata.result_available_after = metadata.t_first;
        delete metadata.t_first;
      }

      if ('t_last' in metadata) {
        // Bolt V3 uses shorter key 't_last' to represent 'result_consumed_after'
        // adjust the key to be the same as in Bolt V1 so that ResultSummary can retrieve the value
        metadata.result_consumed_after = metadata.t_last;
        delete metadata.t_last;
      }

      return metadata;
    }
  }, {
    key: "initialize",
    value: function initialize() {
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          userAgent = _ref.userAgent,
          authToken = _ref.authToken,
          onError = _ref.onError,
          onComplete = _ref.onComplete;

      var observer = new _streamObservers.LoginObserver({
        connection: this._connection,
        afterError: onError,
        afterComplete: onComplete
      });

      this._connection.write(_requestMessage["default"].hello(userAgent, authToken), observer, true);

      return observer;
    }
  }, {
    key: "prepareToClose",
    value: function prepareToClose() {
      this._connection.write(_requestMessage["default"].goodbye(), noOpObserver, true);
    }
  }, {
    key: "beginTransaction",
    value: function beginTransaction() {
      var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          bookmark = _ref2.bookmark,
          txConfig = _ref2.txConfig,
          database = _ref2.database,
          mode = _ref2.mode,
          beforeError = _ref2.beforeError,
          afterError = _ref2.afterError,
          beforeComplete = _ref2.beforeComplete,
          afterComplete = _ref2.afterComplete;

      var observer = new _streamObservers.ResultStreamObserver({
        connection: this._connection,
        beforeError: beforeError,
        afterError: afterError,
        beforeComplete: beforeComplete,
        afterComplete: afterComplete
      });
      observer.prepareToHandleSingleResponse(); // passing in a database name on this protocol version throws an error

      (0, _boltProtocolUtil.assertDatabaseIsEmpty)(database, this._connection, observer);

      this._connection.write(_requestMessage["default"].begin({
        bookmark: bookmark,
        txConfig: txConfig,
        mode: mode
      }), observer, true);

      return observer;
    }
  }, {
    key: "commitTransaction",
    value: function commitTransaction() {
      var _ref3 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          beforeError = _ref3.beforeError,
          afterError = _ref3.afterError,
          beforeComplete = _ref3.beforeComplete,
          afterComplete = _ref3.afterComplete;

      var observer = new _streamObservers.ResultStreamObserver({
        connection: this._connection,
        beforeError: beforeError,
        afterError: afterError,
        beforeComplete: beforeComplete,
        afterComplete: afterComplete
      });
      observer.prepareToHandleSingleResponse();

      this._connection.write(_requestMessage["default"].commit(), observer, true);

      return observer;
    }
  }, {
    key: "rollbackTransaction",
    value: function rollbackTransaction() {
      var _ref4 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          beforeError = _ref4.beforeError,
          afterError = _ref4.afterError,
          beforeComplete = _ref4.beforeComplete,
          afterComplete = _ref4.afterComplete;

      var observer = new _streamObservers.ResultStreamObserver({
        connection: this._connection,
        beforeError: beforeError,
        afterError: afterError,
        beforeComplete: beforeComplete,
        afterComplete: afterComplete
      });
      observer.prepareToHandleSingleResponse();

      this._connection.write(_requestMessage["default"].rollback(), observer, true);

      return observer;
    }
  }, {
    key: "run",
    value: function run(query, parameters) {
      var _ref5 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
          bookmark = _ref5.bookmark,
          txConfig = _ref5.txConfig,
          database = _ref5.database,
          mode = _ref5.mode,
          beforeKeys = _ref5.beforeKeys,
          afterKeys = _ref5.afterKeys,
          beforeError = _ref5.beforeError,
          afterError = _ref5.afterError,
          beforeComplete = _ref5.beforeComplete,
          afterComplete = _ref5.afterComplete,
          _ref5$flush = _ref5.flush,
          flush = _ref5$flush === void 0 ? true : _ref5$flush;

      var observer = new _streamObservers.ResultStreamObserver({
        connection: this._connection,
        beforeKeys: beforeKeys,
        afterKeys: afterKeys,
        beforeError: beforeError,
        afterError: afterError,
        beforeComplete: beforeComplete,
        afterComplete: afterComplete
      }); // passing in a database name on this protocol version throws an error

      (0, _boltProtocolUtil.assertDatabaseIsEmpty)(database, this._connection, observer);

      this._connection.write(_requestMessage["default"].runWithMetadata(query, parameters, {
        bookmark: bookmark,
        txConfig: txConfig,
        mode: mode
      }), observer, false);

      this._connection.write(_requestMessage["default"].pullAll(), observer, flush);

      return observer;
    }
  }, {
    key: "version",
    get: function get() {
      return _constants.BOLT_PROTOCOL_V3;
    }
  }]);
  return BoltProtocol;
}(_boltProtocolV["default"]);

exports["default"] = BoltProtocol;