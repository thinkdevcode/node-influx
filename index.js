var InfluxRequest = require('./lib/InfluxRequest.js')
var url = require('url')
var _ = require('lodash')

var defaultOptions = {
  host: '127.0.0.1',
  username: 'root',
  password: 'root',
  port: 8086,
  protocol: 'http',
  depreciatedLogging: (process.env.NODE_ENV === undefined || 'development') ? console.log : false,
  requestTimeout: null,
  maxRetries: 2,
  timePrecision: 'ms'
}

var InfluxDB = function (options) {
  this.options = _.extend(_.clone(defaultOptions), options)

  this.request = new InfluxRequest({
    host: this.options.host,
    port: this.options.port,
    protocol: this.options.protocol,
    maxRetries: this.options.maxRetries,
    requestTimeout: this.options.requestTimeout
  })

  return this
}

InfluxDB.prototype.createDatabase = function (databaseName, options, callback) {
  var query = `CREATE DATABASE ${databaseName}`
  if (typeof options === 'function') {
    callback = options
  }
  else {
    query += ` WITH ${this._parseAttributes(options)}`
  }
  this.queryDB(query, callback)
}

InfluxDB.prototype.dropDatabase = function (databaseName, callback) {
  this.queryDB(`DROP DATABASE ${databaseName}`, callback)
}

InfluxDB.prototype.getDatabaseNames = function (callback) {
  this.queryDB('SHOW DATABASES', function (err, results) {
    if (err) {
      return callback(err, results)
    }
    return callback(err, _.map(results[0].series[0].values, function (dbarray) {return dbarray[0]}))
  })
}

InfluxDB.prototype.getMeasurements = function (callback) {
  this.queryDB('SHOW MEASUREMENTS', callback)
}

// [json] options: { example_tag_name = 1 }
// TODO: Check if property exists in options
// TODO: Throw error if more than 1 or less than 1 property
InfluxDB.prototype.getMeasurementsByTagName = function (options, callback) {
  this.queryDB(`SHOW MEASUREMENTS WHERE ${this._parseAttributes(options, '=')}`, callback)
}

// [json] options: { example_tag_name: "/\d/" }
// TODO: Check if property exists in options
// TODO: Throw error if more than 1 or less than 1 property
InfluxDB.prototype.getMeasurementsByTagRegex = function (options, callback) {
  this.queryDB(`SHOW MEASUREMENTS WHERE ${this._parseAttributes(options, '=~')}`, callback)
}

// [string] regex: "/\d/"
// TODO: Check if regex is valid
InfluxDB.prototype.getMeasurementsByRegex = function (regex, callback) {
  this.queryDB(`SHOW MEASUREMENTS WITH MEASUREMENT =~ ${regex}`, callback)
}

InfluxDB.prototype.getSeries = function (measurementName, tagName, callback) {
  var query = 'show series'

  // if no measurement name is given
  if (typeof measurementName === 'function') {
    callback = measurementName
  } else {
    query = query + ' from "' + measurementName + '"'
  }

  // if no tag name is given
  if (typeof tagName === 'function') {
    callback = tagName
  } else {
    query += ` WHERE ${tagName}`
  }

  this.queryDB(query, function (err, results) {
    if (err) {
      return callback(err, results)
    }
    return callback(err, results[0].series)
  })

}

InfluxDB.prototype.dropMeasurement = function (measurementName, callback) {
  this.queryDB('drop measurement "' + measurementName + '"', callback)
}

InfluxDB.prototype.dropSeries = function (seriesId, callback) {
  this.queryDB('drop series ' + seriesId, callback)
}

InfluxDB.prototype.getUsers = function (callback) {
  var self = this

  this.queryDB('show users', function (err, results) {
    if (err) {
      return callback(err, results)
    }
    return self._parseResults(results, function (err, results) {
      return callback(err, results[0])
    })
  // return callback(err, results[0].series[0].values)
  })
}

InfluxDB.prototype.createUser = function (username, password, isAdmin, callback) {
  if (typeof isAdmin === 'function') {
    callback = isAdmin
    isAdmin = false
  }
  var query = `CREATE USER ${username} with password '${password}'`
  if (isAdmin) {
    query += ' WITH ALL PRIVILEGES'
  }
  this.queryDB(query, callback)
}

InfluxDB.prototype.setPassword = function (username, password, callback) {
  this.queryDB('set password for "' + username + '" = \'' + password + "'", callback)
}

