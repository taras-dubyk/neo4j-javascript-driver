"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.WRITE = exports.READ = exports.Driver = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _error = require("./error");

var _connectionProvider = _interopRequireDefault(require("./internal/connection-provider"));

var _bookmark = _interopRequireDefault(require("./internal/bookmark"));

var _connectionProviderDirect = _interopRequireDefault(require("./internal/connection-provider-direct"));

var _connectivityVerifier = _interopRequireDefault(require("./internal/connectivity-verifier"));

var _constants = require("./internal/constants");

var _logger = _interopRequireDefault(require("./internal/logger"));

var _poolConfig = require("./internal/pool-config");

var _session = _interopRequireDefault(require("./session"));

var _sessionRx = _interopRequireDefault(require("./session-rx"));

var _requestMessage = require("./internal/request-message");

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
var DEFAULT_MAX_CONNECTION_LIFETIME = 60 * 60 * 1000; // 1 hour

/**
 * The default record fetch size. This is used in Bolt V4 protocol to pull query execution result in batches.
 * @type {number}
 */

var DEFAULT_FETCH_SIZE = 1000;
/**
 * Constant that represents read session access mode.
 * Should be used like this: `driver.session({ defaultAccessMode: neo4j.session.READ })`.
 * @type {string}
 */

var READ = _constants.ACCESS_MODE_READ;
/**
 * Constant that represents write session access mode.
 * Should be used like this: `driver.session({ defaultAccessMode: neo4j.session.WRITE })`.
 * @type {string}
 */

exports.READ = READ;
var WRITE = _constants.ACCESS_MODE_WRITE;
exports.WRITE = WRITE;
var idGenerator = 0;
/**
 * A driver maintains one or more {@link Session}s with a remote
 * Neo4j instance. Through the {@link Session}s you can send queries
 * and retrieve results from the database.
 *
 * Drivers are reasonably expensive to create - you should strive to keep one
 * driver instance around per Neo4j Instance you connect to.
 *
 * @access public
 */

