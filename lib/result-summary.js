"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.queryType = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _integer = require("./integer");

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
 * A ResultSummary instance contains structured metadata for a {@link Result}.
 * @access public
 */
var ResultSummary =
/*#__PURE__*/
function () {
  /**
   * @constructor
   * @param {string} query - The query this summary is for
   * @param {Object} parameters - Parameters for the query
   * @param {Object} metadata - Query metadata
   */
  function ResultSummary(query, parameters, metadata) {
    (0, _classCallCheck2["default"])(this, ResultSummary);

    /**
     * The query and parameters this summary is for.
     * @type {{text: string, parameters: Object}}
     * @public
     */
    this.query = {
      text: query,
      parameters: parameters
      /**
       * The type of query executed. Can be "r" for read-only query, "rw" for read-write query,
       * "w" for write-only query and "s" for schema-write query.
       * String constants are available in {@link queryType} object.
       * @type {string}
       * @public
       */

    };
    this.queryType = metadata.type;
    /**
     * Counters for operations the query triggered.
     * @type {QueryStatistics}
     * @public
     */

    this.counters = new QueryStatistics(metadata.stats || {}); // for backwards compatibility, remove in future version

    this.updateStatistics = this.counters;
    /**
     * This describes how the database will execute the query.
     * Query plan for the executed query if available, otherwise undefined.
     * Will only be populated for queries that start with "EXPLAIN".
     * @type {Plan}
     */

    this.plan = metadata.plan || metadata.profile ? new Plan(metadata.plan || metadata.profile) : false;
    /**
     * This describes how the database did execute your query. This will contain detailed information about what
     * each step of the plan did. Profiled query plan for the executed query if available, otherwise undefined.
     * Will only be populated for queries that start with "PROFILE".
     * @type {ProfiledPlan}
     * @public
     */

    this.profile = metadata.profile ? new ProfiledPlan(metadata.profile) : false;
    /**
     * An array of notifications that might arise when executing the query. Notifications can be warnings about
     * problematic queries or other valuable information that can be presented in a client. Unlike failures
     * or errors, notifications do not affect the execution of a query.
     * @type {Array<Notification>}
     * @public
     */

    this.notifications = this._buildNotifications(metadata.notifications);
    /**
     * The basic information of the server where the result is obtained from.
     * @type {ServerInfo}
     * @public
     */

    this.server = new ServerInfo(metadata.server);
    /**
     * The time it took the server to consume the result.
     * @type {number}
     * @public
     */

    this.resultConsumedAfter = metadata.result_consumed_after;
    /**
     * The time it took the server to make the result available for consumption in milliseconds.
     * @type {number}
     * @public
     */

    this.resultAvailableAfter = metadata.result_available_after;
    /**
     * The database name where this summary is obtained from.
     * @type {{name: string}}
     * @public
     */

    this.database = {
      name: metadata.db || null
    };
  }

  (0, _createClass2["default"])(ResultSummary, [{
    key: "_buildNotifications",
    value: function _buildNotifications(notifications) {
      if (!notifications) {
        return [];
      }

      return notifications.map(function (n) {
        return new Notification(n);
      });
    }
    /**
     * Check if the result summary has a plan
     * @return {boolean}
     */

  }, {
    key: "hasPlan",
    value: function hasPlan() {
      return this.plan instanceof Plan;
    }
    /**
     * Check if the result summary has a profile
     * @return {boolean}
     */

  }, {
    key: "hasProfile",
    value: function hasProfile() {
      return this.profile instanceof ProfiledPlan;
    }
  }]);
  return ResultSummary;
}();
/**
 * Class for execution plan received by prepending Cypher with EXPLAIN.
 * @access public
 */


var Plan =
/**
 * Create a Plan instance
 * @constructor
 * @param {Object} plan - Object with plan data
 */
function Plan(plan) {
  (0, _classCallCheck2["default"])(this, Plan);
  this.operatorType = plan.operatorType;
  this.identifiers = plan.identifiers;
  this.arguments = plan.args;
  this.children = plan.children ? plan.children.map(function (child) {
    return new Plan(child);
  }) : [];
};
/**
 * Class for execution plan received by prepending Cypher with PROFILE.
 * @access public
 */