InfluxDB.prototype.grantPrivilege = function (privilege, databaseName, userName, callback) {
  this.queryDB('grant ' + privilege + ' on "' + databaseName + '" to "' + userName + '"', callback)
}

InfluxDB.prototype.revokePrivilege = function (privilege, databaseName, userName, callback) {
  this.queryDB('revoke ' + privilege + ' on "' + databaseName + '" from "' + userName + '"', callback)
}

InfluxDB.prototype.grantAdminPrivileges = function (userName, callback) {
  this.queryDB('grant all privileges to "' + userName + '"', callback)
}

InfluxDB.prototype.revokeAdminPrivileges = function (userName, callback) {
  this.queryDB('revoke all privileges from "' + userName + '"', callback)
}

InfluxDB.prototype.dropUser = function (username, callback) {
  this.queryDB('drop user "' + username + '"', callback)
}

InfluxDB.prototype.writeMeasurements = function (measurements, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  if (!options.database) {
    options.database = this.options.database
  }

  if (!options.precision) {
    options.precision = this.options.timePrecision
  }

  this.request.post({
    url: this.url('write', options),
    pool: typeof options.pool !== 'undefined' ? options.pool : {},
    body: this._prepareValues(measurements)
  }, this._parseCallback(callback))
}

InfluxDB.prototype.writePoint = function (measurementName, values, tags, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }
  var data = {}
  data[measurementName] = [[values, tags]]
  this.writeMeasurements(data, options, callback)
}

InfluxDB.prototype.writePoints = function (measurementName, points, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }
  var data = {}
  data[measurementName] = points
  this.writeMeasurements(data, options, callback)
}

InfluxDB.prototype.createContinuousQuery = function (queryName, queryString, databaseName, callback) {
  if (typeof databaseName === 'function') {
    callback = databaseName
    databaseName = this.options.database
  }

  var query = 'CREATE CONTINUOUS QUERY ' + queryName + ' ON "' + databaseName + '" BEGIN ' +
    queryString +
    ' END'
  this.queryDB(query, callback)
}

InfluxDB.prototype.getContinuousQueries = function (callback) {
  var self = this
  this.queryDB('SHOW CONTINUOUS QUERIES', function (err, result) {
    if (err) return callback(err)
    self._parseResults(result, callback)
  })
}

InfluxDB.prototype.dropContinuousQuery = function (queryName, databaseName, callback) {
  if (typeof databaseName === 'function') {
    callback = databaseName
    databaseName = this.options.database
  }
  this.queryDB('DROP CONTINUOUS QUERY "' + queryName + '" ON "' + databaseName + '"', callback)
}

InfluxDB.prototype.createRetentionPolicy = function (rpName, databaseName, duration, replication, isDefault, callback) {
  var query = 'create retention policy "' + rpName +
    '" on "' + databaseName +
    '" duration ' + duration +
    ' replication ' + replication
  if (isDefault) {
    query += ' default'
  }

  this.queryDB(query, callback)
}

InfluxDB.prototype.getRetentionPolicies = function (databaseName, callback) {
  this.queryDB('show retention policies on "' + databaseName + '"', callback)
}

InfluxDB.prototype.alterRetentionPolicy = function (rpName, databaseName, duration, replication, isDefault, callback) {
  var query = 'alter retention policy "' + rpName +
    '" on "' + databaseName + '"'
  if (duration) {
    query += ' duration ' + duration
  }
  if (replication) {
    query += ' replication ' + replication
  }
  if (isDefault) {
    query += ' default'
  }

  this.queryDB(query, callback)
}

InfluxDB.prototype.setRequestTimeout = function (value) {
  return this.request.setRequestTimeout(value)
}

InfluxDB.prototype.query = function (databaseName, query, callback) {
  if (typeof query === 'function') {
    callback = query
    query = databaseName
    databaseName = this.options.database
  }
  var self = this

  this.queryDB(query, {db: databaseName}, function (err, results) {
    if (err) {
      return callback(err, results)
    }
    return self._parseResults(results, function (err, results) {
      return callback(err, results)
    })
  })
}

InfluxDB.prototype.queryRaw = function (databaseName, query, callback) {
  if (typeof query === 'function') {
    callback = query
    query = databaseName
    databaseName = this.options.database
  }
  this.queryDB(query, {db: databaseName}, callback)
}

