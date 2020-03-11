"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isDuration = isDuration;
exports.isLocalTime = isLocalTime;
exports.isTime = isTime;
exports.isDate = isDate;
exports.isLocalDateTime = isLocalDateTime;
exports.isDateTime = isDateTime;
exports.DateTime = exports.LocalDateTime = exports.Date = exports.Time = exports.LocalTime = exports.Duration = void 0;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var util = _interopRequireWildcard(require("./internal/temporal-util"));

var _util = require("./internal/util");

var _error = require("./error");

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
var IDENTIFIER_PROPERTY_ATTRIBUTES = {
  value: true,
  enumerable: false,
  configurable: false,
  writable: false
};
var DURATION_IDENTIFIER_PROPERTY = '__isDuration__';
var LOCAL_TIME_IDENTIFIER_PROPERTY = '__isLocalTime__';
var TIME_IDENTIFIER_PROPERTY = '__isTime__';
var DATE_IDENTIFIER_PROPERTY = '__isDate__';
var LOCAL_DATE_TIME_IDENTIFIER_PROPERTY = '__isLocalDateTime__';
var DATE_TIME_IDENTIFIER_PROPERTY = '__isDateTime__';
/**
 * Represents an ISO 8601 duration. Contains both date-based values (years, months, days) and time-based values (seconds, nanoseconds).
 * Created `Duration` objects are frozen with `Object.freeze()` in constructor and thus immutable.
 */

var Duration =
/*#__PURE__*/
function () {
  /**
   * @constructor
   * @param {Integer|number} months - The number of months for the new duration.
   * @param {Integer|number} days - The number of days for the new duration.
   * @param {Integer|number} seconds - The number of seconds for the new duration.
   * @param {Integer|number} nanoseconds - The number of nanoseconds for the new duration.
   */
  function Duration(months, days, seconds, nanoseconds) {
    (0, _classCallCheck2["default"])(this, Duration);

    /**
     * The number of months.
     * @type {Integer|number}
     */
    this.months = (0, _util.assertNumberOrInteger)(months, 'Months');
    /**
     * The number of days.
     * @type {Integer|number}
     */

    this.days = (0, _util.assertNumberOrInteger)(days, 'Days');
    (0, _util.assertNumberOrInteger)(seconds, 'Seconds');
    (0, _util.assertNumberOrInteger)(nanoseconds, 'Nanoseconds');
    /**
     * The number of seconds.
     * @type {Integer|number}
     */

    this.seconds = util.normalizeSecondsForDuration(seconds, nanoseconds);
    /**
     * The number of nanoseconds.
     * @type {Integer|number}
     */

    this.nanoseconds = util.normalizeNanosecondsForDuration(nanoseconds);
    Object.freeze(this);
  }
  /**
   * @ignore
   */


  (0, _createClass2["default"])(Duration, [{
    key: "toString",
    value: function toString() {
      return util.durationToIsoString(this.months, this.days, this.seconds, this.nanoseconds);
    }
  }]);
  return Duration;
}();

exports.Duration = Duration;
Object.defineProperty(Duration.prototype, DURATION_IDENTIFIER_PROPERTY, IDENTIFIER_PROPERTY_ATTRIBUTES);
/**
 * Test if given object is an instance of {@link Duration} class.
 * @param {Object} obj the object to test.
 * @return {boolean} `true` if given object is a {@link Duration}, `false` otherwise.
 */

function isDuration(obj) {
  return hasIdentifierProperty(obj, DURATION_IDENTIFIER_PROPERTY);
}
/**
 * Represents an instant capturing the time of day, but not the date, nor the timezone.
 * Created {@link LocalTime} objects are frozen with `Object.freeze()` in constructor and thus immutable.
 */


