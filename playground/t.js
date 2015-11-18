var sshot = require('..')
var fs = require('fs');
var path = require('path');
var express = require('express');

var app = express();
app.use(express.static(__dirname + '/public'));
var server = app.listen(3000);

sshot("http://localhost:3000/index.html", "1024*768", {})
.on('block', function (b){
    console.log('got '+b.file)
    var d = path.dirname(b.file);
    if (fs.existsSync(d)===false) fs.mkdirSync(path.dirname(b.file))
    fs.writeFileSync(b.file, new Buffer(b.img, 'base64'))
  }).on('data', function (d){
  /* !!! for some reasons, it is required to bind data to receive end event */
  }).on('end', function (){
    console.log('end')
    server.close();
  })