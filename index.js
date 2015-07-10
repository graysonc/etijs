var user        = require('./user');
var request     = require('request');
var cheerio     = require('cheerio');
var querystring = require('querystring');

var ETI_BASE_URL = 'https://endoftheinter.net/';

function Eti(params) {

  var self = this;

  this.username = params.username;
  this.password = params.password;
  this.cookie = null;

  this.login = function (callback) {
    var requestOptions = {
      url: ETI_BASE_URL,
      headers: {
        'User-Agent': 'request.js via github.com/graysonc/yetibot',
      },
      jar: true,
      strictSSL: false,
      method: "POST",
      form: {
        b: self.username,
        p: self.password,
        r: ''
      },
    };

    // Who cares what the response is, we want the delicious cookie
    request.post(requestOptions, function (err, res, body) {
      self.cookie = res.headers['set-cookie'][0];
      callback(err, res, body);
    });
  };

  this.getMessage = function (msgId, topicId, callback) {
    var msgUrl = 'http://boards.endoftheinter.net/message.php';

    var requestOptions = {
      url: msgUrl,
      headers: {
        'User-Agent': 'request.js via github.com/graysonc/yetibot',
        'Cookie': self.cookie
      },
      qs: {
        id: msgId,
        topic: topicId,
        r: 99999
      },
      jar: true,
      strictSSL: false,
      method: 'GET'
    };

    request(requestOptions, function (err, res, body) {
      if (err) {
        callback(err);
      } else {
        /* Get rid of extra indentation */
        $ = cheerio.load(body);
        var content = sanitizeMessage($('.message').text())
        callback(null, content);
      }
    });
  };

  this.getUser = function (userId, callback) {
    var userUrl = 'http://endoftheinter.net/profile.php';

    var requestOptions = {
      url: userUrl,
      headers: {
        'User-Agent': 'request.js via github.com/graysonc/yetibot',
        'Cookie': self.cookie
      },
      qs: {
        user: userId
      },
      jar: true,
      strictSSL: false,
      method: 'GET'
    };

    request(requestOptions, function (err, res, body) {
      if (err) {
        callback(err);
      } else {
        callback(null, user.parseUser(body));
      }
    });
  };

  function sanitizeMessage(msg) {
    return msg.split('\n')
    .map(function unindent(line) {
      var charArray = line.split();
      while (charArray[0] === ' ') {
        charArray.shift();
      }
      return charArray.join();
    })
    .map(function sanitizeSpoilers(line) {
      var textSpoilerRe = /<spoiler \/><spoiler>.*<\/spoiler>onDOMContentLoaded\(function\(\){new llmlSpoiler\(\$\(".*"\)\)}\)/gi;
      var imageSpoilerRe = /<spoiler \/><spoiler>onDomContentLoaded\(function\(\){new ImageLoader\(\$\(".*"\), "(.*?)", (\d+), (\d+)\)}\)<\/spoiler>onDOMContentLoaded\(function\(\){new llmlSpoiler\(\$\(".*"\)\)}\)/gi;

      while (line.search(imageSpoilerRe) > -1) {
        var matches = imageSpoilerRe.exec(line);
        line = line.replace(matches[0], ('<spoilered image at http:' + matches[1] + '>').replace(/\\\//g, '/'));
      }

      while (line.search(textSpoilerRe) > -1) {
        var matches = textSpoilerRe.exec(line);
        line = line.replace(matches[0], '<spoiler />');
      }

      return line;
    })
    .map(function sanitizeImages(line) {
      var imageRe = /onDOMContentLoaded\(function\(\){new ImageLoader\(\$\(".*?"\), "(.*)", 614, 614\)}\)/
      while (line.search(imageRe) > -1) {
        var matches = imageRe.exec(line);
        line = line.replace(matches[0], ('<image at ' + 'http:' + matches[1] + '>').replace(/\\\//g, '/'));
      }
      return line;
    })
    .join('\n');
  }
}

module.exports = Eti;
