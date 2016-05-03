# node-influx

An [InfluxDB](http://influxdb.org/) Node.js Client

[![npm](http://img.shields.io/npm/v/influx.svg?style=flat-square)](https://www.npmjs.org/package/influx)
[![build](http://img.shields.io/travis/node-influx/node-influx/master.svg?style=flat-square)](https://travis-ci.org/node-influx/node-influx)
[![coverage](http://img.shields.io/coveralls/node-influx/node-influx/master.svg?style=flat-square)](https://coveralls.io/r/node-influx/node-influx?branch=master)
[![code climate](http://img.shields.io/codeclimate/github/node-influx/node-influx.svg?style=flat-square)](https://codeclimate.com/github/node-influx/node-influx)
[![Dependency Status](https://img.shields.io/david/node-influx/node-influx.svg?style=flat-square)](https://david-dm.org/node-influx/node-influx)
[![Github Releases](https://img.shields.io/npm/dm/influx.svg?style=flat-square)](https://github.com/node-influx/node-influx)

[![Bountysource](https://img.shields.io/bountysource/team/node-influx/activity.svg?style=flat-square)](https://www.bountysource.com/teams/node-influx) - Reward the contributors for their efforts on upcoming tasks.

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

Interested in becoming a maintainer? Please help out with issues and pull-requests and open an [issue introducing yourself](https://github.com/node-influx/node-influx/issues/new)! After we've seen you're involved with the project, we'll add you up :+1:

## Installation

    $ npm install influx

## Compatibility

Master is compatible with InfluxDB 0.12.1 (most features work with 0.10, 0.11)

Version 4.x.x is compatible with InfluxDB 0.9.x

Version 3.x.x is compatible with InfluxDB 0.8.x - 3.x will no longer have updates by core contributers, please consider upgrading.


## Usage

Create a client instance (`database` not required for all methods):

```js
var influx = require('influx')

var client = influx({
  host : 'localhost',
  port : 8086, // optional, default 8086
  protocol : 'http', // optional, default 'http'
  username : 'dbuser',
  password : 'f4ncyp4ass',
  database : 'my_database'
})

```

A list of all configuration values can be found below.


_NOTE: node-influx version <= 4.x used an optional pooling system to round robin requests
and this no longer exists in the library. Please refer to the official InfluxDB Relay
documentation to support multiple instance writes and queries._


### Configuration options

| Option        | Description   |
|:------------- |:-------------|
| username      | username |
| password      | password      |
| database | database name |
| host | hostname, e.g. 'localhost' |
| port [optional] |  influxdb port, default: 8086 |
| protocol [optional] |  protocol, default: http |
| depreciatedLogging [optional] | logging function for depreciated warnings,
defaults to console.log |
| failoverTimeout [optional] |  number of ms node-influx will take a host out
of the balancing after a request failed, default: 60000 |
| requestTimeout [optional] | number of ms to wait before a request times out.
Defaults to 'null' (waits until connection is closed). Use with caution! |
| maxRetries [options] | max number of retries until a request raises an error
(e.g. 'no hosts available'), default : 2 |
| timePrecision [optional] |Time precision, default : ms |

## Table of Contents
- [createDatabase](#createDatabase)
- [getDatabaseNames](#getDatabaseNames)
- [dropDatabase](#dropDatabase)
- [getMeasurements](#getMeasurements)
- [getMeasurementsByTagName](#getMeasurementsByTagName)
- [getMeasurementsByTagRegex](#getMeasurementsByTagRegex)
- [getMeasurementsByRegex](#getMeasurementsByRegex)
- [dropMeasurement](#dropMeasurement)
- [getSeries](#getSeries)
- [dropSeries](#dropSeries)
- [getUsers](#getUsers)
- [createUser](#createUser)
- [setPassword](#setPassword)
- [grantPrivilege](#grantPrivilege)
- [revokePrivilege](#revokePrivilege)
- [grantAdminPrivileges](#grantAdminPrivileges)
- [revokeAdminPrivileges](#revokeAdminPrivileges)
- [dropUser](#dropUser)
- [writePoint](#writePoint)
- [writePoints](#writePoints)

## Functions


##### createDatabase
Creates a new database.
_Requires cluster admin privileges._
```js
client.createDatabase(databaseName, [options,] (err, result) => {})
```

| Option      | Description   |
|:----------- |:--------------|
| DURATION    | duration    |
| REPLICATION | n           |
| SHARD DURATION | duration |
| NAME | retention-policy-name |


##### getDatabaseNames
Returns array of database names.
_Requires cluster admin privileges._
```js
client.getDatabaseNames((err, arrayDatabaseNames) => {})
```


##### dropDatabase
Drops a database including all measurements/series.
_Requires cluster admin privileges._
```js
dropDatabase(databaseName, (err, response) => {})
```


##### getMeasurements
Returns array of measurements.
_Requires database admin privileges._
```js
client.getMeasurements((err, arrayMeasurements) => {})
```


##### getMeasurementsByTagName
Returns array of measurements by tag name.
_Requires database admin privileges._
```js
client.getMeasurements(options, (err, arrayMeasurements) => {})
options = { tag_name: "tag_value" }
```


##### getMeasurementsByTagRegex
Returns array of measurements by tag regex.
_Requires database admin privileges._
```js
client.getMeasurements(options, (err, arrayMeasurements) => {})
options = { tag_name: "/\d/" }
```


##### getMeasurementsByRegex
Returns array of measurements by regex.
_Requires database admin privileges._
```js
client.getMeasurementsByRegex(regex, (err, arrayMeasurements) => {})
regex = '/\d/'
```


##### dropMeasurement
Drops a measurement from a database.
_Requires database admin privileges._
```js
dropSeries(measurementName, (err, response) => {})
```


##### getSeries
Returns array of series names from given measurement, or database if
`measurementName` is omitted.
_Requires database admin privileges._
```js
client.getSeries([measurementName,] [tag,] (err, arraySeriesNames) => {})
tag = { tag_name: 'tag_value'}
```


##### dropSeries
Drops a series from a database.
_Requires database admin privileges._
```js
dropSeries(seriesId, (err, response) => {})
```


##### getUsers
Returns an array of users.
_Requires cluster admin privileges._
```js
client.getUsers((err, users) => {})
```


##### createUser
Creates a new database user.
_Requires cluster admin privileges._
```js
client.createUser(username, password, isAdmin, (err, response) => {})
```


##### setPassword
Sets the users password.
_Requires admin privileges._
```js
client.setPassword(username, password, (err, response) => {})
```


##### grantPrivilege
Grants privilege for the given user.
_Requires admin privileges._
```js
client.grantPrivilege(privilege, databaseName, username, (err, response) => {})
```


##### revokePrivilege
Revokes privilege for the given user.
_Requires admin privileges._
```js
client.revokePrivilege(privilege, databaseName, username, (err, response) => {})
```


##### grantAdminPrivileges
Grants admin privileges for the given user.
_Requires admin privileges._
```js
client.grantAdminPrivileges(username, (err, response) => {})
```


##### revokeAdminPrivileges
Revokes all admin privileges for the given user.
_Requires admin privileges._
```js
client.revokeAdminPrivileges(username, (err, response) => {})
```


##### dropUser
Drops the given user.
_Requires admin privileges._
```js
client.dropUser(username, (err, response) => {})
```


##### writePoint
Writes a point to a measurement. A point can contain one or more fields, and
none or more tags.
_Requires database user privileges._
```js
var point = { attr: value, time: new Date() }
client.writePoint(measurementName, fields, tags, [options,] (err, response) => {})
```

`fields` can either be an object or a single value. For the latter, the field
name is set to `value`.
You can set the time by passing an object property called `time`. The time can
be either an integer value or a Date object. When providing a single value,
don't forget to adjust the time precision accordingly. The default value is
`ms`. The parameter `options` is optional and can be used to set the time
precision.

###### writePoint Example
```js
// write a single point with two fields and two tags. Time is omitted.
client.writePoint('testMeasurement', { fieldA: 232, fieldB: 123 }, { tagA: 'foo', tagB: 'bar' }, (err, response) => {})

// write a single point with the value "1". The value "1" corresponds to { value: 1 }
client.writePoint('testMeasurement', 1, { tagA: 'foo', tagB: 'bar'}, (err, response) => {})

// write a single point, providing an integer timestamp and time precision 's' for seconds
client.writePoint('testMeasurement', { time: 1234567890, value: 232 }, null, { precision: 's' }, (err, response) => {})

// write a single point, providing a Date object. Precision is set to default 'ms' for milliseconds.
client.writePoint('testMeasurement', { time: new Date(), value: 232 }, null, (err, response) => {})
```


###### writePoints
Writes multiple points to a series.
_Requires database user privileges._

`Points` is an array of points. Each point containing two objects: the actual fields and tags.
```js
var points = [
  //first value with tag
  [{ fieldA: 232 }, { tagA: 'foo' }],
  //second value with different tag
  [{ fieldA: 212 }, { tagB: 'bar' }],
  //third value, passed as integer. Different tag
  [123, { tagA: 'foo' }],
  //value providing timestamp, without tags
  [{ value: 122, time: new Date() }]
]
client.writePoints(measurementName, points, [options,] (err, response) => {})
```


##### query
Queries the database and returns an array of parsed responses.
_Requires database user privileges._

```js
var query = 'SELECT MEDIAN(fieldA) FROM testMeasurement WHERE time > now() - 1d'
client.query([database,] query, (err, results) => {})
```

If `database` is omitted, node-influx uses the database defined in the default options.
Since InfluxDB 0.9, all values with different tags are stored in different timeseries. The response from InfluxDB contains an array of values for each series that matches the request.
To make things easier the query function now returns a parsed response, meaning that all points from all series are merged into a single array of points and their tags. You can still retrieve the raw response from InfluxDB using `client.queryRaw()`.

You can also pass multiple queries at once. The callback returns an array of series, one series per query.

```js
client.query('SELECT * FROM testMeasurement; SELECT AVG(fieldA) AS avgvalue FROM testMeasurement', (err, results) => {})
// -> results =[
//   [{ fieldA: 1, tagA: 'foo'}, { fieldA: 3, tagA: 'foo' }],
//   [{ avgvalue: 2.345 }]
// ]
```


##### queryRaw
Same as function `query` but returns the raw response from InfluxDB.
_Requires database user privileges._
```js
var query = 'SELECT MEDIAN(fieldA) FROM testMeasurement WHERE time > now() - 1d'
client.queryRaw([database,] query, (err, results) => {})
```


##### createContinuousQuery
Creates a continuous query.
_Requires admin privileges._
```js
client.createContinuousQuery('testQuery', 'SELECT COUNT(fieldA) INTO fieldA_1h FROM testMeasurement GROUP BY time(1h)', (err, res) => {})
```


##### getContinuousQueries
Fetches all continuous queries from a database.
_Requires database admin privileges._
```js
getContinuousQueries((err, arrayContinuousQueries) => {})
```


##### dropContinuousQuery
Drops a continuous query from a database.
_Requires database admin privileges._
```js
dropContinuousQuery(queryName, [databaseName,] (err, response) => {})
```


##### getRetentionPolicies
Fetches all retention policies from a database.
```js
client.getRetentionPolicies(databaseName, (err, response) => {})
```


##### createRetentionPolicy
Creates a new retention policy.
_Requires admin privileges._
```js
client.createRetentionPolicy(rpName, databaseName, duration, replication, isDefault, (err, response) => {})
```

##### example
```js
client.createRetentionPolicy('my_ret_pol_name', 'my_database', '1d', 1, true, (err, response) => {})
```


##### alterRetentionPolicy
Alters an existing retention policy - requires admin privileges.
```js
client.alterRetentionPolicy(rpName, databaseName, duration, replication, isDefault, (err, response) => {})
```


## Testing
Either install InfluxDB or use a docker container to run the service:

    docker run -d -p 8083:8083 -p 8086:8086 --expose 8090 --expose 8099 tutum/influxdb

Then to run the test harness use `npm test`.


## Contributing
If you want to add features, fix bugs or improve node-influx please open a pull-request.
Please note, we are following [Javascript Standard Style](https://github.com/feross/standard). Before opening a PR
your code should pass Standard.

 `npm install standard`
 `standard`


## Licence
*MIT*
