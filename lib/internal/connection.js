"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _streamObservers = require("./stream-observers");

var _boltProtocolV = _interopRequireDefault(require("./bolt-protocol-v1"));

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
var Connection =
/*#__PURE__*/
function () {
  /**
   * @param {ConnectionErrorHandler} errorHandler the error handler
   */
  function Connection(errorHandler) {
    (0, _classCallCheck2["default"])(this, Connection);
    this._errorHandler = errorHandler;
  }

  (0, _createClass2["default"])(Connection, [{
    key: "isOpen",

    /**
     * @returns {boolean} whether this connection is in a working condition
     */
    value: function isOpen() {
      throw new Error('not implemented');
    }
    /**
     * @returns {BoltProtocol} the underlying bolt protocol assigned to this connection
     */

  }, {
    key: "protocol",
    value: function protocol() {
      throw new Error('not implemented');
    }
    /**
     * @returns {ServerAddress} the server address this connection is opened against
     */

  }, {
    key: "connect",

    /**
     * Connect to the target address, negotiate Bolt protocol and send initialization message.
     * @param {string} userAgent the user agent for this driver.
     * @param {Object} authToken the object containing auth information.
     * @return {Promise<Connection>} promise resolved with the current connection if connection is successful. Rejected promise otherwise.
     */
    value: function connect(userAgent, authToken) {
      throw new Error('not implemented');
    }
    /**
     * Write a message to the network channel.
     * @param {RequestMessage} message the message to write.
     * @param {ResultStreamObserver} observer the response observer.
     * @param {boolean} flush `true` if flush should happen after the message is written to the buffer.
     */

  }, {
    key: "write",
    value: function write(message, observer, flush) {
      throw new Error('not implemented');
    }
    /**
     * Send a RESET-message to the database. Message is immediately flushed to the network.
     * @return {Promise<void>} promise resolved when SUCCESS-message response arrives, or failed when other response messages arrives.
     */

  }, {
    key: "resetAndFlush",
    value: function resetAndFlush() {
      throw new Error('not implemented');
    }
    /**
     * Call close on the channel.
     * @returns {Promise<void>} - A promise that will be resolved when the connection is closed.
     *
     */

  }, {
    key: "close",
    value: function close() {
      throw new Error('not implemented');
    }
    /**
     *
     * @param error
     * @param address
     * @returns {Neo4jError|*}
     */

  }, {
    key: "handleAndTransformError",
    value: function handleAndTransformError(error, address) {
      if (this._errorHandler) {
        return this._errorHandler.handleAndTransformError(error, address);
      }

      return error;
    }
  }, {
    key: "id",
    get: function get() {
      throw new Error('not implemented');
    }
  }, {
    key: "databaseId",
    get: function get() {
      throw new Error('not implemented');
    },
    set: function set(value) {
      throw new Error('not implemented');
    }
  }, {
    key: "address",
    get: function get() {
      throw new Error('not implemented');
    }
    /**
     * @returns {ServerVersion} the version of the server this connection is connected to
     */

  }, {
    key: "version",
    get: function get() {
      throw new Error('not implemented');
    },
    set: function set(value) {
      throw new Error('not implemented');
    }
  }, {
    key: "server",
    get: function get() {
      throw new Error('not implemented');
    }
  }]);
  return Connection;
}();

exports["default"] = Connection;