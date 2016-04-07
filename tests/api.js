/* eslint-env mocha */
var influx = require('../')
var assert = require('assert')

describe('InfluxDB-API', function () {
  var client
  var dbClient
  var failClient

  var info = {
    server: {
      host: 'localhost',
      port: 8086,
      username: 'root',
      password: 'root',
      timePrecision: 'ms'
    },
    db: {
      name: 'test_db',
      username: 'johnsmith',
      password: 'johnjohn',
      retentionPolicy: 'testrp'
    },
    series: {
      name: 'response_time',
      strName: 'string_test'
    }
  }

  describe('create client', function () {
    it('should create an instance without error', function () {
      client = influx({host: info.server.host, port: info.server.port, username: info.server.username, password: info.server.password, database: info.db.name, retentionPolicy: info.db.retentionPolicy})
      dbClient = influx({host: info.server.host, port: info.server.port, username: info.server.username, password: info.server.password, database: info.db.name})
      failClient = influx({host: info.server.host, port: 6543, username: info.server.username, password: info.server.password, database: info.db.name})

      assert(client instanceof influx.InfluxDB)
    })
  })

  describe('#createDatabase', function () {
    it('should create a new database without error', function (done) {
      client.createDatabase(info.db.name, done)
    })
    it('should not throw an error if db already exists', function (done) {
      client.createDatabase(info.db.name, done)
    })
  })

  describe('#getDatabaseNames', function () {
    it('should return array of database names', function (done) {
      client.getDatabaseNames(function (err, dbs) {
        if (err) return done(err)
        assert(dbs instanceof Array)
        assert.notEqual(dbs.indexOf(info.db.name), -1)
        done()
      })
    })
    it('should bubble errors through', function (done) {
      failClient.getDatabaseNames(function (err) {
        assert(err instanceof Error)
        done()
      })
    })
  })

  describe('#createUser', function () {
    it('should create a user without error', function (done) {
      client.createUser(info.db.username, info.db.password, true, done)
    })
    it('should error when creating an existing user', function (done) {
      client.createUser(info.db.username, info.db.password, function (err) {
        assert(err instanceof Error)
        done()
      })
    })
  })

  describe('#getUsers', function () {
    it('should get an array of database users', function (done) {
      client.getUsers(function (err, users) {
        assert.equal(err, null)
        assert(users instanceof Array)
        assert.equal(users.length, 1)
        done()
      })
    })

    it('should error when deleting an existing user', function (done) {
      failClient.getUsers(function (err) {
        assert(err instanceof Error)
        done()
      })
    })

  })

  describe('#setPassword', function () {
    it('should update user password without error', function (done) {
      client.setPassword(info.db.username, info.db.password, done)
    })
  })

  describe('#grantPrivilege', function () {
    it('should grant user privileges without error', function (done) {
      client.grantPrivilege('READ', info.db.name, info.db.username, done)
    })
    it('should error when granting user privilege', function (done) {
      client.grantPrivilege('BEER', info.db.name, info.db.username, function (err) {
        assert(err instanceof Error)
        done()
      })
    })
  })

  describe('#revokePrivilege', function () {
    it('should revoke user privileges without error', function (done) {
      client.revokePrivilege('READ', info.db.name, info.db.username, done)
    })
    it('should error when updating user privilege', function (done) {
      client.revokePrivilege('BEER', info.db.name, info.db.username, function (err) {
        assert(err instanceof Error)
        done()
      })
    })
  })

  describe('#grantAdminPrivileges', function () {
    it('should grant admin privileges without error', function (done) {
      client.grantAdminPrivileges(info.db.username, done)
    })
    it('should error when granting admin privileges', function (done) {
      client.grantAdminPrivileges('yourmum', function (err) {
        assert(err instanceof Error)
        done()
      })
    })
  })

  describe('#revokeAdminPrivileges', function () {
    it('should revoke admin privileges without error', function (done) {
      client.revokeAdminPrivileges(info.db.username, done)
    })
    it('should error when revoking admin privileges', function (done) {
      client.revokeAdminPrivileges('yourmum', function (err) {
        assert(err instanceof Error)
        done()
      })
    })
  })

  describe('#dropUser', function () {
    it('should delete a user without error', function (done) {
      client.dropUser(info.db.username, done)
    })
    it('should error when deleting an existing user', function (done) {
      client.dropUser(info.db.username, function (err) {
        assert(err instanceof Error)
        done()
      })
    })
  })

  describe('#createRetentionPolicy', function () {
    it('should create a rentention policy', function (done) {
      dbClient.createRetentionPolicy(info.db.retentionPolicy, info.db.name, '1d', 1, true, done)
    })
  })

  describe('#getRetentionPolicies', function () {
    it('should get an array of retention policies', function (done) {
      client.getRetentionPolicies(info.db.name, function (err, rps) {
        assert.equal(err, null)
        assert(rps instanceof Array)
        assert.equal(rps.length, 1)
        done()
      })
    })
  })

  describe('#alterRetentionPolicy', function () {
    it('should alter a rentention policy', function (done) {
      dbClient.alterRetentionPolicy(info.db.retentionPolicy, info.db.name, '1h', 1, true, done)
    })
  })

  describe('#writePoint', function () {
    this.timeout(5000)

    it('should write a generic point into the database', function (done) {
      dbClient.writePoint(info.series.name, {value: 232, value2: 123}, { foo: 'bar', foobar: 'baz'}, done)
    })

    it('should write a generic point into the database', function (done) {
      dbClient.writePoint(info.series.name, 1, { foo: 'bar', foobar: 'baz'}, done)
    })

    it('should write a generic point into the database', function (done) {
      dbClient.writePoint(info.series.name, {time: 1234567890, value: 232}, {}, done)

    })

    it('should write a point with time into the database', function (done) {
      dbClient.writePoint(info.series.name, {time: new Date(), value: 232}, {}, done)
    })

    it('should write a point with a string as value into the database', function (done) {
      dbClient.writePoint(info.series.strName, {value: 'my test string'}, {}, done)
    })

    it('should write a point with a string as value into the database (using different method)', function (done) {
      dbClient.writePoint(info.series.strName, 'my second test string', {}, done)
    })
  })

  describe('#writePoints', function () {
    this.timeout(10000)
    it('should write multiple points to the same time series, same column names', function (done) {
      var points = [
        [{value: 232}, { foobar: 'baz'}],
        [{value: 212}, { foobar: 'baz'}],
        [{value: 452}, { foobar: 'baz'}],
        [{value: 122}]
      ]
      dbClient.writePoints(info.series.name, points, done)
    })
    it('should write multiple points to the same time series, differing column names', function (done) {
      var points = [
        [{value: 232}, { foobar: 'baz'}],
        [{othervalue: 212}, { foobar: 'baz'}],
        [{andanothervalue: 452}, { foobar: 'baz'}]
      ]
      dbClient.writePoints(info.series.name, points, done)
    })
  })

  describe('#writeSeries', function () {
    it('should write multiple points to multiple time series, same column names', function (done) {
      var points = [
        [{value: 232}, { foobar: 'baz'}],
        [{value: 212}, { foobar: 'baz'}],
        [{value: 452}, { foobar: 'baz'}],
        [{value: 122}]
      ]
      var data = {
        series1: points,
        series2: points
      }
      dbClient.writeMeasurements(data, done)
    })
    it('should write multiple points to multiple time series, differing column names', function (done) {
      var points = [
        [{value: 232}, { foobar: 'baz'}],
        [{othervalue: 212}, { foobar: 'baz'}],
        [{andanothervalue: 452}, { foobar: 'baz'}]
      ]
      var data = {
        series1: points,
        series2: points
      }
      dbClient.writeMeasurements(data, done)
    })
  })

  describe('#query', function () {
    it('should read a point from the database', function (done) {
      dbClient.query('SELECT value FROM ' + info.series.name + ';', function (err, res) {
        assert.equal(err, null)
        assert(res instanceof Array)
        assert.equal(res.length, 1)
        assert(res[0].length >= 2)
        assert.equal(res[0][0].value, 232)
        done()
      })
    })
  })

  describe('#queryRaw', function () {
    it('should read a point from the database and return raw values', function (done) {
      dbClient.queryRaw('SELECT value FROM ' + info.series.name + ';', function (err, res) {
        assert.equal(err, null)
        assert(res instanceof Array)
        assert.equal(res.length, 1)
        assert.equal(res[0].series.length, 1)
        done()
      })
    })
  })

  describe('#createContinuousQuery', function () {
    it('should create a continuous query', function (done) {
      dbClient.createContinuousQuery('testQuery', 'SELECT COUNT(value) INTO valuesCount_1h FROM ' + info.series.name + ' GROUP BY time(1h) ', function (err, res) {
        assert.equal(err, null)
        assert(res instanceof Array)
        assert.equal(res.length, 1)
        done()
      })
    })
  })

  describe('#getContinuousQueries', function () {
    it('should fetch all continuous queries from the database', function (done) {
      dbClient.getContinuousQueries(function (err, res) {
        assert.equal(err, null)
        assert(res instanceof Array)
        assert.equal(res.length, 1)
        done()
      })
    })
  })

  describe('#dropContinuousQuery', function () {
    it('should drop the continuous query from the database', function (done) {
      dbClient.getContinuousQueries(function (err, res) {
        if (err) return done(err)
        dbClient.dropContinuousQuery(res[0][0].name, function (err) {
          assert.equal(err, null)
          done()
        })
      })
    })
  })

  describe('#getMeasurements', function () {
    it('should return array of measurements', function (done) {
      client.getMeasurements(function (err, measurements) {
        if (err) return done(err)
        assert(measurements instanceof Array)
        assert.equal(measurements.length, 1)
        done()
      })
    })
  })

  describe('#getSeries', function () {
    it('should return array of series', function (done) {
      client.getSeries(function (err, series) {
        if (err) return done(err)
        assert(series instanceof Array)
        assert(series.length >= 3)
        done()
      })
    })

    it('should return array of series', function (done) {
      client.getSeries(info.series.name, function (err, series) {
        if (err) return done(err)
        assert(series instanceof Array)
        assert.equal(series.length, 1)
        done()
      })
    })
    it('should bubble errors through')
  })

  describe('#dropSeries', function () {
    this.timeout(25000)
    it('should drop series', function (done) {
      client.dropSeries('WHERE foobar="baz"', function (err) {
        if (err) return done(err)
        assert.equal(err, null)
        done()
      })
    })
    it('should bubble errors through', function (done) {
      failClient.dropSeries(info.series.name, function (err) {
        assert(err instanceof Error)
        done()
      })
    })
  })

  describe('#dropMeasurement', function () {
    this.timeout(25000)
    it('should drop measurement', function (done) {
      client.dropMeasurement(info.series.name, function (err) {
        if (err) return done(err)
        assert.equal(err, null)
        done()
      })
    })
    it('should bubble errors through', function (done) {
      failClient.dropMeasurement(info.series.name, function (err) {
        assert(err instanceof Error)
        done()
      })
    })
  })

  describe('#dropDatabase', function () {
    this.timeout(25000)
    it('should delete the database without error', function (done) {
      client.dropDatabase(info.db.name, done)
    })
    it('should not error if database does not exist', function (done) {
      client.dropDatabase(info.db.name, done)
    })
  })

})
