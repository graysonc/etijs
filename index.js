var parse       = require('./parse'),
		Message     = parse.Message,
		Topic       = parse.Topic;
var request     = require('request');

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

	// Make a request to ETI. returns the body, not the whole response.
	this.etiRequest = function (page, args, callback) {
		// example: message.php
		var msgUrl = 'http://boards.endoftheinter.net/' + page;

		// hidden form
		args.r = 99999;

		var requestOptions = {
			url: msgUrl,
			headers: {
				'User-Agent': 'request.js via github.com/graysonc/etijs',
				'Cookie': self.cookie
			},
			qs: args,
			jar: true,
			strictSSL: false,
			method: 'GET'
		};

		request(requestOptions, function (err, res, body) {
			if (err) {
				callback(err);
			} else {
				callback(null, body);
			}
		});
	}

	this.getMessage = function (msgId, topicId, callback) {
		this.etiRequest('message.php', {
			id: msgId,
			topic: topicId
		}, function (err, body) {
			if (err) {
				callback(err);
			} else {
				callback(null, new parse.Message(body));
			}
		});
	};

	// Call callback the Nth page of a topic.
	this.getPosts = function (topicId, n, callback) {
	};

	// Call callback with the view count of a topic
	this.getViewing = function (topicId, callback) {
		this.getTopic(topicId, function (err, topic) {
			if (err) {
				callback(err);
			} else {
				callback(null, topic.viewers);
			}
		});
	};

	this.getTopic = function (topicId, callback) {
		this.etiRequest('showmessages.php', {
			topic: topicId,
		}, function (err, body) {
			if (err) {
				callback(err);
			} else {
				callback(null, new parse.Topic(body));
			}
		});
	}

	this.getUser = function (userId, callback) {
		this.etiRequest('profile.php', {
			user: userId
		}, function (err, body) {
			if (err) {
				callback(err);
			} else {
				callback(null, new parse.User(body));
			}
		});
	};
}

module.exports = Eti;
