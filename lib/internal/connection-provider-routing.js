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

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _error = require("../error");

var _driver = require("../driver");

var _session = _interopRequireDefault(require("../session"));

var _routingTable = _interopRequireDefault(require("./routing-table"));

var _rediscovery = _interopRequireDefault(require("./rediscovery"));

var _routingUtil = _interopRequireDefault(require("./routing-util"));

var _node = require("./node");

var _connectionProviderSingle = _interopRequireDefault(require("./connection-provider-single"));

var _serverVersion = require("./server-version");

var _connectionProviderPooled = _interopRequireDefault(require("./connection-provider-pooled"));

var _connectionErrorHandler = _interopRequireDefault(require("./connection-error-handler"));

var _connectionDelegate = _interopRequireDefault(require("./connection-delegate"));

var _leastConnectedLoadBalancingStrategy = _interopRequireDefault(require("./least-connected-load-balancing-strategy"));

var _bookmark = _interopRequireDefault(require("./bookmark"));

var _connectionChannel = _interopRequireDefault(require("./connection-channel"));

var _integer = require("../integer");

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
var UNAUTHORIZED_ERROR_CODE = 'Neo.ClientError.Security.Unauthorized';
var DATABASE_NOT_FOUND_ERROR_CODE = 'Neo.ClientError.Database.DatabaseNotFound';
var SYSTEM_DB_NAME = 'system';
var DEFAULT_DB_NAME = '';
var DEFAULT_ROUTING_TABLE_PURGE_DELAY = (0, _integer["int"])(30000);

