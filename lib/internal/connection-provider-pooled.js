"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _connectionChannel = _interopRequireDefault(require("./connection-channel"));

var _pool = _interopRequireDefault(require("./pool"));

var _poolConfig = _interopRequireDefault(require("./pool-config"));

var _connectionErrorHandler = _interopRequireDefault(require("./connection-error-handler"));

var _error = require("../error");

var _connectionProvider = _interopRequireDefault(require("./connection-provider"));

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
var PooledConnectionProvider =
/*#__PURE__*/
function (_ConnectionProvider) {
  (0, _inherits2["default"])(PooledConnectionProvider, _ConnectionProvider);

  function PooledConnectionProvider(_ref) {
    var _this;

    var id = _ref.id,
        config = _ref.config,
        log = _ref.log,
        userAgent = _ref.userAgent,
        authToken = _ref.authToken;
    (0, _classCallCheck2["default"])(this, PooledConnectionProvider);
    _this = (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(PooledConnectionProvider).call(this));
    _this._id = id;
    _this._config = config;
    _this._log = log;
    _this._userAgent = userAgent;
    _this._authToken = authToken;
    _this._connectionPool = new _pool["default"]({
      create: _this._createConnection.bind((0, _assertThisInitialized2["default"])(_this)),
      destroy: _this._destroyConnection.bind((0, _assertThisInitialized2["default"])(_this)),
      validate: _this._validateConnection.bind((0, _assertThisInitialized2["default"])(_this)),
      installIdleObserver: PooledConnectionProvider._installIdleObserverOnConnection.bind((0, _assertThisInitialized2["default"])(_this)),
      removeIdleObserver: PooledConnectionProvider._removeIdleObserverOnConnection.bind((0, _assertThisInitialized2["default"])(_this)),
      config: _poolConfig["default"].fromDriverConfig(config),
      log: _this._log
    });
    _this._openConnections = {};
    return _this;
  }

  (0, _createClass2["default"])(PooledConnectionProvider, [{
    key: "_createConnectionErrorHandler",
    value: function _createConnectionErrorHandler() {
      return new _connectionErrorHandler["default"](_error.SERVICE_UNAVAILABLE);
    }
    /**
     * Create a new connection and initialize it.
     * @return {Promise<Connection>} promise resolved with a new connection or rejected when failed to connect.
     * @access private
     */

  }, {
    key: "_createConnection",
    value: function _createConnection(address, release) {
      var _this2 = this;

      var connection = _connectionChannel["default"].create(address, this._config, this._createConnectionErrorHandler(), this._log);

      connection._release = function () {
        return release(address, connection);
      };

      this._openConnections[connection.id] = connection;
      return connection.connect(this._userAgent, this._authToken)["catch"](function (error) {
        // let's destroy this connection
        _this2._destroyConnection(connection); // propagate the error because connection failed to connect / initialize


        throw error;
      });
    }
    /**
     * Check that a connection is usable
     * @return {boolean} true if the connection is open
     * @access private
     **/

  }, {
    key: "_validateConnection",
    value: function _validateConnection(conn) {
      if (!conn.isOpen()) {
        return false;
      }

      var maxConnectionLifetime = this._config.maxConnectionLifetime;
      var lifetime = Date.now() - conn.creationTimestamp;
      return lifetime <= maxConnectionLifetime;
    }
    /**
     * Dispose of a connection.
     * @return {Connection} the connection to dispose.
     * @access private
     */

  }, {
    key: "_destroyConnection",
    value: function _destroyConnection(conn) {
      delete this._openConnections[conn.id];
      return conn.close();
    }
  }, {
    key: "close",
    value: function () {
      var _close = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee() {
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this._connectionPool.close();

              case 2:
                _context.next = 4;
                return Promise.all(Object.values(this._openConnections).map(function (c) {
                  return c.close();
                }));

              case 4:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function close() {
        return _close.apply(this, arguments);
      }

      return close;
    }()
  }], [{
    key: "_installIdleObserverOnConnection",
    value: function _installIdleObserverOnConnection(conn, observer) {
      conn._queueObserver(observer);
    }
  }, {
    key: "_removeIdleObserverOnConnection",
    value: function _removeIdleObserverOnConnection(conn) {
      conn._updateCurrentObserver();
    }
  }]);
  return PooledConnectionProvider;
}(_connectionProvider["default"]);

exports["default"] = PooledConnectionProvider;