var ProfiledPlan =
/*#__PURE__*/
function () {
  /**
   * Create a ProfiledPlan instance
   * @constructor
   * @param {Object} profile - Object with profile data
   */
  function ProfiledPlan(profile) {
    (0, _classCallCheck2["default"])(this, ProfiledPlan);
    this.operatorType = profile.operatorType;
    this.identifiers = profile.identifiers;
    this.arguments = profile.args;
    this.dbHits = valueOrDefault('dbHits', profile);
    this.rows = valueOrDefault('rows', profile);
    this.pageCacheMisses = valueOrDefault('pageCacheMisses', profile);
    this.pageCacheHits = valueOrDefault('pageCacheHits', profile);
    this.pageCacheHitRatio = valueOrDefault('pageCacheHitRatio', profile);
    this.time = valueOrDefault('time', profile);
    this.children = profile.children ? profile.children.map(function (child) {
      return new ProfiledPlan(child);
    }) : [];
  }

  (0, _createClass2["default"])(ProfiledPlan, [{
    key: "hasPageCacheStats",
    value: function hasPageCacheStats() {
      return this.pageCacheMisses > 0 || this.pageCacheHits > 0 || this.pageCacheHitRatio > 0;
    }
  }]);
  return ProfiledPlan;
}();
/**
 * Get statistical information for a {@link Result}.
 * @access public
 */


var QueryStatistics =
/*#__PURE__*/
function () {
  /**
   * Structurize the statistics
   * @constructor
   * @param {Object} statistics - Result statistics
   */
  function QueryStatistics(statistics) {
    var _this = this;

    (0, _classCallCheck2["default"])(this, QueryStatistics);
    this._stats = {
      nodesCreated: 0,
      nodesDeleted: 0,
      relationshipsCreated: 0,
      relationshipsDeleted: 0,
      propertiesSet: 0,
      labelsAdded: 0,
      labelsRemoved: 0,
      indexesAdded: 0,
      indexesRemoved: 0,
      constraintsAdded: 0,
      constraintsRemoved: 0
    };
    this._systemUpdates = 0;
    Object.keys(statistics).forEach(function (index) {
      // To camelCase
      var camelCaseIndex = index.replace(/(-\w)/g, function (m) {
        return m[1].toUpperCase();
      });

      if (camelCaseIndex in _this._stats) {
        _this._stats[camelCaseIndex] = intValue(statistics[index]);
      } else if (camelCaseIndex === 'systemUpdates') {
        _this._systemUpdates = intValue(statistics[index]);
      }
    });
    this._stats = Object.freeze(this._stats);
  }
  /**
   * Did the database get updated?
   * @return {boolean}
   */


  (0, _createClass2["default"])(QueryStatistics, [{
    key: "containsUpdates",
    value: function containsUpdates() {
      var _this2 = this;

      return Object.keys(this._stats).reduce(function (last, current) {
        return last + _this2._stats[current];
      }, 0) > 0;
    }
    /**
     * Returns the query statistics updates in a dictionary.
     * @returns {*}
     */

  }, {
    key: "updates",
    value: function updates() {
      return this._stats;
    }
    /**
     * Return true if the system database get updated, otherwise false
     * @returns {boolean} - If the system database get updated or not.
     */

  }, {
    key: "containsSystemUpdates",
    value: function containsSystemUpdates() {
      return this._systemUpdates > 0;
    }
    /**
     * @returns {number} - Number of system updates
     */

  }, {
    key: "systemUpdates",
    value: function systemUpdates() {
      return this._systemUpdates;
    }
  }]);
  return QueryStatistics;
}();
/**
 * Class for Cypher notifications
 * @access public
 */


var Notification =
/*#__PURE__*/
function () {
  /**
   * Create a Notification instance
   * @constructor
   * @param {Object} notification - Object with notification data
   */
  function Notification(notification) {
    (0, _classCallCheck2["default"])(this, Notification);
    this.code = notification.code;
    this.title = notification.title;
    this.description = notification.description;
    this.severity = notification.severity;
    this.position = Notification._constructPosition(notification.position);
  }

  (0, _createClass2["default"])(Notification, null, [{
    key: "_constructPosition",
    value: function _constructPosition(pos) {
      if (!pos) {
        return {};
      }

      return {
        offset: intValue(pos.offset),
        line: intValue(pos.line),
        column: intValue(pos.column)
      };
    }
  }]);
  return Notification;
}();
/**
 * Class for exposing server info from a result.
 * @access public
 */


var ServerInfo =
/**
 * Create a ServerInfo instance
 * @constructor
 * @param {Object} serverMeta - Object with serverMeta data
 */
function ServerInfo(serverMeta) {
  (0, _classCallCheck2["default"])(this, ServerInfo);

  if (serverMeta) {
    this.address = serverMeta.address;
    this.version = serverMeta.version;
  }
};

function intValue(value) {
  return (0, _integer.isInt)(value) ? value.toInt() : value;
}

function valueOrDefault(key, values) {
  var defaultValue = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

  if (key in values) {
    var value = values[key];
    return (0, _integer.isInt)(value) ? value.toInt() : value;
  } else {
    return defaultValue;
  }
}

var queryType = {
  READ_ONLY: 'r',
  READ_WRITE: 'rw',
  WRITE_ONLY: 'w',
  SCHEMA_WRITE: 's'
};
exports.queryType = queryType;
var _default = ResultSummary;
exports["default"] = _default;