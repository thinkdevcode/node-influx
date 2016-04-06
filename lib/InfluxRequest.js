var request = require('request')
var _ = require('lodash')
var url = require('url')

var resubmitErrorCodes = ['ETIMEDOUT', 'ESOCKETTIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'EHOSTUNREACH']

function InfluxRequest (options) {
  if (!options) options = {}
  this.index = 0
  this.host = options.host
  this.port = options.port
  this.protocol = options.protocol

  this.defaultRequestOptions = {
    timeout: null
  }
  this.setRequestTimeout(options.requestTimeout)
  this.options = {
    maxRetries: options.maxRetries || 2
  }
}

InfluxRequest.prototype.setRequestTimeout = function (value) {
  this.defaultRequestOptions.timeout = value
  return value
}

InfluxRequest.prototype.url = function (name, protocol, port, path) {
  return url.format({
      protocol: protocol,
      hostname: name,
      port: port
    }) + '/' + path
}

InfluxRequest.prototype._request = function (options, callback) {
  var self = this

  var requestOptions = _.extend({retries: 0}, this.defaultRequestOptions, options)

  // need to store the original path, in case we need to re-submit the
  // request onError
  if (!requestOptions.originalUrl)
    requestOptions.originalUrl = requestOptions.url

  requestOptions.url = this.url(this.host, this.protocol, this.port, requestOptions.originalUrl)
  requestOptions.retries++
  request(requestOptions, function (err, response, body) {
    self._parseCallback(err, response, body, requestOptions, callback)
  })
}

InfluxRequest.prototype._parseCallback = function (err, response, body, requestOptions, callback) {
  if (err && resubmitErrorCodes.indexOf(err.code) !== -1) {
    if (this.options.maxRetries >= requestOptions.retries) {
      return this._request(requestOptions, callback)
    }
  }
  return callback(err, response, body)
}

InfluxRequest.prototype.get = function (options, callback) {
  this._request(options, callback)
}

InfluxRequest.prototype.post = function (options, callback) {
  options.method = 'POST'
  this._request(options, callback)
}

module.exports = InfluxRequest