var LocalTime =
/*#__PURE__*/
function () {
  /**
   * @constructor
   * @param {Integer|number} hour - The hour for the new local time.
   * @param {Integer|number} minute - The minute for the new local time.
   * @param {Integer|number} second - The second for the new local time.
   * @param {Integer|number} nanosecond - The nanosecond for the new local time.
   */
  function LocalTime(hour, minute, second, nanosecond) {
    (0, _classCallCheck2["default"])(this, LocalTime);

    /**
     * The hour.
     * @type {Integer|number}
     */
    this.hour = util.assertValidHour(hour);
    /**
     * The minute.
     * @type {Integer|number}
     */

    this.minute = util.assertValidMinute(minute);
    /**
     * The second.
     * @type {Integer|number}
     */

    this.second = util.assertValidSecond(second);
    /**
     * The nanosecond.
     * @type {Integer|number}
     */

    this.nanosecond = util.assertValidNanosecond(nanosecond);
    Object.freeze(this);
  }
  /**
   * Create a {@link LocalTime} object from the given standard JavaScript `Date` and optional nanoseconds.
   * Year, month, day and time zone offset components of the given date are ignored.
   * @param {global.Date} standardDate - The standard JavaScript date to convert.
   * @param {Integer|number|undefined} nanosecond - The optional amount of nanoseconds.
   * @return {LocalTime} New LocalTime.
   */


  (0, _createClass2["default"])(LocalTime, [{
    key: "toString",

    /**
     * @ignore
     */
    value: function toString() {
      return util.timeToIsoString(this.hour, this.minute, this.second, this.nanosecond);
    }
  }], [{
    key: "fromStandardDate",
    value: function fromStandardDate(standardDate, nanosecond) {
      verifyStandardDateAndNanos(standardDate, nanosecond);
      return new LocalTime(standardDate.getHours(), standardDate.getMinutes(), standardDate.getSeconds(), util.totalNanoseconds(standardDate, nanosecond));
    }
  }]);
  return LocalTime;
}();

exports.LocalTime = LocalTime;
Object.defineProperty(LocalTime.prototype, LOCAL_TIME_IDENTIFIER_PROPERTY, IDENTIFIER_PROPERTY_ATTRIBUTES);
/**
 * Test if given object is an instance of {@link LocalTime} class.
 * @param {Object} obj the object to test.
 * @return {boolean} `true` if given object is a {@link LocalTime}, `false` otherwise.
 */

function isLocalTime(obj) {
  return hasIdentifierProperty(obj, LOCAL_TIME_IDENTIFIER_PROPERTY);
}
/**
 * Represents an instant capturing the time of day, and the timezone offset in seconds, but not the date.
 * Created {@link Time} objects are frozen with `Object.freeze()` in constructor and thus immutable.
 */


var Time =
/*#__PURE__*/
function () {
  /**
   * @constructor
   * @param {Integer|number} hour - The hour for the new local time.
   * @param {Integer|number} minute - The minute for the new local time.
   * @param {Integer|number} second - The second for the new local time.
   * @param {Integer|number} nanosecond - The nanosecond for the new local time.
   * @param {Integer|number} timeZoneOffsetSeconds - The time zone offset in seconds. Value represents the difference, in seconds, from UTC to local time.
   * This is different from standard JavaScript `Date.getTimezoneOffset()` which is the difference, in minutes, from local time to UTC.
   */
  function Time(hour, minute, second, nanosecond, timeZoneOffsetSeconds) {
    (0, _classCallCheck2["default"])(this, Time);

    /**
     * The hour.
     * @type {Integer|number}
     */
    this.hour = util.assertValidHour(hour);
    /**
     * The minute.
     * @type {Integer|number}
     */

    this.minute = util.assertValidMinute(minute);
    /**
     * The second.
     * @type {Integer|number}
     */

    this.second = util.assertValidSecond(second);
    /**
     * The nanosecond.
     * @type {Integer|number}
     */

    this.nanosecond = util.assertValidNanosecond(nanosecond);
    /**
     * The time zone offset in seconds.
     * @type {Integer|number}
     */

    this.timeZoneOffsetSeconds = (0, _util.assertNumberOrInteger)(timeZoneOffsetSeconds, 'Time zone offset in seconds');
    Object.freeze(this);
  }
  /**
   * Create a {@link Time} object from the given standard JavaScript `Date` and optional nanoseconds.
   * Year, month and day components of the given date are ignored.
   * @param {global.Date} standardDate - The standard JavaScript date to convert.
   * @param {Integer|number|undefined} nanosecond - The optional amount of nanoseconds.
   * @return {Time} New Time.
   */


  (0, _createClass2["default"])(Time, [{
    key: "toString",

    /**
     * @ignore
     */
    value: function toString() {
      return util.timeToIsoString(this.hour, this.minute, this.second, this.nanosecond) + util.timeZoneOffsetToIsoString(this.timeZoneOffsetSeconds);
    }
  }], [{
    key: "fromStandardDate",
    value: function fromStandardDate(standardDate, nanosecond) {
      verifyStandardDateAndNanos(standardDate, nanosecond);
      return new Time(standardDate.getHours(), standardDate.getMinutes(), standardDate.getSeconds(), util.totalNanoseconds(standardDate, nanosecond), util.timeZoneOffsetInSeconds(standardDate));
    }
  }]);
  return Time;
}();

