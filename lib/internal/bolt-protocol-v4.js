"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

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

var _boltProtocolV = _interopRequireDefault(require("./bolt-protocol-v3"));

var _requestMessage = _interopRequireWildcard(require("./request-message"));

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
var BoltProtocol =
/*#__PURE__*/
function (_BoltProtocolV) {
  (0, _inherits2["default"])(BoltProtocol, _BoltProtocolV);

  function BoltProtocol() {
    (0, _classCallCheck2["default"])(this, BoltProtocol);
    return (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(BoltProtocol).apply(this, arguments));
  }

  (0, _createClass2["default"])(BoltProtocol, [{
    key: "beginTransaction",
    value: function beginTransaction() {
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          bookmark = _ref.bookmark,
          txConfig = _ref.txConfig,
          database = _ref.database,
          mode = _ref.mode,
          beforeError = _ref.beforeError,
          afterError = _ref.afterError,
          beforeComplete = _ref.beforeComplete,
          afterComplete = _ref.afterComplete;

      var observer = new _streamObservers.ResultStreamObserver({
        connection: this._connection,
        beforeError: beforeError,
        afterError: afterError,
        beforeComplete: beforeComplete,
        afterComplete: afterComplete
      });
      observer.prepareToHandleSingleResponse();

      this._connection.write(_requestMessage["default"].begin({
        bookmark: bookmark,
        txConfig: txConfig,
        database: database,
        mode: mode
      }), observer, true);

      return observer;
    }
  }, {
    key: "run",
    value: function run(query, parameters) {
      var _ref2 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
          bookmark = _ref2.bookmark,
          txConfig = _ref2.txConfig,
          database = _ref2.database,
          mode = _ref2.mode,
          beforeKeys = _ref2.beforeKeys,
          afterKeys = _ref2.afterKeys,
          beforeError = _ref2.beforeError,
          afterError = _ref2.afterError,
          beforeComplete = _ref2.beforeComplete,
          afterComplete = _ref2.afterComplete,
          _ref2$flush = _ref2.flush,
          flush = _ref2$flush === void 0 ? true : _ref2$flush,
          _ref2$reactive = _ref2.reactive,
          reactive = _ref2$reactive === void 0 ? false : _ref2$reactive,
          _ref2$fetchSize = _ref2.fetchSize,
          fetchSize = _ref2$fetchSize === void 0 ? _requestMessage.ALL : _ref2$fetchSize;

      var observer = new _streamObservers.ResultStreamObserver({
        connection: this._connection,
        reactive: reactive,
        fetchSize: fetchSize,
        moreFunction: this._requestMore,
        discardFunction: this._requestDiscard,
        beforeKeys: beforeKeys,
        afterKeys: afterKeys,
        beforeError: beforeError,
        afterError: afterError,
        beforeComplete: beforeComplete,
        afterComplete: afterComplete
      });
      var flushRun = reactive;

      this._connection.write(_requestMessage["default"].runWithMetadata(query, parameters, {
        bookmark: bookmark,
        txConfig: txConfig,
        database: database,
        mode: mode
      }), observer, flushRun && flush);

      if (!reactive) {
        this._connection.write(_requestMessage["default"].pull({
          n: fetchSize
        }), observer, flush);
      }

      return observer;
    }
  }, {
    key: "_requestMore",
    value: function _requestMore(connection, stmtId, n, observer) {
      connection.write(_requestMessage["default"].pull({
        stmtId: stmtId,
        n: n
      }), observer, true);
    }
  }, {
    key: "_requestDiscard",
    value: function _requestDiscard(connection, stmtId, observer) {
      connection.write(_requestMessage["default"].discard({
        stmtId: stmtId
      }), observer, true);
    }
  }, {
    key: "_noOp",
    value: function _noOp() {}
  }, {
    key: "version",
    get: function get() {
      return _constants.BOLT_PROTOCOL_V4;
    }
  }]);
  return BoltProtocol;
}(_boltProtocolV["default"]);

exports["default"] = BoltProtocol;