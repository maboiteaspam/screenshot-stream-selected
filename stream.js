/* global phantom,document,window,btoa */
'use strict';
var system = require('system');
var page = require('webpage').create();
var objectAssign = require('object-assign');
var opts = JSON.parse(system.args[1]);

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

// Tokens to indicate and detect the end of user script execution
var userScriptDone = false;
var userScriptEndToken = 'shoot-token-' + (new Date().getTime());

// an array of css selectors to screenshot
var selectorsToScreen = [];

phantom.onError = function (err, trace) {
  // enforce end of user script to prevent dead process
  console.error([
    'PHANTOM ERROR: ' + err,
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

// watch for console.log message sent from page context
page.onConsoleMessage = function (msg) {
// to catch elements to screen
  if(msg.match(/^SCREENTHIS:/)) {
    selectorsToScreen.push(
      JSON.parse(
        msg.replace(/^SCREENTHIS:/, '')
      )
    )
  }else if (msg.match(/^TOKEN:\s*/)
    && userScriptEndToken===msg.replace(/^TOKEN:\s*/, '')) {
    userScriptDone = true;
    console.error(msg);
  } else {
    console.log(msg);
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

  // using all collected SCREENTHIS message, screen them then quit.
  var screenThemAll = function () {
    selectorsToScreen.forEach(function (selector) {
      page.clipRect = page.evaluate(function (el) {
        return document
          .querySelector(el)
          .getBoundingClientRect();
      }, selector.selector);
      console.error("SAVETHIS:" + JSON.stringify({img:page.renderBase64(opts.format), file: selector.file}));
    })
    phantom.exit();
  };

  // Insert end token into the page context
  page.evaluate(function (token) {
    window.endToken = token;
  }, userScriptEndToken);

  // Update page render with help of the user script.
  page.includeJs(opts.selectorHelper);
  page.includeJs(opts.script);

  // A timeout to prevent dead process ect
  opts.timeout = opts.timeout || 30;
  var executeScriptTimeout = setTimeout(function () {
    userScriptDone = true;
  }, opts.timeout * 1000);

  // By now,
  // wait for SAVETHIS: message and collect them
  // wait for TOKEN: message and trigger the screenshots
  setInterval(function () {
    if (userScriptDone) {
      clearTimeout(executeScriptTimeout);
      setTimeout(screenThemAll, opts.delay * 1000);
    }
  }, 20);

});