var Driver =
/*#__PURE__*/
function () {
  /**
   * You should not be calling this directly, instead use {@link driver}.
   * @constructor
   * @protected
   * @param {ServerAddress} address
   * @param {string} userAgent
   * @param {Object} authToken
   * @param {Object} config
   */
  function Driver(address, userAgent) {
    var authToken = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var config = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    (0, _classCallCheck2["default"])(this, Driver);
    sanitizeConfig(config);
    this._id = idGenerator++;
    this._address = address;
    this._userAgent = userAgent;
    this._authToken = authToken;
    this._config = config;
    this._log = _logger["default"].create(config);
    /**
     * Reference to the connection provider. Initialized lazily by {@link _getOrCreateConnectionProvider}.
     * @type {ConnectionProvider}
     * @protected
     */

    this._connectionProvider = null;

    this._afterConstruction();
  }
  /**
   * Verifies connectivity of this driver by trying to open a connection with the provided driver options.
   *
   * @public
   * @param {Object} param - The object parameter
   * @param {string} param.database - The target database to verify connectivity for.
   * @returns {Promise} promise resolved with server info or rejected with error.
   */


  (0, _createClass2["default"])(Driver, [{
    key: "verifyConnectivity",
    value: function verifyConnectivity() {
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          _ref$database = _ref.database,
          database = _ref$database === void 0 ? '' : _ref$database;

      var connectionProvider = this._getOrCreateConnectionProvider();

      var connectivityVerifier = new _connectivityVerifier["default"](connectionProvider);
      return connectivityVerifier.verify({
        database: database
      });
    }
    /**
     * Returns whether the server supports multi database capabilities based on the protocol
     * version negotiated via handshake.
     *
     * Note that this function call _always_ causes a round-trip to the server.
     *
     * @returns {Promise<boolean>} promise resolved with a boolean or rejected with error.
     */

  }, {
    key: "supportsMultiDb",
    value: function supportsMultiDb() {
      var connectionProvider = this._getOrCreateConnectionProvider();

      return connectionProvider.supportsMultiDb();
    }
    /**
     * Acquire a session to communicate with the database. The session will
     * borrow connections from the underlying connection pool as required and
     * should be considered lightweight and disposable.
     *
     * This comes with some responsibility - make sure you always call
     * {@link close} when you are done using a session, and likewise,
     * make sure you don't close your session before you are done using it. Once
     * it is closed, the underlying connection will be released to the connection
     * pool and made available for others to use.
     *
     * @public
     * @param {Object} param - The object parameter
     * @param {string} param.defaultAccessMode=WRITE - The access mode of this session, allowed values are {@link READ} and {@link WRITE}.
     * @param {string|string[]} param.bookmarks - The initial reference or references to some previous
     * transactions. Value is optional and absence indicates that that the bookmarks do not exist or are unknown.
     * @param {number} param.fetchSize - The record fetch size of each batch of this session.
     * Use {@link ALL} to always pull all records in one batch. This will override the config value set on driver config.
     * @param {string} param.database - The database this session will operate on.
     * @return {Session} new session.
     */

  }, {
    key: "session",
    value: function session() {
      var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          _ref2$defaultAccessMo = _ref2.defaultAccessMode,
          defaultAccessMode = _ref2$defaultAccessMo === void 0 ? WRITE : _ref2$defaultAccessMo,
          bookmarkOrBookmarks = _ref2.bookmarks,
          _ref2$database = _ref2.database,
          database = _ref2$database === void 0 ? '' : _ref2$database,
          fetchSize = _ref2.fetchSize;

      return this._newSession({
        defaultAccessMode: defaultAccessMode,
        bookmarkOrBookmarks: bookmarkOrBookmarks,
        database: database,
        reactive: false,
        fetchSize: validateFetchSizeValue(fetchSize, this._config.fetchSize)
      });
    }
    /**
     * Acquire a reactive session to communicate with the database. The session will
     * borrow connections from the underlying connection pool as required and
     * should be considered lightweight and disposable.
     *
     * This comes with some responsibility - make sure you always call
     * {@link close} when you are done using a session, and likewise,
     * make sure you don't close your session before you are done using it. Once
     * it is closed, the underlying connection will be released to the connection
     * pool and made available for others to use.
     *
     * @public
     * @param {Object} param
     * @param {string} param.defaultAccessMode=WRITE - The access mode of this session, allowed values are {@link READ} and {@link WRITE}.
     * @param {string|string[]} param.bookmarks - The initial reference or references to some previous transactions. Value is optional and
     * absence indicates that the bookmarks do not exist or are unknown.
     * @param {string} param.database - The database this session will operate on.
     * @returns {RxSession} new reactive session.
     */

  }, {
    key: "rxSession",
    value: function rxSession() {
      var _ref3 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          _ref3$defaultAccessMo = _ref3.defaultAccessMode,
          defaultAccessMode = _ref3$defaultAccessMo === void 0 ? WRITE : _ref3$defaultAccessMo,
          bookmarks = _ref3.bookmarks,
          _ref3$database = _ref3.database,
          database = _ref3$database === void 0 ? '' : _ref3$database,
          fetchSize = _ref3.fetchSize;

      return new _sessionRx["default"]({
        session: this._newSession({
          defaultAccessMode: defaultAccessMode,
          bookmarks: bookmarks,
          database: database,
          reactive: true,
          fetchSize: validateFetchSizeValue(fetchSize, this._config.fetchSize)
        }),
        config: this._config
      });
    }
    /**
     * Close all open sessions and other associated resources. You should
     * make sure to use this when you are done with this driver instance.
     * @public
     */

  }, {
    key: "close",
    value: function close() {
      this._log.info("Driver ".concat(this._id, " closing"));

      if (this._connectionProvider) {
        return this._connectionProvider.close();
      }

      return Promise.resolve();
    }
    /**
     * @protected
     */

  }, {
    key: "_afterConstruction",
    value: function _afterConstruction() {
      this._log.info("Direct driver ".concat(this._id, " created for server address ").concat(this._address));
    }
    /**
     * @protected
     */

  }, {
    key: "_createConnectionProvider",
    value: function _createConnectionProvider(address, userAgent, authToken) {
      return new _connectionProviderDirect["default"]({
        id: this._id,
        config: this._config,
        log: this._log,
        address: address,
        userAgent: userAgent,
        authToken: authToken
      });
    }
    /**
     * @protected
     */

  }, {
    key: "_newSession",

    /**
     * @private
     */
    value: function _newSession(_ref4) {
      var defaultAccessMode = _ref4.defaultAccessMode,
          bookmarkOrBookmarks = _ref4.bookmarkOrBookmarks,
          database = _ref4.database,
          reactive = _ref4.reactive,
          fetchSize = _ref4.fetchSize;

      var sessionMode = Driver._validateSessionMode(defaultAccessMode);

      var connectionProvider = this._getOrCreateConnectionProvider();

      var bookmark = bookmarkOrBookmarks ? new _bookmark["default"](bookmarkOrBookmarks) : _bookmark["default"].empty();
      return new _session["default"]({
        mode: sessionMode,
        database: database,
        connectionProvider: connectionProvider,
        bookmark: bookmark,
        config: this._config,
        reactive: reactive,
        fetchSize: fetchSize
      });
    }
    /**
     * @private
     */

  }, {
    key: "_getOrCreateConnectionProvider",
    value: function _getOrCreateConnectionProvider() {
      if (!this._connectionProvider) {
        this._connectionProvider = this._createConnectionProvider(this._address, this._userAgent, this._authToken);
      }

      return this._connectionProvider;
    }
  }], [{
    key: "_validateSessionMode",
    value: function _validateSessionMode(rawMode) {
      var mode = rawMode || WRITE;

      if (mode !== _constants.ACCESS_MODE_READ && mode !== _constants.ACCESS_MODE_WRITE) {
        throw (0, _error.newError)('Illegal session mode ' + mode);
      }

      return mode;
    }
  }]);
  return Driver;
}();
/**
 * @private
 */