// Prepares and sends the actual request
InfluxDB.prototype.queryDB = function (query, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = undefined
  }

  this.request.get({
    url: this.url('query', options, {q: query}),
    json: true
  }, this._parseCallback(callback))
}

/*
 *  Core helper functions
 */

// possible options:
// {db: databaseName,  rp: retentionPolicy, precision: timePrecision}
InfluxDB.prototype.url = function (endpoint, options, query) {
 // prepare the query object
 var queryObj = _.extend({
   u: this.options.username,
   p: this.options.password
 }, options || {}, query || {})

 // add the global configuration if they are set and not provided by the options
 if (this.options.timePrecision && !queryObj.precision) {
   queryObj.precision = this.options.timePrecision
 }
 if (this.options.database && !queryObj.db) {
   queryObj.db = this.options.database
 }
 if (this.options.retentionPolicy && !queryObj.rp) {
   queryObj.rp = this.options.retentionPolicy
 }

 return url.format({
   pathname: endpoint,
   query: queryObj
 })
}

InfluxDB.prototype._createKeyValueString = function (object) {
  return _.map(object, function (value, key) {
    if (typeof value === 'string') {
      return key + '="' + value + '"'
    } else {
      return key + '=' + value
    }
  }).join(',')
}

InfluxDB.prototype._createKeyTagString = function (object) {
  return _.map(object, function (value, key) {
    if (typeof value === 'string') {
      return key + '=' + value.replace(/ /g, '\\ ').replace(/,/g, '\\,')
    } else {
      return key + '=' + value
    }
  }).join(',')
}

InfluxDB.prototype._prepareValues = function (measurements) {
  var self = this
  var output = []
  _.forEach(measurements, function (values, measurementName) {
    _.each(values, function (points) {
      var line = measurementName.replace(/ /g, '\\ ').replace(/,/g, '\\,')
      if (points[1] && _.isObject(points[1]) && _.keys(points[1]).length > 0) {
        line += ',' + self._createKeyTagString(points[1])
      }

      if (_.isObject(points[0])) {
        var timestamp = null
        if (points[0].time) {
          timestamp = points[0].time
          delete (points[0].time)
        }
        line += ' ' + self._createKeyValueString(points[0])
        if (timestamp) {
          if (timestamp instanceof Date) {
            line += ' ' + timestamp.getTime()
          } else {
            line += ' ' + timestamp
          }
        }
      } else {
        if (typeof points[0] === 'string') {
          line += ' value="' + points[0] + '"'
        } else {
          line += ' value=' + points[0]
        }
      }
      output.push(line)
    }, this)
  }, this)
  return output.join('\n')
}

InfluxDB.prototype._parseAttributes = function (options, delimiter) {
  var attributes = ''
  delimiter = delimiter || ' '
  for (var attribute in options) {
    if (!options.hasOwnProperty(attribute))
      continue

    attributes += `${attribute}${delimiter}${options[attribute]} `
  }
  return attributes
}

InfluxDB.prototype._parseResults = function (response, callback) {
  var results = []
  _.each(response, function (result) {
    var tmp = []
    if (result.series) {
      _.each(result.series, function (series) {
        var rows = _.map(series.values, function (values) {
          return _.extend(_.zipObject(series.columns, values), series.tags)
        })
        tmp = _.chain(tmp).concat(rows).value()
      })
    }
    results.push(tmp)
  })
  return callback(null, results)
}

InfluxDB.prototype._parseCallback = function (callback) {
  return function (err, res, body) {
    if (typeof callback === 'undefined') return
    if (err) {
      return callback(err)
    }
    if (res.statusCode < 200 || res.statusCode >= 300) {
      return callback(new Error(body.error || body))
    }

    if (_.isObject(body) && body.results && _.isArray(body.results)) {
      for (var i = 0;i <= body.results.length;++i) {
        if (body.results[i] && body.results[i].error && body.results[i].error !== '') {
          return callback(new Error(body.results[i].error))
        }
      }
    }
    if (body === undefined) {
      return callback(new Error('body is undefined'))
    }
    return callback(null, body.results)
  }
}

var createClient = function () {
  var args = arguments
  var Client = function () { return InfluxDB.apply(this, args) }
  Client.prototype = InfluxDB.prototype
  return new Client()
}

module.exports = createClient
module.exports.InfluxDB = InfluxDB
module.exports.defaultOptions = defaultOptions