exports.Time = Time;
Object.defineProperty(Time.prototype, TIME_IDENTIFIER_PROPERTY, IDENTIFIER_PROPERTY_ATTRIBUTES);
/**
 * Test if given object is an instance of {@link Time} class.
 * @param {Object} obj the object to test.
 * @return {boolean} `true` if given object is a {@link Time}, `false` otherwise.
 */

function isTime(obj) {
  return hasIdentifierProperty(obj, TIME_IDENTIFIER_PROPERTY);
}
/**
 * Represents an instant capturing the date, but not the time, nor the timezone.
 * Created {@link Date} objects are frozen with `Object.freeze()` in constructor and thus immutable.
 */


var Date =
/*#__PURE__*/
function () {
  /**
   * @constructor
   * @param {Integer|number} year - The year for the new local date.
   * @param {Integer|number} month - The month for the new local date.
   * @param {Integer|number} day - The day for the new local date.
   */
  function Date(year, month, day) {
    (0, _classCallCheck2["default"])(this, Date);

    /**
     * The year.
     * @type {Integer|number}
     */
    this.year = util.assertValidYear(year);
    /**
     * The month.
     * @type {Integer|number}
     */

    this.month = util.assertValidMonth(month);
    /**
     * The day.
     * @type {Integer|number}
     */

    this.day = util.assertValidDay(day);
    Object.freeze(this);
  }
  /**
   * Create a {@link Date} object from the given standard JavaScript `Date`.
   * Hour, minute, second, millisecond and time zone offset components of the given date are ignored.
   * @param {global.Date} standardDate - The standard JavaScript date to convert.
   * @return {Date} New Date.
   */


  (0, _createClass2["default"])(Date, [{
    key: "toString",

    /**
     * @ignore
     */
    value: function toString() {
      return util.dateToIsoString(this.year, this.month, this.day);
    }
  }], [{
    key: "fromStandardDate",
    value: function fromStandardDate(standardDate) {
      verifyStandardDateAndNanos(standardDate, null);
      return new Date(standardDate.getFullYear(), standardDate.getMonth() + 1, standardDate.getDate());
    }
  }]);
  return Date;
}();

exports.Date = Date;
Object.defineProperty(Date.prototype, DATE_IDENTIFIER_PROPERTY, IDENTIFIER_PROPERTY_ATTRIBUTES);
/**
 * Test if given object is an instance of {@link Date} class.
 * @param {Object} obj - The object to test.
 * @return {boolean} `true` if given object is a {@link Date}, `false` otherwise.
 */

function isDate(obj) {
  return hasIdentifierProperty(obj, DATE_IDENTIFIER_PROPERTY);
}
/**
 * Represents an instant capturing the date and the time, but not the timezone.
 * Created {@link LocalDateTime} objects are frozen with `Object.freeze()` in constructor and thus immutable.
 */


