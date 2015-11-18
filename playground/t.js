var sshot = require('..')
var express = require('express');

var app = express();
app.use(express.static(__dirname + '/public'));
var server = app.listen(3000);

sshot("http://localhost:3000/index.html", "1024*768", {})
.on('data', function (b){
    console.log(b+'')
  })
.on('block', function (b){
    console.log(b)
  })
.on('end', function (b){
    console.log('end')
    server.close();
  })