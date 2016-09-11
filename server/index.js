var express = require('express'),
app = express(),
port = process.env.PORT || 4000;

var options = {
  dotfiles: 'ignore',
  etag: true,
  extensions: ['htm', 'html', 'json'],
  index: false,
  maxAge: '1d',
  redirect: false,
  setHeaders: function (res, path, stat) {
    res.set('Access-Control-Allow-Origin', '*');
	res.set('Access-Control-Allow-Headers', 'accept, content-type');
  }
}

app.use(express.static(__dirname, options));
app.listen(port);