var LocalDateTime =
/*#__PURE__*/
function () {
  /**
   * @constructor
   * @param {Integer|number} year - The year for the new local date.
   * @param {Integer|number} month - The month for the new local date.
   * @param {Integer|number} day - The day for the new local date.
   * @param {Integer|number} hour - The hour for the new local time.
   * @param {Integer|number} minute - The minute for the new local time.
   * @param {Integer|number} second - The second for the new local time.
   * @param {Integer|number} nanosecond - The nanosecond for the new local time.
   */
  function LocalDateTime(year, month, day, hour, minute, second, nanosecond) {
    (0, _classCallCheck2["default"])(this, LocalDateTime);

    /**
     * The year.
     * @type {Integer|number}
     */
    this.year = util.assertValidYear(year);
    /**
     * The month.
     * @type {Integer|number}
     */

    this.month = util.assertValidMonth(month);
    /**
     * The day.
     * @type {Integer|number}
     */

    this.day = util.assertValidDay(day);
    /**
     * The hour.
     * @type {Integer|number}
     */

    this.hour = util.assertValidHour(hour);
    /**
     * The minute.
     * @type {Integer|number}
     */

    this.minute = util.assertValidMinute(minute);
    /**
     * The second.
     * @type {Integer|number}
     */

    this.second = util.assertValidSecond(second);
    /**
     * The nanosecond.
     * @type {Integer|number}
     */

    this.nanosecond = util.assertValidNanosecond(nanosecond);
    Object.freeze(this);
  }
  /**
   * Create a {@link LocalDateTime} object from the given standard JavaScript `Date` and optional nanoseconds.
   * Time zone offset component of the given date is ignored.
   * @param {global.Date} standardDate - The standard JavaScript date to convert.
   * @param {Integer|number|undefined} nanosecond - The optional amount of nanoseconds.
   * @return {LocalDateTime} New LocalDateTime.
   */


  (0, _createClass2["default"])(LocalDateTime, [{
    key: "toString",

    /**
     * @ignore
     */
    value: function toString() {
      return localDateTimeToString(this.year, this.month, this.day, this.hour, this.minute, this.second, this.nanosecond);
    }
  }], [{
    key: "fromStandardDate",
    value: function fromStandardDate(standardDate, nanosecond) {
      verifyStandardDateAndNanos(standardDate, nanosecond);
      return new LocalDateTime(standardDate.getFullYear(), standardDate.getMonth() + 1, standardDate.getDate(), standardDate.getHours(), standardDate.getMinutes(), standardDate.getSeconds(), util.totalNanoseconds(standardDate, nanosecond));
    }
  }]);
  return LocalDateTime;
}();

exports.LocalDateTime = LocalDateTime;
Object.defineProperty(LocalDateTime.prototype, LOCAL_DATE_TIME_IDENTIFIER_PROPERTY, IDENTIFIER_PROPERTY_ATTRIBUTES);
/**
 * Test if given object is an instance of {@link LocalDateTime} class.
 * @param {Object} obj - The object to test.
 * @return {boolean} `true` if given object is a {@link LocalDateTime}, `false` otherwise.
 */

function isLocalDateTime(obj) {
  return hasIdentifierProperty(obj, LOCAL_DATE_TIME_IDENTIFIER_PROPERTY);
}
/**
 * Represents an instant capturing the date, the time and the timezone identifier.
 * Created {@ DateTime} objects are frozen with `Object.freeze()` in constructor and thus immutable.
 */


