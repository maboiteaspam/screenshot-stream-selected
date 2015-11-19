#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2));

if (argv.verbose) process.env['DEBUG'] = 'screenshot-stream'

var fs = require('fs');
var debug = require('debug')('screenshot-stream');
var path = require('path');
var express = require('express');
var phantomStream = require('./phantom-stream');


var opts = {};

opts.path     = argv.path     || process.cwd();
opts.url      = argv.url      || 'http://localhost:3000/index.html';
opts.size     = argv.size     || "1024x768";
opts.delay    = argv.delay    || 0.5;
opts.scale    = argv.scale    || 1;
opts.es5shim  = argv.es5shim  || null;
opts.format   = argv.format   || 'png';
opts.output   = argv.output   || 'dist/';
opts.timeout  = argv.timeout  || 3;

opts.cookies  = 'cookies' in argv ? JSON.parse(argv.cookies) : [];

opts.script   = argv.script || path.join(__dirname, 'public', 'screenshot.js');
opts.selectorHelper = argv.selectorHelper || path.join(__dirname, 'public', 'css-selector-generator.min.js');

if (opts.format === 'jpg') {
  opts.format = 'jpeg';
}

if (fs.existsSync(opts.path)===false) return console.error('public ww root path does not exists\nplease check this is a correct path ' + opts.path);
if (fs.existsSync(opts.output)===false) fs.mkdirSync(opts.output)


debug(opts)

var app = express();

if(!opts.script.match(/http:/)) app.use(express.static(path.dirname(opts.script)));
if(!opts.selectorHelper.match(/http:/)) app.use(express.static(path.dirname(opts.selectorHelper)));

app.use(express.static(opts.path));
var server = app.listen(3000);

if(!opts.script.match(/http:/)) opts.script = "/" + path.basename(opts.script);
if(!opts.selectorHelper.match(/http:/)) opts.selectorHelper = "/" + path.basename(opts.selectorHelper);

phantomStream(opts.url, opts.size, opts)
  .on('savethis', function (b){
    b = JSON.parse(b)
    debug('got '+b.file+' picture length (b64) '+ b.img.length)
    var file = path.join(opts.output, b.file);
    var d = path.dirname(file);
    if (fs.existsSync(d)===false) fs.mkdirSync(d)
    fs.writeFileSync(file, new Buffer(b.img, 'base64'))
  }).on('screenthis', function (d){
    debug('screenthis : '+d)
  }).on('token', function (d){
    debug('token : '+d)
  }).on('data', function (d){
    /* !!! for some reasons, it is required to bind data to receive end event */
    console.log('PAGE IS TALKING : '+d)
  }).on('token', function (d){
    console.log('Got your token ' + d)
    console.log('Starting to shoot')
  }).on('block', function (d){
    console.log('Got a block to screen ' + d.file)
  }).on('warn', function (d){
    console.error('Got warning !!')
    console.error(d)
  }).on('error', function (d){
    console.error('Got error !!')
    console.error(d)
  }).on('end', function (){
    console.log('All done !!')
    server.close();
  })

process.on('SIGINT', function () {
  server.close();
})