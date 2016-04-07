/* eslint-env mocha */
var influx = require('../')
var assert = require('assert')

describe('InfluxDB-Core', function () {
  var client

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
      retentionPolicy: 'testrp'
    }
  }

  describe('#InfluxDB', function () {
    it('should exist as a function (class)', function () {
      assert(typeof influx.InfluxDB === 'function')
    })
  })

  describe('create client', function () {
    it('should create an instance without error', function () {
      client = influx({
        host: info.server.host,
        port: info.server.port,
        username: info.server.username,
        password: info.server.password,
        database: info.db.name,
        retentionPolicy: info.db.retentionPolicy
      })
      assert(client instanceof influx.InfluxDB)
    })
  })

  describe('#url', function () {
    it('should build a properly formatted url', function () {
      var url = client.url('query', {
        db: info.db.name,
        rp: info.db.retentionPolicy,
        precision: info.server.timePrecision
      })
      assert.equal(url, `query?u=${info.server.username}
                              &p=${info.server.password}
                              &db=${info.db.name}
                              &rp=${info.db.retentionPolicy}
                              &precision=${info.server.timePrecision}`)
    })

    it('should build a properly formatted url', function () {
      var url = client.url('query')
      assert.equal(url, `query?u=${info.server.username}
                              &p=${info.server.password}
                              &precision=${info.server.timePrecision}
                              &db=${info.db.name}
                              &rp=${info.db.retentionPolicy}`)
    })
  })

  describe('#_createKeyTagString', function () {
    it('should build a properly formatted string', function () {
      var str = client._createKeyTagString({
        tag_1: 'value',
        tag2: 'value value',
        tag3: 'value,value'
      })
      assert.equal(str, 'tag_1=value,tag2=value\\ value,tag3=value\\,value')
    })
  })

  describe('#_createKeyValueString', function () {
    it('should build a properly formatted string', function () {
      var str = client._createKeyValueString({ a: 1, b: 2 })
      assert.equal(str, 'a=1,b=2')
    })
  })

  describe('parseResult()', function () {
    it('should build a properly formatted response', function (done) {
      client._parseResults([{
        'series': [{
          'name': 'myseries2',
          'tags': {
            'mytag': 'foobarfoo'
          },
          'columns': ['time', 'value'],
          'values': [
            ['2015-06-27T06:25:54.411900884Z', 55]
          ]
        }, {
          'name': 'myseries2',
          'tags': {
            'mytag': 'foobarfoo2'
          },
          'columns': ['time', 'value'],
          'values': [
            ['2015-06-27T06:25:54.411900884Z', 29]
          ]
        }]
      }],
        function (err, results) {
          if (err) return done(err)
          assert.deepEqual(results,
            [[{
              time: '2015-06-27T06:25:54.411900884Z',
              value: 55,
              mytag: 'foobarfoo'
            }, {
              time: '2015-06-27T06:25:54.411900884Z',
              value: 29,
              mytag: 'foobarfoo2'
            }]]
          )
          done()
        })
    })
  })
})
