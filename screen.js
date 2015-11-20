/* global phantom,document,window,btoa */
'use strict';
var system = require('system');
var Page = require('./phantom-helper').Page;
var opts = JSON.parse(system.args[1]);

var pageHelper = new Page(phantom, opts)
var page = pageHelper.page;

if (opts.es5shim) {
  page.onResourceReceived = function () {
    page.injectJs(opts.es5shim);
  };
}

// Tokens to indicate and detect the end of user script execution
var userScriptIsReady = false;
var userScriptReadyToken = 'shoot-token-' + (new Date().getTime());

// an array of css selectors to screenshot
var selectorsToScreen = [];

pageHelper.onMessage = function (event, msg) {
// to catch elements to screen
  if(event.match(/^SCREENTHIS/)) {
    selectorsToScreen.push(
      JSON.parse(
        msg.replace(/^SCREENTHIS/, '')
      )
    )
// to catch ready event
  }else if (event.match(/^TOKEN/)
    && userScriptReadyToken===msg) {
    userScriptIsReady = true;
  }
};

pageHelper.open(opts.url, function () {

  // using all collected SCREENTHIS message, screen them then quit.
  var screenThemAll = function () {
    selectorsToScreen.forEach(function (selector) {
      page.clipRect = page.evaluate(function (el) {
        if (!el) {
          console.log("Unknown selector " + el);
          console.log("Please report about it");
          console.log("Please report about it");
          console.log("Please report about it");
          return {top:0,left:0,right:0,bottom:0};
        }
        var sel = document.querySelector(el);
        if(!sel) {
          console.log("Unknown selector " + el);
          console.log("Please report about it");
          console.log("Please report about it");
          console.log("Please report about it");
          return {top:0,left:0,right:0,bottom:0};
        }
        return sel.getBoundingClientRect();
      }, selector.selector);

      selector.file = selector.file.replace(/([.]png|jpg|jpeg)$/, '')
      selector.file += '.' + opts.format.toLowerCase()

      pageHelper.emit('SAVETHIS',
        JSON.stringify({img: page.renderBase64(opts.format), file: selector.file})
      );
    })
    phantom.exit();
  };

  // Insert end token into the page context
  page.evaluate(function (token) {
    window.endToken = token;
  }, userScriptReadyToken);

  // Update page render with help of the user script.
  page.includeJs(opts.selectorHelper);
  page.includeJs(opts.script);

  // A timeout to prevent dead process ect
  opts.timeout = opts.timeout || 30;
  var executeScriptTimeout = setTimeout(function () {
    userScriptIsReady = true;
  }, opts.timeout * 1000);

  // By now,
  // wait for SCREENTHIS: message and collect them
  // wait for TOKEN: message and trigger the screenshots
  setInterval(function () {
    if (userScriptIsReady) {
      clearTimeout(executeScriptTimeout);
      setTimeout(screenThemAll, opts.delay * 1000);
    }
  }, 20);

});
