"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _rxjs = require("rxjs");

var _operators = require("rxjs/operators");

var _resultRx = _interopRequireDefault(require("./result-rx"));

var _session = _interopRequireDefault(require("./session"));

var _transactionRx = _interopRequireDefault(require("./transaction-rx"));

var _constants = require("./internal/constants");

var _txConfig = _interopRequireDefault(require("./internal/tx-config"));

var _retryLogicRx = _interopRequireDefault(require("./internal/retry-logic-rx"));

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
 * A Reactive session, which provides the same functionality as {@link Session} but through a Reactive API.
 */
var RxSession =
/*#__PURE__*/
function () {
  /**
   * Constructs a reactive session with given default session instance and provided driver configuration.
   *
   * @protected
   * @param {Object} param - Object parameter
   * @param {Session} param.session - The underlying session instance to relay requests
   */
  function RxSession() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        session = _ref.session,
        config = _ref.config;

    (0, _classCallCheck2["default"])(this, RxSession);
    this._session = session;
    this._retryLogic = _createRetryLogic(config);
  }
  /**
   * Creates a reactive result that will execute the  query with the provided parameters and the provided
   * transaction configuration that applies to the underlying auto-commit transaction.
   *
   * @public
   * @param {string} query - Query to be executed.
   * @param {Object} parameters - Parameter values to use in query execution.
   * @param {TransactionConfig} transactionConfig - Configuration for the new auto-commit transaction.
   * @returns {RxResult} - A reactive result
   */


  (0, _createClass2["default"])(RxSession, [{
    key: "run",
    value: function run(query, parameters, transactionConfig) {
      var _this = this;

      return new _resultRx["default"](new _rxjs.Observable(function (observer) {
        try {
          observer.next(_this._session.run(query, parameters, transactionConfig));
          observer.complete();
        } catch (err) {
          observer.error(err);
        }

        return function () {};
      }));
    }
    /**
     * Starts a new explicit transaction with the provided transaction configuration.
     *
     * @public
     * @param {TransactionConfig} transactionConfig - Configuration for the new transaction.
     * @returns {Observable<RxTransaction>} - A reactive stream that will generate at most **one** RxTransaction instance.
     */

  }, {
    key: "beginTransaction",
    value: function beginTransaction(transactionConfig) {
      return this._beginTransaction(this._session._mode, transactionConfig);
    }
    /**
     * Executes the provided unit of work in a {@link READ} reactive transaction which is created with the provided
     * transaction configuration.
     * @public
     * @param {function(txc: RxTransaction): Observable} work - A unit of work to be executed.
     * @param {TransactionConfig} transactionConfig - Configuration for the enclosing transaction created by the driver.
     * @returns {Observable} - A reactive stream returned by the unit of work.
     */

  }, {
    key: "readTransaction",
    value: function readTransaction(work, transactionConfig) {
      return this._runTransaction(_constants.ACCESS_MODE_READ, work, transactionConfig);
    }
    /**
     * Executes the provided unit of work in a {@link WRITE} reactive transaction which is created with the provided
     * transaction configuration.
     * @public
     * @param {function(txc: RxTransaction): Observable} work - A unit of work to be executed.
     * @param {TransactionConfig} transactionConfig - Configuration for the enclosing transaction created by the driver.
     * @returns {Observable} - A reactive stream returned by the unit of work.
     */

  }, {
    key: "writeTransaction",
    value: function writeTransaction(work, transactionConfig) {
      return this._runTransaction(_constants.ACCESS_MODE_WRITE, work, transactionConfig);
    }
    /**
     * Closes this reactive session.
     *
     * @public
     * @returns {Observable} - An empty reactive stream
     */

  }, {
    key: "close",
    value: function close() {
      var _this2 = this;

      return new _rxjs.Observable(function (observer) {
        _this2._session.close().then(function () {
          observer.complete();
        })["catch"](function (err) {
          return observer.error(err);
        });
      });
    }
    /**
     * Returns the bookmark received following the last successfully completed query, which is executed
     * either in an {@link RxTransaction} obtained from this session instance or directly through one of
     * the {@link RxSession#run} method of this session instance.
     *
     * If no bookmark was received or if this transaction was rolled back, the bookmark value will not be
     * changed.
     *
     * @public
     * @returns {string}
     */

  }, {
    key: "lastBookmark",
    value: function lastBookmark() {
      return this._session.lastBookmark();
    }
    /**
     * @private
     */

  }, {
    key: "_beginTransaction",
    value: function _beginTransaction(accessMode, transactionConfig) {
      var _this3 = this;

      var txConfig = _txConfig["default"].empty();

      if (transactionConfig) {
        txConfig = new _txConfig["default"](transactionConfig);
      }

      return new _rxjs.Observable(function (observer) {
        try {
          observer.next(new _transactionRx["default"](_this3._session._beginTransaction(accessMode, txConfig)));
          observer.complete();
        } catch (err) {
          observer.error(err);
        }

        return function () {};
      });
    }
    /**
     * @private
     */

  }, {
    key: "_runTransaction",
    value: function _runTransaction(accessMode, work, transactionConfig) {
      var txConfig = _txConfig["default"].empty();

      if (transactionConfig) {
        txConfig = new _txConfig["default"](transactionConfig);
      }

      return this._retryLogic.retry(this._beginTransaction(accessMode, transactionConfig).pipe((0, _operators.flatMap)(function (txc) {
        return (0, _rxjs.defer)(function () {
          try {
            return work(txc);
          } catch (err) {
            return (0, _rxjs.throwError)(err);
          }
        }).pipe((0, _operators.catchError)(function (err) {
          return txc.rollback().pipe((0, _operators.concat)((0, _rxjs.throwError)(err)));
        }), (0, _operators.concat)(txc.commit()));
      })));
    }
  }]);
  return RxSession;
}();

exports["default"] = RxSession;

function _createRetryLogic(config) {
  var maxRetryTimeout = config && config.maxTransactionRetryTime ? config.maxTransactionRetryTime : null;
  return new _retryLogicRx["default"]({
    maxRetryTimeout: maxRetryTimeout
  });
}