exports.Driver = Driver;

function sanitizeConfig(config) {
  config.maxConnectionLifetime = sanitizeIntValue(config.maxConnectionLifetime, DEFAULT_MAX_CONNECTION_LIFETIME);
  config.maxConnectionPoolSize = sanitizeIntValue(config.maxConnectionPoolSize, _poolConfig.DEFAULT_MAX_SIZE);
  config.connectionAcquisitionTimeout = sanitizeIntValue(config.connectionAcquisitionTimeout, _poolConfig.DEFAULT_ACQUISITION_TIMEOUT);
  config.fetchSize = validateFetchSizeValue(config.fetchSize, DEFAULT_FETCH_SIZE);
}
/**
 * @private
 */


function sanitizeIntValue(rawValue, defaultWhenAbsent) {
  var sanitizedValue = parseInt(rawValue, 10);

  if (sanitizedValue > 0 || sanitizedValue === 0) {
    return sanitizedValue;
  } else if (sanitizedValue < 0) {
    return Number.MAX_SAFE_INTEGER;
  } else {
    return defaultWhenAbsent;
  }
}
/**
 * @private
 */


function validateFetchSizeValue(rawValue, defaultWhenAbsent) {
  var fetchSize = parseInt(rawValue, 10);

  if (fetchSize > 0 || fetchSize === _requestMessage.ALL) {
    return fetchSize;
  } else if (fetchSize === 0 || fetchSize < 0) {
    throw new Error('The fetch size can only be a positive value or -1 for ALL. However fetchSize = ' + fetchSize);
  } else {
    return defaultWhenAbsent;
  }
}

var _default = Driver;
exports["default"] = _default;