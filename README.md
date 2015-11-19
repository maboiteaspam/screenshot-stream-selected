# screenshot-stream-selected

Capture screenshot of a selected elements within a page website and return them using a stream.

A variation of [screenshot-stream](https://github.com/kevva/screenshot-stream)

I do that because i could not find a decent module to produce `svg to png` the way i need.

## Get started

To get started you need to produce an HTML file and prepare the elements you d like to screen.

They can be any valid HTML thing you want to do.

Then, for each part, or block, of the page you d like to screen, simply add a new html attribute,

```html
 data-shoot-file="[file path to save the content, minus extension]"
```

That's it. You can run the `bin` and get your pictures.


#### demo

See [my icons template](/playground/public/index.html).

As you ll see, i have a bunch *** of icons to produce, so i used some `jquery` run in the browser to give me some help.

I run it with

```sh
screenshot-stream-selected --path=playground/public --verbose
```

It produces a png for each of those icons with sizes, color ect in `dist/`.


#### tips

To prepare your file the right way,
i suggest you use `nws`, to quickly spawn a webserver then starts to edit your icons template.

see [nws](https://github.com/KenPowers/nws)


#### tips

To debug your page under phantomjs, use `delay` option.

start the program like this

```sh
screenshot-stream-selected --path=playground/public --delay 100
```

then open `http://localhost:3000/index.html` in your browser.


#### tips

Do not use jpeg format to screen set of icons,
it does `not` support `transparency`,
thus it produces black images.


## Install

```sh
    npm i maboiteaspam/screenshot-stream-selected -g
```

## Usage

`screenshot-stream-selected` is a node binary to install globally on your computer.

You can then run it like this,

```sh
screenshot-stream-selected --path=playground/public
screenshot-stream-selected --path=playground/public --verbose
```

## Command line options

```sh
screenshot-stream-selected [options]

options

    path                Directory path to your local www root
                            /some/path/
    url                 The url to screen
                            http://localhost:3000/index.hml
    size                The size of the screen before the screenshots starts
                            (1024x768)
    delay               Number of seconds to wait before the screen is started.
                            .5
    scale               An integer to scale the resulting screenshot
                            1
    es5shim             A shim for es5
                            see [es5-shim](https://github.com/es-shims/es5-shim)
    format              A picture file format (png|jpeg)
                            jpg
                            see http://phantomjs.org/api/webpage/method/render-base64.html
    output              A directory path where the pictures are recorded
                            cwd + /dist
    cookies             A JSONed array of cookies
                            see [the code](/blob/master/stream.js#L32)
    script              A script to interface with this pahantomjs API to screen your blocks.
                            see [the code](/blob/master/public/screenshot.js)
    selectorHelper      A script helper to generate css selector path. It s tightly linked to script.
                            see [css-selector-generator](https://github.com/fczbkk/css-selector-generator/)
    userAgent           A value to forge the user agent request header.
    username            A value to send to validate http authentication.
    password            A value to send to validate http authentication.
```

## Credits

Credits goes to each maintainer of module dependencies. See the `package.json`.

Special one for `kevva` and `Sindre Sorhus` for their original work on `pageres` module.
