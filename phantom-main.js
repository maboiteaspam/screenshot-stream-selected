/* global phantom,document,window,btoa */
'use strict';
var system = require('system');
var Page = require('phantom-event-stream/phantom-helper.js').Page;
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

// listen for events sent from browser context
pageHelper.onMessage = function (event, msg) {
// SCREENTHIS: is an event sending a css selector to screen shoot
  if(event.match(/^SCREENTHIS/)) {
    selectorsToScreen.push(
      JSON.parse(
        msg.replace(/^SCREENTHIS/, '')
      )
    )
// TOKEN: is an event to indicate the page is ready to be screen shot
  }else if (event.match(/^TOKEN/)
    && userScriptReadyToken===msg) {
    userScriptIsReady = true;
  }
};


// open the page with phantom
pageHelper.open(opts.url, function () {

  // By now,
  // wait for TOKEN: event to trigger the screenshots.
  // screenshots arereceived via SCREENTHIS: event.
  setInterval(function () {
    if (userScriptIsReady) {
      clearTimeout(executeScriptTimeout);
      setTimeout(screenThemAll, opts.delay * 1000);
    }
  }, 20);

  // using all collected selectors,
  // clip the screen to their offset,
  // then render the screen as base64 encoded picture.
  // foreach screenshot, emit SAVETHIS: event, then quit.
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

  // Insert a token the page will use to signal it s ready to screen.
  page.evaluate(function (token) {
    window.endToken = token;
  }, userScriptReadyToken);

  // A timeout to prevent dead process ect
  opts.timeout = opts.timeout || 30;

  var executeScriptTimeout = setTimeout(function () {
    userScriptIsReady = true;
  }, opts.timeout * 1000);

});
