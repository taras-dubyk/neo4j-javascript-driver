"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.ALL = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _constants = require("./constants");

var _integer = require("../integer");

var _util = require("./util");

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

/* eslint-disable no-unused-vars */
// Signature bytes for each request message type
var INIT = 0x01; // 0000 0001 // INIT <user_agent> <authentication_token>

var ACK_FAILURE = 0x0e; // 0000 1110 // ACK_FAILURE - unused

var RESET = 0x0f; // 0000 1111 // RESET

var RUN = 0x10; // 0001 0000 // RUN <query> <parameters>

var DISCARD_ALL = 0x2f; // 0010 1111 // DISCARD_ALL - unused

var PULL_ALL = 0x3f; // 0011 1111 // PULL_ALL

var HELLO = 0x01; // 0000 0001 // HELLO <metadata>

var GOODBYE = 0x02; // 0000 0010 // GOODBYE

var BEGIN = 0x11; // 0001 0001 // BEGIN <metadata>

var COMMIT = 0x12; // 0001 0010 // COMMIT

var ROLLBACK = 0x13; // 0001 0011 // ROLLBACK

var DISCARD = 0x2f; // 0010 1111 // DISCARD

var PULL = 0x3f; // 0011 1111 // PULL

var READ_MODE = 'r';
/* eslint-enable no-unused-vars */

var NO_STATEMENT_ID = -1;
var ALL = -1;
exports.ALL = ALL;

var RequestMessage =
/*#__PURE__*/
function () {
  function RequestMessage(signature, fields, toString) {
    (0, _classCallCheck2["default"])(this, RequestMessage);
    this.signature = signature;
    this.fields = fields;
    this.toString = toString;
  }
  /**
   * Create a new INIT message.
   * @param {string} clientName the client name.
   * @param {Object} authToken the authentication token.
   * @return {RequestMessage} new INIT message.
   */


  (0, _createClass2["default"])(RequestMessage, null, [{
    key: "init",
    value: function init(clientName, authToken) {
      return new RequestMessage(INIT, [clientName, authToken], function () {
        return "INIT ".concat(clientName, " {...}");
      });
    }
    /**
     * Create a new RUN message.
     * @param {string} query the cypher query.
     * @param {Object} parameters the query parameters.
     * @return {RequestMessage} new RUN message.
     */

  }, {
    key: "run",
    value: function run(query, parameters) {
      return new RequestMessage(RUN, [query, parameters], function () {
        return "RUN ".concat(query, " ").concat(JSON.stringify(parameters));
      });
    }
    /**
     * Get a PULL_ALL message.
     * @return {RequestMessage} the PULL_ALL message.
     */

  }, {
    key: "pullAll",
    value: function pullAll() {
      return PULL_ALL_MESSAGE;
    }
    /**
     * Get a RESET message.
     * @return {RequestMessage} the RESET message.
     */

  }, {
    key: "reset",
    value: function reset() {
      return RESET_MESSAGE;
    }
    /**
     * Create a new HELLO message.
     * @param {string} userAgent the user agent.
     * @param {Object} authToken the authentication token.
     * @return {RequestMessage} new HELLO message.
     */

  }, {
    key: "hello",
    value: function hello(userAgent, authToken) {
      var metadata = Object.assign({
        user_agent: userAgent
      }, authToken);
      return new RequestMessage(HELLO, [metadata], function () {
        return "HELLO {user_agent: '".concat(userAgent, "', ...}");
      });
    }
    /**
     * Create a new BEGIN message.
     * @param {Bookmark} bookmark the bookmark.
     * @param {TxConfig} txConfig the configuration.
     * @param {string} database the database name.
     * @param {string} mode the access mode.
     * @return {RequestMessage} new BEGIN message.
     */

  }, {
    key: "begin",
    value: function begin() {
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          bookmark = _ref.bookmark,
          txConfig = _ref.txConfig,
          database = _ref.database,
          mode = _ref.mode;

      var metadata = buildTxMetadata(bookmark, txConfig, database, mode);
      return new RequestMessage(BEGIN, [metadata], function () {
        return "BEGIN ".concat(JSON.stringify(metadata));
      });
    }
    /**
     * Get a COMMIT message.
     * @return {RequestMessage} the COMMIT message.
     */

  }, {
    key: "commit",
    value: function commit() {
      return COMMIT_MESSAGE;
    }
    /**
     * Get a ROLLBACK message.
     * @return {RequestMessage} the ROLLBACK message.
     */

  }, {
    key: "rollback",
    value: function rollback() {
      return ROLLBACK_MESSAGE;
    }
    /**
     * Create a new RUN message with additional metadata.
     * @param {string} query the cypher query.
     * @param {Object} parameters the query parameters.
     * @param {Bookmark} bookmark the bookmark.
     * @param {TxConfig} txConfig the configuration.
     * @param {string} database the database name.
     * @param {string} mode the access mode.
     * @return {RequestMessage} new RUN message with additional metadata.
     */

  }, {
    key: "runWithMetadata",
    value: function runWithMetadata(query, parameters) {
      var _ref2 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
          bookmark = _ref2.bookmark,
          txConfig = _ref2.txConfig,
          database = _ref2.database,
          mode = _ref2.mode;

      var metadata = buildTxMetadata(bookmark, txConfig, database, mode);
      return new RequestMessage(RUN, [query, parameters, metadata], function () {
        return "RUN ".concat(query, " ").concat(JSON.stringify(parameters), " ").concat(JSON.stringify(metadata));
      });
    }
    /**
     * Get a GOODBYE message.
     * @return {RequestMessage} the GOODBYE message.
     */

  }, {
    key: "goodbye",
    value: function goodbye() {
      return GOODBYE_MESSAGE;
    }
    /**
     * Generates a new PULL message with additional metadata.
     * @param {Integer|number} stmtId
     * @param {Integer|number} n
     * @return {RequestMessage} the PULL message.
     */

  }, {
    key: "pull",
    value: function pull() {
      var _ref3 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          _ref3$stmtId = _ref3.stmtId,
          stmtId = _ref3$stmtId === void 0 ? NO_STATEMENT_ID : _ref3$stmtId,
          _ref3$n = _ref3.n,
          n = _ref3$n === void 0 ? ALL : _ref3$n;

      var metadata = buildStreamMetadata(stmtId || NO_STATEMENT_ID, n || ALL);
      return new RequestMessage(PULL, [metadata], function () {
        return "PULL ".concat(JSON.stringify(metadata));
      });
    }
    /**
     * Generates a new DISCARD message with additional metadata.
     * @param {Integer|number} stmtId
     * @param {Integer|number} n
     * @return {RequestMessage} the PULL message.
     */

  }, {
    key: "discard",
    value: function discard() {
      var _ref4 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          _ref4$stmtId = _ref4.stmtId,
          stmtId = _ref4$stmtId === void 0 ? NO_STATEMENT_ID : _ref4$stmtId,
          _ref4$n = _ref4.n,
          n = _ref4$n === void 0 ? ALL : _ref4$n;

      var metadata = buildStreamMetadata(stmtId || NO_STATEMENT_ID, n || ALL);
      return new RequestMessage(DISCARD, [metadata], function () {
        return "DISCARD ".concat(JSON.stringify(metadata));
      });
    }
  }]);
  return RequestMessage;
}();
/**
 * Create an object that represent transaction metadata.
 * @param {Bookmark} bookmark the bookmark.
 * @param {TxConfig} txConfig the configuration.
 * @param {string} database the database name.
 * @param {string} mode the access mode.
 * @return {Object} a metadata object.
 */


