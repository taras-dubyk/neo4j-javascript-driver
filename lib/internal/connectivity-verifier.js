"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _connectionHolder = _interopRequireDefault(require("./connection-holder"));

var _driver = require("../driver");

var _streamObservers = require("./stream-observers");

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

/**
 * Verifies connectivity using the given connection provider.
 */
var ConnectivityVerifier =
/*#__PURE__*/
function () {
  /**
   * @constructor
   * @param {ConnectionProvider} connectionProvider the provider to obtain connections from.
   */
  function ConnectivityVerifier(connectionProvider) {
    (0, _classCallCheck2["default"])(this, ConnectivityVerifier);
    this._connectionProvider = connectionProvider;
  }
  /**
   * Try to obtain a working connection from the connection provider.
   * @returns {Promise<object>} promise resolved with server info or rejected with error.
   */


  (0, _createClass2["default"])(ConnectivityVerifier, [{
    key: "verify",
    value: function verify() {
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          _ref$database = _ref.database,
          database = _ref$database === void 0 ? '' : _ref$database;

      return acquireAndReleaseDummyConnection(this._connectionProvider, database);
    }
  }]);
  return ConnectivityVerifier;
}();
/**
 * @private
 * @param {ConnectionProvider} connectionProvider the provider to obtain connections from.
 * @return {Promise<object>} promise resolved with server info or rejected with error.
 */


exports["default"] = ConnectivityVerifier;

function acquireAndReleaseDummyConnection(connectionProvider, database) {
  var connectionHolder = new _connectionHolder["default"]({
    mode: _driver.READ,
    database: database,
    connectionProvider: connectionProvider
  });
  connectionHolder.initializeConnection();
  return connectionHolder.getConnection().then(function (connection) {
    // able to establish a connection
    return connectionHolder.close().then(function () {
      return connection.server;
    });
  })["catch"](function (error) {
    // failed to establish a connection
    return connectionHolder.close()["catch"](function (ignoredError) {// ignore connection release error
    }).then(function () {
      return Promise.reject(error);
    });
  });
}