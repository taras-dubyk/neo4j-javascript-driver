"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _error = require("../error");

var _rxjs = require("rxjs");

var _operators = require("rxjs/operators");

var _logger = _interopRequireDefault(require("./logger"));

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
var DEFAULT_MAX_RETRY_TIME_MS = 30 * 1000; // 30 seconds

var DEFAULT_INITIAL_RETRY_DELAY_MS = 1000; // 1 seconds

var DEFAULT_RETRY_DELAY_MULTIPLIER = 2.0;
var DEFAULT_RETRY_DELAY_JITTER_FACTOR = 0.2;

var RxRetryLogic =
/*#__PURE__*/
function () {
  /**
   *
   * @param {Object} args
   * @param {Logger} args.logger
   */
  function RxRetryLogic() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$maxRetryTimeout = _ref.maxRetryTimeout,
        maxRetryTimeout = _ref$maxRetryTimeout === void 0 ? DEFAULT_MAX_RETRY_TIME_MS : _ref$maxRetryTimeout,
        _ref$initialDelay = _ref.initialDelay,
        initialDelay = _ref$initialDelay === void 0 ? DEFAULT_INITIAL_RETRY_DELAY_MS : _ref$initialDelay,
        _ref$delayMultiplier = _ref.delayMultiplier,
        delayMultiplier = _ref$delayMultiplier === void 0 ? DEFAULT_RETRY_DELAY_MULTIPLIER : _ref$delayMultiplier,
        _ref$delayJitter = _ref.delayJitter,
        delayJitter = _ref$delayJitter === void 0 ? DEFAULT_RETRY_DELAY_JITTER_FACTOR : _ref$delayJitter,
        _ref$logger = _ref.logger,
        logger = _ref$logger === void 0 ? null : _ref$logger;

    (0, _classCallCheck2["default"])(this, RxRetryLogic);
    this._maxRetryTimeout = valueOrDefault(maxRetryTimeout, DEFAULT_MAX_RETRY_TIME_MS);
    this._initialDelay = valueOrDefault(initialDelay, DEFAULT_INITIAL_RETRY_DELAY_MS);
    this._delayMultiplier = valueOrDefault(delayMultiplier, DEFAULT_RETRY_DELAY_MULTIPLIER);
    this._delayJitter = valueOrDefault(delayJitter, DEFAULT_RETRY_DELAY_JITTER_FACTOR);
    this._logger = logger;
  }
  /**
   *
   * @param {Observable<Any>} work
   */


  (0, _createClass2["default"])(RxRetryLogic, [{
    key: "retry",
    value: function retry(work) {
      var _this = this;

      return work.pipe((0, _operators.retryWhen)(function (failedWork) {
        var handledExceptions = [];
        var startTime = Date.now();
        var retryCount = 1;
        var delayDuration = _this._initialDelay;
        return failedWork.pipe((0, _operators.flatMap)(function (err) {
          if (!RxRetryLogic._canRetryOn(err)) {
            return (0, _rxjs.throwError)(err);
          }

          handledExceptions.push(err);

          if (retryCount >= 2 && Date.now() - startTime >= _this._maxRetryTimeout) {
            var error = (0, _error.newError)("Failed after retried for ".concat(retryCount, " times in ").concat(_this._maxRetryTimeout, " ms. Make sure that your database is online and retry again."), _error.SERVICE_UNAVAILABLE);
            error.seenErrors = handledExceptions;
            return (0, _rxjs.throwError)(error);
          }

          var nextDelayDuration = _this._computeNextDelay(delayDuration);

          delayDuration = delayDuration * _this._delayMultiplier;
          retryCount++;

          if (_this._logger) {
            _this._logger.warn("Transaction failed and will be retried in ".concat(nextDelayDuration));
          }

          return (0, _rxjs.of)(1).pipe((0, _operators.delay)(nextDelayDuration));
        }));
      }));
    }
  }, {
    key: "_computeNextDelay",
    value: function _computeNextDelay(delay) {
      var jitter = delay * this._delayJitter;
      return delay - jitter + 2 * jitter * Math.random();
    }
  }], [{
    key: "_canRetryOn",
    value: function _canRetryOn(error) {
      return error && error.code && (error.code === _error.SERVICE_UNAVAILABLE || error.code === _error.SESSION_EXPIRED || this._isTransientError(error));
    }
  }, {
    key: "_isTransientError",
    value: function _isTransientError(error) {
      // Retries should not happen when transaction was explicitly terminated by the user.
      // Termination of transaction might result in two different error codes depending on where it was
      // terminated. These are really client errors but classification on the server is not entirely correct and
      // they are classified as transient.
      var code = error.code;

      if (code.indexOf('TransientError') >= 0) {
        if (code === 'Neo.TransientError.Transaction.Terminated' || code === 'Neo.TransientError.Transaction.LockClientStopped') {
          return false;
        }

        return true;
      }

      return false;
    }
  }]);
  return RxRetryLogic;
}();

exports["default"] = RxRetryLogic;

function valueOrDefault(value, defaultValue) {
  if (value || value === 0) {
    return value;
  }

  return defaultValue;
}