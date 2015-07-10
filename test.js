var Eti = require('./index');

var eti = new Eti({
  username: 'Psyflame',
  password: 'lol, nope'
});

eti.login(function () {
  eti.getUser('251', console.log);
});
