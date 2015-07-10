/* Get string enclosed by leftBound on the left and rightBound on the right.
   If rightBound is not specified then use leftBound instead. */
function getEnclosedString (text, leftBound, rightBound) {
  var selectorRe = new RegExp(leftBound + "(.*)" + rightBound);
  if (text.search(selectorRe) > -1) {
    return selectorRe.exec(text)[1];
  }
  return null;
}

module.exports = {

  /* Parse a profile.php page. Based off github.com/shaldengeki/albatross */
  parseUser: function (body) {
    var user = {};
    user.name = getEnclosedString(
      body,
      '<th colspan="2">Current Information for ',
      '</th>'
    );

    user.accountStatus = getEnclosedString(
      body,
      '<td>Status</td>\s+<td>',
      '</td>'
    ) || 'In Good Standing';

    var reputation = getEnclosedString(
      body,
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


    user.reputation = reputation;
    return user;
  }
};

