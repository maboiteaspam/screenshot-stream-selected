var sshot = require('..')
var fs = require('fs');
var path = require('path');
var express = require('express');

var app = express();
app.use(express.static(__dirname + '/public'));
var server = app.listen(3000);

sshot("http://localhost:3000/index.html", "1024*768", {})
.on('data', function (b){
    //console.log(b+'')
  })
.on('block', function (b){
    var d = path.dirname(b.file);
    if (fs.existsSync(d)===false) fs.mkdirSync(path.dirname(b.file))
    fs.writeFileSync(b.file, new Buffer(b.img, 'base64'))
  })
.on('end', function (b){
    console.log('end')
    server.close();
  })