/* global phantom,document,window,btoa */
'use strict';
var system = require('system');
var objectAssign = require('object-assign');

var Page = function (phantom, opts) {

  var page = require('webpage').create();

  function formatTrace(trace) {
    var src = trace.file || trace.sourceURL;
    var fn = (trace.function ? ' in function ' + trace.function : '');
    return '→ ' + src + ' on line ' + trace.line + fn;
  }

  console.log = function () {
    system.stdout.writeLine([].slice.call(arguments).join(' '));
  };

  console.error = function () {
    system.stderr.writeLine([].slice.call(arguments).join(' '));
  };

  if (opts.username && opts.password) {
    opts.headers = objectAssign({}, opts.headers, {
      Authorization: 'Basic ' + btoa(opts.username + ':' + opts.password)
    });
  }

  if (opts.userAgent) {
    page.settings.userAgent = opts.userAgent;
  }

  opts.cookies.forEach(function (cookie) {
    if (!phantom.addCookie(cookie)) {
      console.error('Couldn\'t add cookie: ' + JSON.stringify(cookie));
      phantom.exit(1);
    }
  });

  phantom.onError = function (err, trace) {
    console.error([
      'PHANTOM_ERROR: ' + err,
      formatTrace(trace[0]?trace[0]:trace)
    ].join('\n'));

    phantom.exit(1);
  };

  page.onError = function (err, trace) {
    console.error([
      'WARN: ' + err,
      formatTrace(trace[0]?trace[0]:trace)
    ].join('\n'));
  };

  page.viewportSize = {
    width: opts.width,
    height: opts.height
  };

  page.customHeaders = opts.headers || {};
  page.zoomFactor = opts.scale;


  opts.token = opts.token || 'speaker-token-' + (new Date().getTime());

  this.page = page;

  this.onMessage = function (){}

  var that = this;
// watch for console.log message sent from page context
  page.onConsoleMessage = function (msg) {
// to catch elements to screen
    var originalMsg = msg;
    if(msg.substr(0, opts.token.length)===opts.token) {
      msg = msg.substr(opts.token.length)
      msg = msg.split(':')
      that.onMessage(msg.shift(), msg.join(':'))
    }
    system.stderr.writeLine(originalMsg);
  };

  this.open = function (url, cb){
    page.open(url, function (status) {
      if (status === 'fail') {
        console.error('Couldn\'t load url: ' + opts.url);
        phantom.exit(1);
        return;
      }
      page.evaluateJavaScript("function(){window.phantomSpeakerToken = '" + opts.token + "';}");
      page.injectJs('public/phantom-speaker.js');
      cb(status)
    });
  };

  this.emit = function (event, data) {
    system.stderr.writeLine(opts.token+''+event.toUpperCase()+':'+data);
  };

  //return page;
};

module.exports = {
  Page: Page
};