var DateTime =
/*#__PURE__*/
function () {
  /**
   * @constructor
   * @param {Integer|number} year - The year for the new date-time.
   * @param {Integer|number} month - The month for the new date-time.
   * @param {Integer|number} day - The day for the new date-time.
   * @param {Integer|number} hour - The hour for the new date-time.
   * @param {Integer|number} minute - The minute for the new date-time.
   * @param {Integer|number} second - The second for the new date-time.
   * @param {Integer|number} nanosecond - The nanosecond for the new date-time.
   * @param {Integer|number} timeZoneOffsetSeconds - The time zone offset in seconds. Either this argument or `timeZoneId` should be defined.
   * Value represents the difference, in seconds, from UTC to local time.
   * This is different from standard JavaScript `Date.getTimezoneOffset()` which is the difference, in minutes, from local time to UTC.
   * @param {string|null} timeZoneId - The time zone id for the new date-time. Either this argument or `timeZoneOffsetSeconds` should be defined.
   */
  function DateTime(year, month, day, hour, minute, second, nanosecond, timeZoneOffsetSeconds, timeZoneId) {
    (0, _classCallCheck2["default"])(this, DateTime);

    /**
     * The year.
     * @type {Integer|number}
     */
    this.year = util.assertValidYear(year);
    /**
     * The month.
     * @type {Integer|number}
     */

    this.month = util.assertValidMonth(month);
    /**
     * The day.
     * @type {Integer|number}
     */

    this.day = util.assertValidDay(day);
    /**
     * The hour.
     * @type {Integer|number}
     */

    this.hour = util.assertValidHour(hour);
    /**
     * The minute.
     * @type {Integer|number}
     */

    this.minute = util.assertValidMinute(minute);
    /**
     * The second.
     * @type {Integer|number}
     */

    this.second = util.assertValidSecond(second);
    /**
     * The nanosecond.
     * @type {Integer|number}
     */

    this.nanosecond = util.assertValidNanosecond(nanosecond);

    var _verifyTimeZoneArgume = verifyTimeZoneArguments(timeZoneOffsetSeconds, timeZoneId),
        _verifyTimeZoneArgume2 = (0, _slicedToArray2["default"])(_verifyTimeZoneArgume, 2),
        offset = _verifyTimeZoneArgume2[0],
        id = _verifyTimeZoneArgume2[1];
    /**
     * The time zone offset in seconds.
     *
     * *Either this or {@link timeZoneId} is defined.*
     *
     * @type {Integer|number}
     */


    this.timeZoneOffsetSeconds = offset;
    /**
     * The time zone id.
     *
     * *Either this or {@link timeZoneOffsetSeconds} is defined.*
     *
     * @type {string}
     */

    this.timeZoneId = id;
    Object.freeze(this);
  }
  /**
   * Create a {@link DateTime} object from the given standard JavaScript `Date` and optional nanoseconds.
   * @param {global.Date} standardDate - The standard JavaScript date to convert.
   * @param {Integer|number|undefined} nanosecond - The optional amount of nanoseconds.
   * @return {DateTime} New DateTime.
   */


  (0, _createClass2["default"])(DateTime, [{
    key: "toString",

    /**
     * @ignore
     */
    value: function toString() {
      var localDateTimeStr = localDateTimeToString(this.year, this.month, this.day, this.hour, this.minute, this.second, this.nanosecond);
      var timeZoneStr = this.timeZoneId ? "[".concat(this.timeZoneId, "]") : util.timeZoneOffsetToIsoString(this.timeZoneOffsetSeconds);
      return localDateTimeStr + timeZoneStr;
    }
  }], [{
    key: "fromStandardDate",
    value: function fromStandardDate(standardDate, nanosecond) {
      verifyStandardDateAndNanos(standardDate, nanosecond);
      return new DateTime(standardDate.getFullYear(), standardDate.getMonth() + 1, standardDate.getDate(), standardDate.getHours(), standardDate.getMinutes(), standardDate.getSeconds(), util.totalNanoseconds(standardDate, nanosecond), util.timeZoneOffsetInSeconds(standardDate), null
      /* no time zone id */
      );
    }
  }]);
  return DateTime;
}();

exports.DateTime = DateTime;
Object.defineProperty(DateTime.prototype, DATE_TIME_IDENTIFIER_PROPERTY, IDENTIFIER_PROPERTY_ATTRIBUTES);
/**
 * Test if given object is an instance of {@link DateTime} class.
 * @param {Object} obj - The object to test.
 * @return {boolean} `true` if given object is a {@link DateTime}, `false` otherwise.
 */

function isDateTime(obj) {
  return hasIdentifierProperty(obj, DATE_TIME_IDENTIFIER_PROPERTY);
}

function hasIdentifierProperty(obj, property) {
  return (obj && obj[property]) === true;
}

function localDateTimeToString(year, month, day, hour, minute, second, nanosecond) {
  return util.dateToIsoString(year, month, day) + 'T' + util.timeToIsoString(hour, minute, second, nanosecond);
}

function verifyTimeZoneArguments(timeZoneOffsetSeconds, timeZoneId) {
  var offsetDefined = timeZoneOffsetSeconds || timeZoneOffsetSeconds === 0;
  var idDefined = timeZoneId && timeZoneId !== '';

  if (offsetDefined && !idDefined) {
    (0, _util.assertNumberOrInteger)(timeZoneOffsetSeconds, 'Time zone offset in seconds');
    return [timeZoneOffsetSeconds, null];
  } else if (!offsetDefined && idDefined) {
    (0, _util.assertString)(timeZoneId, 'Time zone ID');
    return [null, timeZoneId];
  } else if (offsetDefined && idDefined) {
    throw (0, _error.newError)("Unable to create DateTime with both time zone offset and id. Please specify either of them. Given offset: ".concat(timeZoneOffsetSeconds, " and id: ").concat(timeZoneId));
  } else {
    throw (0, _error.newError)("Unable to create DateTime without either time zone offset or id. Please specify either of them. Given offset: ".concat(timeZoneOffsetSeconds, " and id: ").concat(timeZoneId));
  }
}

function verifyStandardDateAndNanos(standardDate, nanosecond) {
  (0, _util.assertValidDate)(standardDate, 'Standard date');

  if (nanosecond !== null && nanosecond !== undefined) {
    (0, _util.assertNumberOrInteger)(nanosecond, 'Nanosecond');
  }
}