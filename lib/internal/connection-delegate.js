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

var _connection = _interopRequireDefault(require("./connection"));

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
var DelegateConnection =
/*#__PURE__*/
function (_Connection) {
  (0, _inherits2["default"])(DelegateConnection, _Connection);

  /**
   * @param delegate {Connection} the delegated connection
   * @param errorHandler {ConnectionErrorHandler} the error handler
   */
  function DelegateConnection(delegate, errorHandler) {
    var _this;

    (0, _classCallCheck2["default"])(this, DelegateConnection);
    _this = (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(DelegateConnection).call(this, errorHandler));

    if (errorHandler) {
      _this._originalErrorHandler = delegate._errorHandler;
      delegate._errorHandler = _this._errorHandler;
    }

    _this._delegate = delegate;
    return _this;
  }

  (0, _createClass2["default"])(DelegateConnection, [{
    key: "isOpen",
    value: function isOpen() {
      return this._delegate.isOpen();
    }
  }, {
    key: "protocol",
    value: function protocol() {
      return this._delegate.protocol();
    }
  }, {
    key: "connect",
    value: function connect(userAgent, authToken) {
      return this._delegate.connect(userAgent, authToken);
    }
  }, {
    key: "write",
    value: function write(message, observer, flush) {
      return this._delegate.write(message, observer, flush);
    }
  }, {
    key: "resetAndFlush",
    value: function resetAndFlush() {
      return this._delegate.resetAndFlush();
    }
  }, {
    key: "close",
    value: function close() {
      return this._delegate.close();
    }
  }, {
    key: "_release",
    value: function _release() {
      if (this._originalErrorHandler) {
        this._delegate._errorHandler = this._originalErrorHandler;
      }

      return this._delegate._release();
    }
  }, {
    key: "id",
    get: function get() {
      return this._delegate.id;
    }
  }, {
    key: "databaseId",
    get: function get() {
      return this._delegate.databaseId;
    },
    set: function set(value) {
      this._delegate.databaseId = value;
    }
  }, {
    key: "server",
    get: function get() {
      return this._delegate.server;
    }
  }, {
    key: "address",
    get: function get() {
      return this._delegate.address;
    }
  }, {
    key: "version",
    get: function get() {
      return this._delegate.version;
    },
    set: function set(value) {
      this._delegate.version = value;
    }
  }]);
  return DelegateConnection;
}(_connection["default"]);

exports["default"] = DelegateConnection;