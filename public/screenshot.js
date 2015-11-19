/*
  This is a script injected into the
  phantomjs process.
  It provides screenThemAll and allDone function helpers.
  When you are all done with the generation of the page (async, js, css, whatever you need to do prior the render)
  just call

      screen.allDone()

  to tell the software that you are fine to screen your page.
 */
var screenshot = {
  screenThemAll: function () {
    var cssPathGen = new CssSelectorGenerator();
    var matches = document.querySelectorAll("div[data-shoot-file]");
    for( var index=0; index < matches.length; index++ ) {
      console.error("SCREENTHIS: " +
        JSON.stringify({
          file: matches[index].getAttribute('data-shoot-file'),
          selector: cssPathGen.getSelector(matches[index])
        })
      )
    }
  },
  allDone: function () {
    screenshot.screenThemAll();
    console.error("TOKEN: " +window.endToken)
  }
};

screenshot.allDone();