exports["default"] = RequestMessage;

function buildTxMetadata(bookmark, txConfig, database, mode) {
  var metadata = {};

  if (!bookmark.isEmpty()) {
    metadata.bookmarks = bookmark.values();
  }

  if (txConfig.timeout) {
    metadata.tx_timeout = txConfig.timeout;
  }

  if (txConfig.metadata) {
    metadata.tx_metadata = txConfig.metadata;
  }

  if (database) {
    metadata.db = (0, _util.assertString)(database, 'database');
  }

  if (mode === _constants.ACCESS_MODE_READ) {
    metadata.mode = READ_MODE;
  }

  return metadata;
}
/**
 * Create an object that represents streaming metadata.
 * @param {Integer|number} stmtId The query id to stream its results.
 * @param {Integer|number} n The number of records to stream.
 * @returns {Object} a metadata object.
 */


function buildStreamMetadata(stmtId, n) {
  var metadata = {
    n: (0, _integer["int"])(n)
  };

  if (stmtId !== NO_STATEMENT_ID) {
    metadata.qid = (0, _integer["int"])(stmtId);
  }

  return metadata;
} // constants for messages that never change


var PULL_ALL_MESSAGE = new RequestMessage(PULL_ALL, [], function () {
  return 'PULL_ALL';
});
var RESET_MESSAGE = new RequestMessage(RESET, [], function () {
  return 'RESET';
});
var COMMIT_MESSAGE = new RequestMessage(COMMIT, [], function () {
  return 'COMMIT';
});
var ROLLBACK_MESSAGE = new RequestMessage(ROLLBACK, [], function () {
  return 'ROLLBACK';
});
var GOODBYE_MESSAGE = new RequestMessage(GOODBYE, [], function () {
  return 'GOODBYE';
});