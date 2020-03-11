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

var _streamObservers = require("./internal/stream-observers");

var _result = _interopRequireDefault(require("./result"));

var _transaction = _interopRequireDefault(require("./transaction"));

var _error = require("./error");

var _util = require("./internal/util");

var _connectionHolder = _interopRequireDefault(require("./internal/connection-holder"));

var _driver = _interopRequireDefault(require("./driver"));

var _constants = require("./internal/constants");

var _transactionExecutor = _interopRequireDefault(require("./internal/transaction-executor"));

var _bookmark = _interopRequireDefault(require("./internal/bookmark"));

var _txConfig = _interopRequireDefault(require("./internal/tx-config"));

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
 * A Session instance is used for handling the connection and
 * sending queries through the connection.
 * In a single session, multiple queries will be executed serially.
 * In order to execute parallel queries, multiple sessions are required.
 * @access public
 */
var Session =
/*#__PURE__*/
function () {
  /**
   * @constructor
   * @protected
   * @param {Object} args
   * @param {string} args.mode the default access mode for this session.
   * @param {ConnectionProvider} args.connectionProvider - The connection provider to acquire connections from.
   * @param {Bookmark} args.bookmark - The initial bookmark for this session.
   * @param {string} args.database the database name
   * @param {Object} args.config={} - This driver configuration.
   * @param {boolean} args.reactive - Whether this session should create reactive streams
   * @param {number} args.fetchSize - Defines how many records is pulled in each pulling batch
   */
  function Session(_ref) {
    var mode = _ref.mode,
        connectionProvider = _ref.connectionProvider,
        bookmark = _ref.bookmark,
        database = _ref.database,
        config = _ref.config,
        reactive = _ref.reactive,
        fetchSize = _ref.fetchSize;
    (0, _classCallCheck2["default"])(this, Session);
    this._mode = mode;
    this._database = database;
    this._reactive = reactive;
    this._fetchSize = fetchSize;
    this._readConnectionHolder = new _connectionHolder["default"]({
      mode: _constants.ACCESS_MODE_READ,
      database: database,
      bookmark: bookmark,
      connectionProvider: connectionProvider
    });
    this._writeConnectionHolder = new _connectionHolder["default"]({
      mode: _constants.ACCESS_MODE_WRITE,
      database: database,
      bookmark: bookmark,
      connectionProvider: connectionProvider
    });
    this._open = true;
    this._hasTx = false;
    this._lastBookmark = bookmark;
    this._transactionExecutor = _createTransactionExecutor(config);
    this._onComplete = this._onCompleteCallback.bind(this);
  }
  /**
   * Run Cypher query
   * Could be called with a query object i.e.: `{text: "MATCH ...", prameters: {param: 1}}`
   * or with the query and parameters as separate arguments.
   *
   * @public
   * @param {mixed} query - Cypher query to execute
   * @param {Object} parameters - Map with parameters to use in query
   * @param {TransactionConfig} [transactionConfig] - Configuration for the new auto-commit transaction.
   * @return {Result} New Result.
   */


  (0, _createClass2["default"])(Session, [{
    key: "run",
    value: function run(query, parameters, transactionConfig) {
      var _this = this;

      var _validateQueryAndPara = (0, _util.validateQueryAndParameters)(query, parameters),
          validatedQuery = _validateQueryAndPara.validatedQuery,
          params = _validateQueryAndPara.params;

      var autoCommitTxConfig = transactionConfig ? new _txConfig["default"](transactionConfig) : _txConfig["default"].empty();
      return this._run(validatedQuery, params, function (connection) {
        return connection.protocol().run(validatedQuery, params, {
          bookmark: _this._lastBookmark,
          txConfig: autoCommitTxConfig,
          mode: _this._mode,
          database: _this._database,
          afterComplete: _this._onComplete,
          reactive: _this._reactive,
          fetchSize: _this._fetchSize
        });
      });
    }
  }, {
    key: "_run",
    value: function _run(query, parameters, customRunner) {
      var connectionHolder = this._connectionHolderWithMode(this._mode);

      var observerPromise;

      if (!this._open) {
        observerPromise = Promise.resolve(new _streamObservers.FailedObserver({
          error: (0, _error.newError)('Cannot run query in a closed session.')
        }));
      } else if (!this._hasTx && connectionHolder.initializeConnection()) {
        observerPromise = connectionHolder.getConnection().then(function (connection) {
          return customRunner(connection);
        })["catch"](function (error) {
          return Promise.resolve(new _streamObservers.FailedObserver({
            error: error
          }));
        });
      } else {
        observerPromise = Promise.resolve(new _streamObservers.FailedObserver({
          error: (0, _error.newError)('Queries cannot be run directly on a ' + 'session with an open transaction; either run from within the ' + 'transaction or use a different session.')
        }));
      }

      return new _result["default"](observerPromise, query, parameters, connectionHolder);
    }
    /**
     * Begin a new transaction in this session. A session can have at most one transaction running at a time, if you
     * want to run multiple concurrent transactions, you should use multiple concurrent sessions.
     *
     * While a transaction is open the session cannot be used to run queries outside the transaction.
     *
     * @param {TransactionConfig} [transactionConfig] - Configuration for the new auto-commit transaction.
     * @returns {Transaction} New Transaction.
     */

  }, {
    key: "beginTransaction",
    value: function beginTransaction(transactionConfig) {
      // this function needs to support bookmarks parameter for backwards compatibility
      // parameter was of type {string|string[]} and represented either a single or multiple bookmarks
      // that's why we need to check parameter type and decide how to interpret the value
      var arg = transactionConfig;

      var txConfig = _txConfig["default"].empty();

      if (arg) {
        txConfig = new _txConfig["default"](arg);
      }

      return this._beginTransaction(this._mode, txConfig);
    }
  }, {
    key: "_beginTransaction",
    value: function _beginTransaction(accessMode, txConfig) {
      if (!this._open) {
        throw (0, _error.newError)('Cannot begin a transaction on a closed session.');
      }

      if (this._hasTx) {
        throw (0, _error.newError)('You cannot begin a transaction on a session with an open transaction; ' + 'either run from within the transaction or use a different session.');
      }

      var mode = _driver["default"]._validateSessionMode(accessMode);

      var connectionHolder = this._connectionHolderWithMode(mode);

      connectionHolder.initializeConnection();
      this._hasTx = true;
      var tx = new _transaction["default"]({
        connectionHolder: connectionHolder,
        onClose: this._transactionClosed.bind(this),
        onBookmark: this._updateBookmark.bind(this),
        reactive: this._reactive,
        fetchSize: this._fetchSize
      });

      tx._begin(this._lastBookmark, txConfig);

      return tx;
    }
  }, {
    key: "_transactionClosed",
    value: function _transactionClosed() {
      this._hasTx = false;
    }
    /**
     * Return the bookmark received following the last completed {@link Transaction}.
     *
     * @return {string[]} A reference to a previous transaction.
     */

  }, {
    key: "lastBookmark",
    value: function lastBookmark() {
      return this._lastBookmark.values();
    }
    /**
     * Execute given unit of work in a {@link READ} transaction.
     *
     * Transaction will automatically be committed unless the given function throws or returns a rejected promise.
     * Some failures of the given function or the commit itself will be retried with exponential backoff with initial
     * delay of 1 second and maximum retry time of 30 seconds. Maximum retry time is configurable via driver config's
     * `maxTransactionRetryTime` property in milliseconds.
     *
     * @param {function(tx: Transaction): Promise} transactionWork - Callback that executes operations against
     * a given {@link Transaction}.
     * @param {TransactionConfig} [transactionConfig] - Configuration for all transactions started to execute the unit of work.
     * @return {Promise} Resolved promise as returned by the given function or rejected promise when given
     * function or commit fails.
     */

  }, {
    key: "readTransaction",
    value: function readTransaction(transactionWork, transactionConfig) {
      var config = new _txConfig["default"](transactionConfig);
      return this._runTransaction(_constants.ACCESS_MODE_READ, config, transactionWork);
    }
    /**
     * Execute given unit of work in a {@link WRITE} transaction.
     *
     * Transaction will automatically be committed unless the given function throws or returns a rejected promise.
     * Some failures of the given function or the commit itself will be retried with exponential backoff with initial
     * delay of 1 second and maximum retry time of 30 seconds. Maximum retry time is configurable via driver config's
     * `maxTransactionRetryTime` property in milliseconds.
     *
     * @param {function(tx: Transaction): Promise} transactionWork - Callback that executes operations against
     * a given {@link Transaction}.
     * @param {TransactionConfig} [transactionConfig] - Configuration for all transactions started to execute the unit of work.
     * @return {Promise} Resolved promise as returned by the given function or rejected promise when given
     * function or commit fails.
     */

  }, {
    key: "writeTransaction",
    value: function writeTransaction(transactionWork, transactionConfig) {
      var config = new _txConfig["default"](transactionConfig);
      return this._runTransaction(_constants.ACCESS_MODE_WRITE, config, transactionWork);
    }
  }, {
    key: "_runTransaction",
    value: function _runTransaction(accessMode, transactionConfig, transactionWork) {
      var _this2 = this;

      return this._transactionExecutor.execute(function () {
        return _this2._beginTransaction(accessMode, transactionConfig);
      }, transactionWork);
    }
    /**
     * Update value of the last bookmark.
     * @param {Bookmark} newBookmark - The new bookmark.
     */

  }, {
    key: "_updateBookmark",
    value: function _updateBookmark(newBookmark) {
      if (newBookmark && !newBookmark.isEmpty()) {
        this._lastBookmark = newBookmark;
      }
    }
    /**
     * Close this session.
     * @return {Promise}
     */

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
                if (!this._open) {
                  _context.next = 7;
                  break;
                }

                this._open = false;

                this._transactionExecutor.close();

                _context.next = 5;
                return this._readConnectionHolder.close();

              case 5:
                _context.next = 7;
                return this._writeConnectionHolder.close();

              case 7:
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
  }, {
    key: "_connectionHolderWithMode",
    value: function _connectionHolderWithMode(mode) {
      if (mode === _constants.ACCESS_MODE_READ) {
        return this._readConnectionHolder;
      } else if (mode === _constants.ACCESS_MODE_WRITE) {
        return this._writeConnectionHolder;
      } else {
        throw (0, _error.newError)('Unknown access mode: ' + mode);
      }
    }
  }, {
    key: "_onCompleteCallback",
    value: function _onCompleteCallback(meta) {
      this._updateBookmark(new _bookmark["default"](meta.bookmark));
    }
  }]);
  return Session;
}();

function _createTransactionExecutor(config) {
  var maxRetryTimeMs = config && config.maxTransactionRetryTime ? config.maxTransactionRetryTime : null;
  return new _transactionExecutor["default"](maxRetryTimeMs);
}

var _default = Session;
exports["default"] = _default;