var cheerio     = require('cheerio');
// Parsing utilities that take ETI pages and give back useful objects

// Thanks github.com/shaldengeki/albatross
function User(html) {
  this.name = getEnclosedString(
      html,
      '<th colspan="2">Current Information for ',
      '</th>'
      );

  this.accountStatus = getEnclosedString(
      html,
      '<td>Status</td>\s+<td>',
      '</td>'
      ) || 'In Good Standing';

  this.reputation = getEnclosedString(
      html,
      '<td>Reputation</td><td style="line-height:1.6em">',
      '</td>'
      )
    .split('&bull;')
    .map(function extractRep(repLine) {
      return /\[<a href="\/\/boards.endoftheinter.net\/topics\/.*">(.*)<\/a>\]:&nbsp;(\d+)&nbsp;/
      .exec(repLine);
    })
  .map(function formatRep(rep) {
    if (rep) {
      return {
        'Tag': rep[1],
        'Score': rep[2]
      }
    }
  })
  .filter(function removeUndefined(item) {
    return item != undefined;
  });
}

function Topic(html) {

  var self = this;

  this.html = html;

  this.viewers = function getViewers(html) {
    $ = cheerio.load(html);
    var infobar = $('.infobar');

    for (var i = 0; i < infobar.length; i++) {

      var info = infobar[i];

      if (info.children[0].data.indexOf("There are currently ") > -1) {

        var rawViewers = getEnclosedString(info.children[0].data,
            "There are currently ", " people reading this topic"); 
        return parseInt(rawViewers);

      } else if (info.children[0].data.indexOf("There is currently ") > -1) {

        var rawViewers = getEnclosedString(info.children[0].data,
            "There is currently ", " person reading this topic"); 
        return parseInt(rawViewers);
      }
    }

  }(this.html);

  return this;
}

// Takes a message.php html output and returns the message text
function Message(html) {
  $ = cheerio.load(html);
  this.msg = $('.message').text()
    .split('\n')
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

/* Get string in text enclosed by leftBound on the left and rightBound on the right.
   If rightBound is not specified then use leftBound instead. */
function getEnclosedString (text, leftBound, rightBound) {
  var selectorRe = new RegExp(leftBound + "(.*)" + rightBound);
  if (text.search(selectorRe) > -1) {
    return selectorRe.exec(text)[1];
  }
  return null;
}

exports.Message = Message;
exports.Topic = Topic;
