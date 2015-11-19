'use strict';
var fs = require('fs');
var debug = require('debug')('screenshot-stream');
var path = require('path');
var urlMod = require('url');
var base64Stream = require('base64-stream');
var parseCookiePhantomjs = require('parse-cookie-phantomjs');
var phantomBridge = require('phantom-bridge');
var objectAssign = require('object-assign');
var byline = require('byline');

function handleCookies(cookies, url) {
  var parsedUrl = urlMod.parse(url);

  return (cookies || []).map(function (cookie) {
    var ret = typeof cookie === 'string' ? parseCookiePhantomjs(cookie) : cookie;

    if (!ret.domain) {
      ret.domain = parsedUrl.hostname;
    }

    if (!ret.path) {
      ret.path = parsedUrl.path;
    }

    return ret;
  });
}

module.exports = function (url, size, opts) {
  opts = objectAssign({
    delay: 0,
    scale: 1
  }, opts);

  opts.url      = url;
  opts.width    = size.split(/x/i)[0] * opts.scale;
  opts.height   = size.split(/x/i)[1] * opts.scale;
  opts.cookies  = handleCookies(opts.cookies, opts.url);
  opts.token    = 'speaker-token-' + (new Date().getTime());
  opts.main     = path.join(__dirname, 'screen.js');

  debug(opts)

  var cp = phantomBridge(opts.main, [
    '--ignore-ssl-errors=true',
    '--local-to-remote-url-access=true',
    '--ssl-protocol=any',
    JSON.stringify(opts)
  ]);

  var stream = cp.stdout.pipe(base64Stream.decode());

  process.stderr.setMaxListeners(0);


  cp.stdout.setEncoding('utf8');
  byline(cp.stdout).on('data', function (data) {
    data = data.trim();
    stream.emit('data', data);
  });

  cp.stderr.setEncoding('utf8');
  byline(cp.stderr).on('data', function (data) {
    data = data.trim();

    if(data.substr(0, opts.token.length)===opts.token) {
      var msg = data.substr(opts.token.length)
      msg = msg.split(':')
      stream.emit(msg.shift().toLowerCase(), msg.join(':'));
    }

  }).on('end', function () {
    debug(opts)
  });

  return stream;
};