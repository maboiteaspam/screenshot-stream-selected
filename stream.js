/* global phantom,document,window,btoa */
'use strict';
var system = require('system');
var page = require('webpage').create();
var objectAssign = require('object-assign');
var opts = JSON.parse(system.args[1]);
var log = console.log;

function formatTrace(trace) {
  var src = trace.file || trace.sourceURL;
  var fn = (trace.function ? ' in function ' + trace.function : '');
  return '→ ' + src + ' on line ' + trace.line + fn;
}

console.log = console.error = function () {
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

// an array of css selectors to screenshot
var selectorsToScreen = [];

phantom.onError = function (err, trace) {
  // enforce end of user script to prevent dead process
  console.error([
    'PHANTOM ERROR: ' + err,
    trace[0] ? formatTrace(trace[0]) : trace
  ].join('\n'));

  phantom.exit(1);
};

page.onError = function (err, trace) {
  console.error([
    'WARN: ' + err,
    trace[0] ? formatTrace(trace[0]) : trace
  ].join('\n'));
};

// watch for console.log message sent from page context

page.onConsoleMessage = function (msg) {
// to catch elements to screen
  if(msg.match(/^SCREENTHIS:/)) {
    selectorsToScreen.push(
      JSON.parse(
        msg.replace(/^SCREENTHIS:/, '')
      )
    )
  }
};

if (opts.es5shim) {
  page.onResourceReceived = function () {
    page.injectJs(opts.es5shim);
  };
}

page.viewportSize = {
  width: opts.width,
  height: opts.height
};

page.customHeaders = opts.headers || {};
page.zoomFactor = opts.scale;

page.open(opts.url, function (status) {
  if (status === 'fail') {
    console.error('Couldn\'t load url: ' + opts.url);
    phantom.exit(1);
    return;
  }


  var screenshotSelected = function () {
    if (selectorsToScreen.length) {
      selectorsToScreen.forEach(function (selector) {
        page.clipRect = page.evaluate(function (el) {
          return document
            .querySelector(el)
            .getBoundingClientRect();
        }, selector.selector);
        console.error("SAVETHIS:"+JSON.stringify({img:page.renderBase64(opts.format), file: selector.file}));
      })
    }
  };

  var screenThemAll = function () {
    screenshotSelected();
    phantom.exit();
  };

  setTimeout(screenThemAll, opts.delay * 1000);
});