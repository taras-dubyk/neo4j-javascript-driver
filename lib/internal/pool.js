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

var _poolConfig = _interopRequireDefault(require("./pool-config"));

var _error = require("../error");

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
var Pool =
/*#__PURE__*/
function () {
  /**
   * @param {function(address: ServerAddress, function(address: ServerAddress, resource: object): Promise<object>): Promise<object>} create
   *                an allocation function that creates a promise with a new resource. It's given an address for which to
   *                allocate the connection and a function that will return the resource to the pool if invoked, which is
   *                meant to be called on .dispose or .close or whatever mechanism the resource uses to finalize.
   * @param {function(resource: object): Promise<void>} destroy
   *                called with the resource when it is evicted from this pool
   * @param {function(resource: object): boolean} validate
   *                called at various times (like when an instance is acquired and when it is returned.
   *                If this returns false, the resource will be evicted
   * @param {function(resource: object, observer: { onError }): void} installIdleObserver
   *                called when the resource is released back to pool
   * @param {function(resource: object): void} removeIdleObserver
   *                called when the resource is acquired from the pool
   * @param {PoolConfig} config configuration for the new driver.
   * @param {Logger} log the driver logger.
   */
  function Pool() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$create = _ref.create,
        create = _ref$create === void 0 ? function (address, release) {
      return Promise.resolve();
    } : _ref$create,
        _ref$destroy = _ref.destroy,
        destroy = _ref$destroy === void 0 ? function (conn) {
      return Promise.resolve();
    } : _ref$destroy,
        _ref$validate = _ref.validate,
        validate = _ref$validate === void 0 ? function (conn) {
      return true;
    } : _ref$validate,
        _ref$installIdleObser = _ref.installIdleObserver,
        installIdleObserver = _ref$installIdleObser === void 0 ? function (conn, observer) {} : _ref$installIdleObser,
        _ref$removeIdleObserv = _ref.removeIdleObserver,
        removeIdleObserver = _ref$removeIdleObserv === void 0 ? function (conn) {} : _ref$removeIdleObserv,
        _ref$config = _ref.config,
        config = _ref$config === void 0 ? _poolConfig["default"].defaultConfig() : _ref$config,
        _ref$log = _ref.log,
        log = _ref$log === void 0 ? _logger["default"].noOp() : _ref$log;

    (0, _classCallCheck2["default"])(this, Pool);
    this._create = create;
    this._destroy = destroy;
    this._validate = validate;
    this._installIdleObserver = installIdleObserver;
    this._removeIdleObserver = removeIdleObserver;
    this._maxSize = config.maxSize;
    this._acquisitionTimeout = config.acquisitionTimeout;
    this._pools = {};
    this._acquireRequests = {};
    this._activeResourceCounts = {};
    this._release = this._release.bind(this);
    this._log = log;
    this._closed = false;
  }
  /**
   * Acquire and idle resource fom the pool or create a new one.
   * @param {ServerAddress} address the address for which we're acquiring.
   * @return {Object} resource that is ready to use.
   */


  (0, _createClass2["default"])(Pool, [{
    key: "acquire",
    value: function acquire(address) {
      var _this = this;

      return this._acquire(address).then(function (resource) {
        var key = address.asKey();

        if (resource) {
          if (_this._maxSize && _this.activeResourceCount(address) >= _this._maxSize) {
            _this._destroy(resource);
          } else {
            resourceAcquired(key, _this._activeResourceCounts);

            if (_this._log.isDebugEnabled()) {
              _this._log.debug("".concat(resource, " acquired from the pool ").concat(key));
            }

            return resource;
          }
        } // We're out of resources and will try to acquire later on when an existing resource is released.


        var allRequests = _this._acquireRequests;
        var requests = allRequests[key];

        if (!requests) {
          allRequests[key] = [];
        }

        return new Promise(function (resolve, reject) {
          var request;
          var timeoutId = setTimeout(function () {
            // acquisition timeout fired
            // remove request from the queue of pending requests, if it's still there
            // request might've been taken out by the release operation
            var pendingRequests = allRequests[key];

            if (pendingRequests) {
              allRequests[key] = pendingRequests.filter(function (item) {
                return item !== request;
              });
            }

            if (request.isCompleted()) {// request already resolved/rejected by the release operation; nothing to do
            } else {
              // request is still pending and needs to be failed
              var activeCount = _this.activeResourceCount(address);

              var idleCount = _this.has(address) ? _this._pools[key].length : 0;
              request.reject((0, _error.newError)("Connection acquisition timed out in ".concat(_this._acquisitionTimeout, " ms. Poos status: Active conn count = ").concat(activeCount, ", Idle conn count = ").concat(idleCount, ".")));
            }
          }, _this._acquisitionTimeout);
          request = new PendingRequest(key, resolve, reject, timeoutId, _this._log);
          allRequests[key].push(request);
        });
      });
    }
    /**
     * Destroy all idle resources for the given address.
     * @param {ServerAddress} address the address of the server to purge its pool.
     * @returns {Promise<void>} A promise that is resolved when the resources are purged
     */

  }, {
    key: "purge",
    value: function purge(address) {
      return this._purgeKey(address.asKey());
    }
    /**
     * Destroy all idle resources in this pool.
     * @returns {Promise<void>} A promise that is resolved when the resources are purged
     */

  }, {
    key: "close",
    value: function close() {
      var _this2 = this;

      this._closed = true;
      return Promise.all(Object.keys(this._pools).map(function (key) {
        return _this2._purgeKey(key);
      }));
    }
    /**
     * Keep the idle resources for the provided addresses and purge the rest.
     * @returns {Promise<void>} A promise that is resolved when the other resources are purged
     */

  }, {
    key: "keepAll",
    value: function keepAll(addresses) {
      var _this3 = this;

      var keysToKeep = addresses.map(function (a) {
        return a.asKey();
      });
      var keysPresent = Object.keys(this._pools);
      var keysToPurge = keysPresent.filter(function (k) {
        return keysToKeep.indexOf(k) === -1;
      });
      return Promise.all(keysToPurge.map(function (key) {
        return _this3._purgeKey(key);
      }));
    }
    /**
     * Check if this pool contains resources for the given address.
     * @param {ServerAddress} address the address of the server to check.
     * @return {boolean} `true` when pool contains entries for the given key, <code>false</code> otherwise.
     */

  }, {
    key: "has",
    value: function has(address) {
      return address.asKey() in this._pools;
    }
    /**
     * Get count of active (checked out of the pool) resources for the given key.
     * @param {ServerAddress} address the address of the server to check.
     * @return {number} count of resources acquired by clients.
     */

  }, {
    key: "activeResourceCount",
    value: function activeResourceCount(address) {
      return this._activeResourceCounts[address.asKey()] || 0;
    }
  }, {
    key: "_acquire",
    value: function () {
      var _acquire2 = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee(address) {
        var key, pool, resource;
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!this._closed) {
                  _context.next = 2;
                  break;
                }

                throw (0, _error.newError)('Pool is closed, it is no more able to serve requests.');

              case 2:
                key = address.asKey();
                pool = this._pools[key];

                if (!pool) {
                  pool = [];
                  this._pools[key] = pool;
                }

              case 5:
                if (!pool.length) {
                  _context.next = 16;
                  break;
                }

                resource = pool.pop();

                if (!this._validate(resource)) {
                  _context.next = 12;
                  break;
                }

                if (this._removeIdleObserver) {
                  this._removeIdleObserver(resource);
                } // idle resource is valid and can be acquired


                return _context.abrupt("return", Promise.resolve(resource));

              case 12:
                _context.next = 14;
                return this._destroy(resource);

              case 14:
                _context.next = 5;
                break;

              case 16:
                if (!(this._maxSize && this.activeResourceCount(address) >= this._maxSize)) {
                  _context.next = 18;
                  break;
                }

                return _context.abrupt("return", null);

              case 18:
                _context.next = 20;
                return this._create(address, this._release);

              case 20:
                return _context.abrupt("return", _context.sent);

              case 21:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function _acquire(_x) {
        return _acquire2.apply(this, arguments);
      }

      return _acquire;
    }()
  }, {
    key: "_release",
    value: function () {
      var _release2 = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee2(address, resource) {
        var _this4 = this;

        var key, pool;
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                key = address.asKey();
                pool = this._pools[key];

                if (!pool) {
                  _context2.next = 14;
                  break;
                }

                if (this._validate(resource)) {
                  _context2.next = 9;
                  break;
                }

                if (this._log.isDebugEnabled()) {
                  this._log.debug("".concat(resource, " destroyed and can't be released to the pool ").concat(key, " because it is not functional"));
                }

                _context2.next = 7;
                return this._destroy(resource);

              case 7:
                _context2.next = 12;
                break;

              case 9:
                if (this._installIdleObserver) {
                  this._installIdleObserver(resource, {
                    onError: function onError(error) {
                      _this4._log.debug("Idle connection ".concat(resource, " destroyed because of error: ").concat(error));

                      var pool = _this4._pools[key];

                      if (pool) {
                        _this4._pools[key] = pool.filter(function (r) {
                          return r !== resource;
                        });
                      } // let's not care about background clean-ups due to errors but just trigger the destroy
                      // process for the resource, we especially catch any errors and ignore them to avoid
                      // unhandled promise rejection warnings


                      _this4._destroy(resource)["catch"](function () {});
                    }
                  });
                }

                pool.push(resource);

                if (this._log.isDebugEnabled()) {
                  this._log.debug("".concat(resource, " released to the pool ").concat(key));
                }

              case 12:
                _context2.next = 17;
                break;

              case 14:
                // key has been purged, don't put it back, just destroy the resource
                if (this._log.isDebugEnabled()) {
                  this._log.debug("".concat(resource, " destroyed and can't be released to the pool ").concat(key, " because pool has been purged"));
                }

                _context2.next = 17;
                return this._destroy(resource);

              case 17:
                resourceReleased(key, this._activeResourceCounts);

                this._processPendingAcquireRequests(address);

              case 19:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function _release(_x2, _x3) {
        return _release2.apply(this, arguments);
      }

      return _release;
    }()
  }, {
    key: "_purgeKey",
    value: function () {
      var _purgeKey2 = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee3(key) {
        var pool, resource;
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                pool = this._pools[key] || [];

              case 1:
                if (!pool.length) {
                  _context3.next = 8;
                  break;
                }

                resource = pool.pop();

                if (this._removeIdleObserver) {
                  this._removeIdleObserver(resource);
                }

                _context3.next = 6;
                return this._destroy(resource);

              case 6:
                _context3.next = 1;
                break;

              case 8:
                delete this._pools[key];

              case 9:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function _purgeKey(_x4) {
        return _purgeKey2.apply(this, arguments);
      }

      return _purgeKey;
    }()
  }, {
    key: "_processPendingAcquireRequests",
    value: function _processPendingAcquireRequests(address) {
      var _this5 = this;

      var key = address.asKey();
      var requests = this._acquireRequests[key];

      if (requests) {
        var pendingRequest = requests.shift(); // pop a pending acquire request

        if (pendingRequest) {
          this._acquire(address)["catch"](function (error) {
            // failed to acquire/create a new connection to resolve the pending acquire request
            // propagate the error by failing the pending request
            pendingRequest.reject(error);
            return null;
          }).then(function (resource) {
            if (resource) {
              // managed to acquire a valid resource from the pool
              if (pendingRequest.isCompleted()) {
                // request has been completed, most likely failed by a timeout
                // return the acquired resource back to the pool
                _this5._release(address, resource);
              } else {
                // request is still pending and can be resolved with the newly acquired resource
                resourceAcquired(key, _this5._activeResourceCounts); // increment the active counter

                pendingRequest.resolve(resource); // resolve the pending request with the acquired resource
              }
            }
          });
        } else {
          delete this._acquireRequests[key];
        }
      }
    }
  }]);
  return Pool;
}();
/**
 * Increment active (checked out of the pool) resource counter.
 * @param {string} key the resource group identifier (server address for connections).
 * @param {Object.<string, number>} activeResourceCounts the object holding active counts per key.
 */


function resourceAcquired(key, activeResourceCounts) {
  var currentCount = activeResourceCounts[key] || 0;
  activeResourceCounts[key] = currentCount + 1;
}
/**
 * Decrement active (checked out of the pool) resource counter.
 * @param {string} key the resource group identifier (server address for connections).
 * @param {Object.<string, number>} activeResourceCounts the object holding active counts per key.
 */


function resourceReleased(key, activeResourceCounts) {
  var currentCount = activeResourceCounts[key] || 0;
  var nextCount = currentCount - 1;

  if (nextCount > 0) {
    activeResourceCounts[key] = nextCount;
  } else {
    delete activeResourceCounts[key];
  }
}

var PendingRequest =
/*#__PURE__*/
function () {
  function PendingRequest(key, resolve, reject, timeoutId, log) {
    (0, _classCallCheck2["default"])(this, PendingRequest);
    this._key = key;
    this._resolve = resolve;
    this._reject = reject;
    this._timeoutId = timeoutId;
    this._log = log;
    this._completed = false;
  }

  (0, _createClass2["default"])(PendingRequest, [{
    key: "isCompleted",
    value: function isCompleted() {
      return this._completed;
    }
  }, {
    key: "resolve",
    value: function resolve(resource) {
      if (this._completed) {
        return;
      }

      this._completed = true;
      clearTimeout(this._timeoutId);

      if (this._log.isDebugEnabled()) {
        this._log.debug("".concat(resource, " acquired from the pool ").concat(this._key));
      }

      this._resolve(resource);
    }
  }, {
    key: "reject",
    value: function reject(error) {
      if (this._completed) {
        return;
      }

      this._completed = true;
      clearTimeout(this._timeoutId);

      this._reject(error);
    }
  }]);
  return PendingRequest;
}();

var _default = Pool;
exports["default"] = _default;