var RoutingConnectionProvider =
/*#__PURE__*/
function (_PooledConnectionProv) {
  (0, _inherits2["default"])(RoutingConnectionProvider, _PooledConnectionProv);

  function RoutingConnectionProvider(_ref) {
    var _this;

    var id = _ref.id,
        address = _ref.address,
        routingContext = _ref.routingContext,
        hostNameResolver = _ref.hostNameResolver,
        config = _ref.config,
        log = _ref.log,
        userAgent = _ref.userAgent,
        authToken = _ref.authToken,
        routingTablePurgeDelay = _ref.routingTablePurgeDelay;
    (0, _classCallCheck2["default"])(this, RoutingConnectionProvider);
    _this = (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(RoutingConnectionProvider).call(this, {
      id: id,
      config: config,
      log: log,
      userAgent: userAgent,
      authToken: authToken
    }));
    _this._seedRouter = address;
    _this._routingTables = {};
    _this._rediscovery = new _rediscovery["default"](new _routingUtil["default"](routingContext));
    _this._loadBalancingStrategy = new _leastConnectedLoadBalancingStrategy["default"](_this._connectionPool);
    _this._hostNameResolver = hostNameResolver;
    _this._dnsResolver = new _node.HostNameResolver();
    _this._log = log;
    _this._useSeedRouter = true;
    _this._routingTablePurgeDelay = routingTablePurgeDelay ? (0, _integer["int"])(routingTablePurgeDelay) : DEFAULT_ROUTING_TABLE_PURGE_DELAY;
    return _this;
  }

  (0, _createClass2["default"])(RoutingConnectionProvider, [{
    key: "_createConnectionErrorHandler",
    value: function _createConnectionErrorHandler() {
      // connection errors mean SERVICE_UNAVAILABLE for direct driver but for routing driver they should only
      // result in SESSION_EXPIRED because there might still exist other servers capable of serving the request
      return new _connectionErrorHandler["default"](_error.SESSION_EXPIRED);
    }
  }, {
    key: "_handleUnavailability",
    value: function _handleUnavailability(error, address, database) {
      this._log.warn("Routing driver ".concat(this._id, " will forget ").concat(address, " for database '").concat(database, "' because of an error ").concat(error.code, " '").concat(error.message, "'"));

      this.forget(address, database || '');
      return error;
    }
  }, {
    key: "_handleWriteFailure",
    value: function _handleWriteFailure(error, address, database) {
      this._log.warn("Routing driver ".concat(this._id, " will forget writer ").concat(address, " for database '").concat(database, "' because of an error ").concat(error.code, " '").concat(error.message, "'"));

      this.forgetWriter(address, database || '');
      return (0, _error.newError)('No longer possible to write to server at ' + address, _error.SESSION_EXPIRED);
    }
    /**
     * See {@link ConnectionProvider} for more information about this method and
     * its arguments.
     */

  }, {
    key: "acquireConnection",
    value: function () {
      var _acquireConnection = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee() {
        var _this2 = this;

        var _ref2,
            accessMode,
            database,
            bookmark,
            name,
            address,
            databaseSpecificErrorHandler,
            routingTable,
            connection,
            transformed,
            _args = arguments;

        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _ref2 = _args.length > 0 && _args[0] !== undefined ? _args[0] : {}, accessMode = _ref2.accessMode, database = _ref2.database, bookmark = _ref2.bookmark;
                databaseSpecificErrorHandler = new _connectionErrorHandler["default"](_error.SESSION_EXPIRED, function (error, address) {
                  return _this2._handleUnavailability(error, address, database);
                }, function (error, address) {
                  return _this2._handleWriteFailure(error, address, database);
                });
                _context.next = 4;
                return this._freshRoutingTable({
                  accessMode: accessMode,
                  database: database || DEFAULT_DB_NAME,
                  bookmark: bookmark
                });

              case 4:
                routingTable = _context.sent;

                if (!(accessMode === _driver.READ)) {
                  _context.next = 10;
                  break;
                }

                address = this._loadBalancingStrategy.selectReader(routingTable.readers);
                name = 'read';
                _context.next = 16;
                break;

              case 10:
                if (!(accessMode === _driver.WRITE)) {
                  _context.next = 15;
                  break;
                }

                address = this._loadBalancingStrategy.selectWriter(routingTable.writers);
                name = 'write';
                _context.next = 16;
                break;

              case 15:
                throw (0, _error.newError)('Illegal mode ' + accessMode);

              case 16:
                if (address) {
                  _context.next = 18;
                  break;
                }

                throw (0, _error.newError)("Failed to obtain connection towards ".concat(name, " server. Known routing table is: ").concat(routingTable), _error.SESSION_EXPIRED);

              case 18:
                _context.prev = 18;
                _context.next = 21;
                return this._acquireConnectionToServer(address, name, routingTable);

              case 21:
                connection = _context.sent;
                return _context.abrupt("return", new _connectionDelegate["default"](connection, databaseSpecificErrorHandler));

              case 25:
                _context.prev = 25;
                _context.t0 = _context["catch"](18);
                transformed = databaseSpecificErrorHandler.handleAndTransformError(_context.t0, address);
                throw transformed;

              case 29:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this, [[18, 25]]);
      }));

      function acquireConnection() {
        return _acquireConnection.apply(this, arguments);
      }

      return acquireConnection;
    }()
  }, {
    key: "supportsMultiDb",
    value: function () {
      var _supportsMultiDb = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee2() {
        var addresses, lastError, i, connection, protocol;
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this._resolveSeedRouter(this._seedRouter);

              case 2:
                addresses = _context2.sent;
                i = 0;

              case 4:
                if (!(i < addresses.length)) {
                  _context2.next = 25;
                  break;
                }

                connection = _connectionChannel["default"].create(addresses[i], this._config, this._createConnectionErrorHandler(), this._log);
                _context2.prev = 6;
                _context2.next = 9;
                return connection._negotiateProtocol();

              case 9:
                protocol = connection.protocol();

                if (!protocol) {
                  _context2.next = 12;
                  break;
                }

                return _context2.abrupt("return", protocol.version >= _constants.BOLT_PROTOCOL_V4);

              case 12:
                return _context2.abrupt("return", false);

              case 15:
                _context2.prev = 15;
                _context2.t0 = _context2["catch"](6);
                lastError = _context2.t0;

              case 18:
                _context2.prev = 18;
                _context2.next = 21;
                return connection.close();

              case 21:
                return _context2.finish(18);

              case 22:
                i++;
                _context2.next = 4;
                break;

              case 25:
                if (!lastError) {
                  _context2.next = 27;
                  break;
                }

                throw lastError;

              case 27:
                return _context2.abrupt("return", false);

              case 28:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this, [[6, 15, 18, 22]]);
      }));

      function supportsMultiDb() {
        return _supportsMultiDb.apply(this, arguments);
      }

      return supportsMultiDb;
    }()
  }, {
    key: "forget",
    value: function forget(address, database) {
      if (database || database === '') {
        this._routingTables[database].forget(address);
      } else {
        Object.values(this._routingTables).forEach(function (routingTable) {
          return routingTable.forget(address);
        });
      } // We're firing and forgetting this operation explicitly and listening for any
      // errors to avoid unhandled promise rejection


      this._connectionPool.purge(address)["catch"](function () {});
    }
  }, {
    key: "forgetWriter",
    value: function forgetWriter(address, database) {
      if (database || database === '') {
        this._routingTables[database].forgetWriter(address);
      } else {
        Object.values(this._routingTables).forEach(function (routingTable) {
          return routingTable.forgetWriter(address);
        });
      }
    }
  }, {
    key: "_acquireConnectionToServer",
    value: function _acquireConnectionToServer(address, serverName, routingTable) {
      return this._connectionPool.acquire(address);
    }
  }, {
    key: "_freshRoutingTable",
    value: function _freshRoutingTable() {
      var _ref3 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          accessMode = _ref3.accessMode,
          database = _ref3.database,
          bookmark = _ref3.bookmark;

      var currentRoutingTable = this._routingTables[database] || new _routingTable["default"]({
        database: database
      });

      if (!currentRoutingTable.isStaleFor(accessMode)) {
        return currentRoutingTable;
      }

      this._log.info("Routing table is stale for database: \"".concat(database, "\" and access mode: \"").concat(accessMode, "\": ").concat(currentRoutingTable));

      return this._refreshRoutingTable(currentRoutingTable, bookmark);
    }
  }, {
    key: "_refreshRoutingTable",
    value: function _refreshRoutingTable(currentRoutingTable, bookmark) {
      var knownRouters = currentRoutingTable.routers;

      if (this._useSeedRouter) {
        return this._fetchRoutingTableFromSeedRouterFallbackToKnownRouters(knownRouters, currentRoutingTable, bookmark);
      }

      return this._fetchRoutingTableFromKnownRoutersFallbackToSeedRouter(knownRouters, currentRoutingTable, bookmark);
    }
  }, {
    key: "_fetchRoutingTableFromSeedRouterFallbackToKnownRouters",
    value: function () {
      var _fetchRoutingTableFromSeedRouterFallbackToKnownRouters2 = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee3(knownRouters, currentRoutingTable, bookmark) {
        var seenRouters, newRoutingTable;
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                // we start with seed router, no routers were probed before
                seenRouters = [];
                _context3.next = 3;
                return this._fetchRoutingTableUsingSeedRouter(seenRouters, this._seedRouter, currentRoutingTable, bookmark);

              case 3:
                newRoutingTable = _context3.sent;

                if (!newRoutingTable) {
                  _context3.next = 8;
                  break;
                }

                this._useSeedRouter = false;
                _context3.next = 11;
                break;

              case 8:
                _context3.next = 10;
                return this._fetchRoutingTableUsingKnownRouters(knownRouters, currentRoutingTable, bookmark);

              case 10:
                newRoutingTable = _context3.sent;

              case 11:
                _context3.next = 13;
                return this._applyRoutingTableIfPossible(currentRoutingTable, newRoutingTable);

              case 13:
                return _context3.abrupt("return", _context3.sent);

              case 14:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function _fetchRoutingTableFromSeedRouterFallbackToKnownRouters(_x, _x2, _x3) {
        return _fetchRoutingTableFromSeedRouterFallbackToKnownRouters2.apply(this, arguments);
      }

      return _fetchRoutingTableFromSeedRouterFallbackToKnownRouters;
    }()
  }, {
    key: "_fetchRoutingTableFromKnownRoutersFallbackToSeedRouter",
    value: function () {
      var _fetchRoutingTableFromKnownRoutersFallbackToSeedRouter2 = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee4(knownRouters, currentRoutingTable, bookmark) {
        var newRoutingTable;
        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return this._fetchRoutingTableUsingKnownRouters(knownRouters, currentRoutingTable, bookmark);

              case 2:
                newRoutingTable = _context4.sent;

                if (newRoutingTable) {
                  _context4.next = 7;
                  break;
                }

                _context4.next = 6;
                return this._fetchRoutingTableUsingSeedRouter(knownRouters, this._seedRouter, currentRoutingTable, bookmark);

              case 6:
                newRoutingTable = _context4.sent;

              case 7:
                _context4.next = 9;
                return this._applyRoutingTableIfPossible(currentRoutingTable, newRoutingTable);

              case 9:
                return _context4.abrupt("return", _context4.sent);

              case 10:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function _fetchRoutingTableFromKnownRoutersFallbackToSeedRouter(_x4, _x5, _x6) {
        return _fetchRoutingTableFromKnownRoutersFallbackToSeedRouter2.apply(this, arguments);
      }

      return _fetchRoutingTableFromKnownRoutersFallbackToSeedRouter;
    }()
  }, {
    key: "_fetchRoutingTableUsingKnownRouters",
    value: function () {
      var _fetchRoutingTableUsingKnownRouters2 = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee5(knownRouters, currentRoutingTable, bookmark) {
        var newRoutingTable, lastRouterIndex;
        return _regenerator["default"].wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _context5.next = 2;
                return this._fetchRoutingTable(knownRouters, currentRoutingTable, bookmark);

              case 2:
                newRoutingTable = _context5.sent;

                if (!newRoutingTable) {
                  _context5.next = 5;
                  break;
                }

                return _context5.abrupt("return", newRoutingTable);

              case 5:
                // returned routing table was undefined, this means a connection error happened and the last known
                // router did not return a valid routing table, so we need to forget it
                lastRouterIndex = knownRouters.length - 1;

                RoutingConnectionProvider._forgetRouter(currentRoutingTable, knownRouters, lastRouterIndex);

                return _context5.abrupt("return", null);

              case 8:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function _fetchRoutingTableUsingKnownRouters(_x7, _x8, _x9) {
        return _fetchRoutingTableUsingKnownRouters2.apply(this, arguments);
      }

      return _fetchRoutingTableUsingKnownRouters;
    }()
  }, {
    key: "_fetchRoutingTableUsingSeedRouter",
    value: function () {
      var _fetchRoutingTableUsingSeedRouter2 = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee6(seenRouters, seedRouter, routingTable, bookmark) {
        var resolvedAddresses, newAddresses;
        return _regenerator["default"].wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                _context6.next = 2;
                return this._resolveSeedRouter(seedRouter);

              case 2:
                resolvedAddresses = _context6.sent;
                // filter out all addresses that we've already tried
                newAddresses = resolvedAddresses.filter(function (address) {
                  return seenRouters.indexOf(address) < 0;
                });
                _context6.next = 6;
                return this._fetchRoutingTable(newAddresses, routingTable, bookmark);

              case 6:
                return _context6.abrupt("return", _context6.sent);

              case 7:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function _fetchRoutingTableUsingSeedRouter(_x10, _x11, _x12, _x13) {
        return _fetchRoutingTableUsingSeedRouter2.apply(this, arguments);
      }

      return _fetchRoutingTableUsingSeedRouter;
    }()
  }, {
    key: "_resolveSeedRouter",
    value: function () {
      var _resolveSeedRouter2 = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee7(seedRouter) {
        var _this3 = this;

        var resolvedAddresses, dnsResolvedAddresses;
        return _regenerator["default"].wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                _context7.next = 2;
                return this._hostNameResolver.resolve(seedRouter);

              case 2:
                resolvedAddresses = _context7.sent;
                _context7.next = 5;
                return Promise.all(resolvedAddresses.map(function (address) {
                  return _this3._dnsResolver.resolve(address);
                }));

              case 5:
                dnsResolvedAddresses = _context7.sent;
                return _context7.abrupt("return", [].concat.apply([], dnsResolvedAddresses));

              case 7:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function _resolveSeedRouter(_x14) {
        return _resolveSeedRouter2.apply(this, arguments);
      }

      return _resolveSeedRouter;
    }()
  }, {
    key: "_fetchRoutingTable",
    value: function _fetchRoutingTable(routerAddresses, routingTable, bookmark) {
      var _this4 = this;

      return routerAddresses.reduce(
      /*#__PURE__*/
      function () {
        var _ref4 = (0, _asyncToGenerator2["default"])(
        /*#__PURE__*/
        _regenerator["default"].mark(function _callee8(refreshedTablePromise, currentRouter, currentIndex) {
          var newRoutingTable, previousRouterIndex, session;
          return _regenerator["default"].wrap(function _callee8$(_context8) {
            while (1) {
              switch (_context8.prev = _context8.next) {
                case 0:
                  _context8.next = 2;
                  return refreshedTablePromise;

                case 2:
                  newRoutingTable = _context8.sent;

                  if (!newRoutingTable) {
                    _context8.next = 7;
                    break;
                  }

                  return _context8.abrupt("return", newRoutingTable);

                case 7:
                  // returned routing table was undefined, this means a connection error happened and we need to forget the
                  // previous router and try the next one
                  previousRouterIndex = currentIndex - 1;

                  RoutingConnectionProvider._forgetRouter(routingTable, routerAddresses, previousRouterIndex);

                case 9:
                  _context8.next = 11;
                  return _this4._createSessionForRediscovery(currentRouter, bookmark);

                case 11:
                  session = _context8.sent;

                  if (!session) {
                    _context8.next = 27;
                    break;
                  }

                  _context8.prev = 13;
                  _context8.next = 16;
                  return _this4._rediscovery.lookupRoutingTableOnRouter(session, routingTable.database, currentRouter);

                case 16:
                  return _context8.abrupt("return", _context8.sent);

                case 19:
                  _context8.prev = 19;
                  _context8.t0 = _context8["catch"](13);

                  if (!(_context8.t0 && _context8.t0.code === DATABASE_NOT_FOUND_ERROR_CODE)) {
                    _context8.next = 23;
                    break;
                  }

                  throw _context8.t0;

                case 23:
                  _this4._log.warn("unable to fetch routing table because of an error ".concat(_context8.t0));

                  return _context8.abrupt("return", null);

                case 25:
                  _context8.next = 28;
                  break;

                case 27:
                  return _context8.abrupt("return", null);

                case 28:
                case "end":
                  return _context8.stop();
              }
            }
          }, _callee8, null, [[13, 19]]);
        }));

        return function (_x15, _x16, _x17) {
          return _ref4.apply(this, arguments);
        };
      }(), Promise.resolve(null));
    }
  }, {
    key: "_createSessionForRediscovery",
    value: function () {
      var _createSessionForRediscovery2 = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee9(routerAddress, bookmark) {
        var connection, connectionProvider, version;
        return _regenerator["default"].wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                _context9.prev = 0;
                _context9.next = 3;
                return this._connectionPool.acquire(routerAddress);

              case 3:
                connection = _context9.sent;
                connectionProvider = new _connectionProviderSingle["default"](connection);
                version = _serverVersion.ServerVersion.fromString(connection.version);

                if (!(version.compareTo(_serverVersion.VERSION_4_0_0) < 0)) {
                  _context9.next = 8;
                  break;
                }

                return _context9.abrupt("return", new _session["default"]({
                  mode: _driver.WRITE,
                  bookmark: _bookmark["default"].empty(),
                  connectionProvider: connectionProvider
                }));

              case 8:
                return _context9.abrupt("return", new _session["default"]({
                  mode: _driver.READ,
                  database: SYSTEM_DB_NAME,
                  bookmark: bookmark,
                  connectionProvider: connectionProvider
                }));

              case 11:
                _context9.prev = 11;
                _context9.t0 = _context9["catch"](0);

                if (!(_context9.t0 && _context9.t0.code === UNAUTHORIZED_ERROR_CODE)) {
                  _context9.next = 15;
                  break;
                }

                throw _context9.t0;

              case 15:
                return _context9.abrupt("return", null);

              case 16:
              case "end":
                return _context9.stop();
            }
          }
        }, _callee9, this, [[0, 11]]);
      }));

      function _createSessionForRediscovery(_x18, _x19) {
        return _createSessionForRediscovery2.apply(this, arguments);
      }

      return _createSessionForRediscovery;
    }()
  }, {
    key: "_applyRoutingTableIfPossible",
    value: function () {
      var _applyRoutingTableIfPossible2 = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee10(currentRoutingTable, newRoutingTable) {
        return _regenerator["default"].wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                if (newRoutingTable) {
                  _context10.next = 2;
                  break;
                }

                throw (0, _error.newError)("Could not perform discovery. No routing servers available. Known routing table: ".concat(currentRoutingTable), _error.SERVICE_UNAVAILABLE);

              case 2:
                if (newRoutingTable.writers.length === 0) {
                  // use seed router next time. this is important when cluster is partitioned. it tries to make sure driver
                  // does not always get routing table without writers because it talks exclusively to a minority partition
                  this._useSeedRouter = true;
                }

                _context10.next = 5;
                return this._updateRoutingTable(newRoutingTable);

              case 5:
                return _context10.abrupt("return", newRoutingTable);

              case 6:
              case "end":
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function _applyRoutingTableIfPossible(_x20, _x21) {
        return _applyRoutingTableIfPossible2.apply(this, arguments);
      }

      return _applyRoutingTableIfPossible;
    }()
  }, {
    key: "_updateRoutingTable",
    value: function () {
      var _updateRoutingTable2 = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee11(newRoutingTable) {
        var _this5 = this;

        return _regenerator["default"].wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                _context11.next = 2;
                return this._connectionPool.keepAll(newRoutingTable.allServers());

              case 2:
                // filter out expired to purge (expired for a pre-configured amount of time) routing table entries
                Object.values(this._routingTables).forEach(function (value) {
                  if (value.isExpiredFor(_this5._routingTablePurgeDelay)) {
                    delete _this5._routingTables[value.database];
                  }
                }); // make this driver instance aware of the new table

                this._routingTables[newRoutingTable.database] = newRoutingTable;

                this._log.info("Updated routing table ".concat(newRoutingTable));

              case 5:
              case "end":
                return _context11.stop();
            }
          }
        }, _callee11, this);
      }));

      function _updateRoutingTable(_x22) {
        return _updateRoutingTable2.apply(this, arguments);
      }

      return _updateRoutingTable;
    }()
  }], [{
    key: "_forgetRouter",
    value: function _forgetRouter(routingTable, routersArray, routerIndex) {
      var address = routersArray[routerIndex];

      if (routingTable && address) {
        routingTable.forgetRouter(address);
      }
    }
  }]);
  return RoutingConnectionProvider;
}(_connectionProviderPooled["default"]);

exports["default"] = RoutingConnectionProvider;