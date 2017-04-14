const lemma = require('../lemma');
const request = require('request')
const search = require('../recipes/search');
const secrets = require('../secrets');

var messengerAPI = {

	token: secrets.token,
	userInfo: [],

	receivedMessage: function (event) {
		var senderID = event.sender.id;
		var recipientID = event.recipient.id;
		var timeOfMessage = event.timestamp;
		var message = event.message;

		console.log("Received message for user %d and page %d with message:", senderID, recipientID);
		console.log(JSON.stringify(message));

		var messageId = message.mid;

		var messageText = message.text;
		var messageAttachments = message.attachments;

		if (messageText) {
			console.log(messageText);
			this.getUserInfo(senderID, function () {
					messengerAPI.recognizeMessage(messageText, senderID);
				})
				//this.sendListMessage(senderID);
		} else if (messageAttachments) {
			this.sendTextMessage(senderID, "Niestety nie rozumiem...");
		} else if (event.postback && event.postback.payload) {
			console.log(event.postback.payload);
		}
	},

	getUserInfo: function functionName(senderID, callback) {
		request({
			uri: 'https://graph.facebook.com/v2.6/' + senderID + '?fields=first_name,last_name,profile_pic,locale,gender&access_token=' + this.token,
			method: 'GET'
		}, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				messengerAPI.userInfo = JSON.parse(body);
				callback && callback();
			} else {
				console.log(error, response);
			}
		})
	},

	recognizeMessage: function (message, senderID) {
		var words = message.toLowerCase().replace(/[^\w\sąćęńłóśżź]/gi, '').match(/\S+/g);
		var thisLemma;

		for (var i = 0; i < words.length; i++) {
			thisLemma = lemma.getLemmaOf(words[i]);
			if (thisLemma !== -1) {
				words[i] = thisLemma;
			}
		}
		var greetings = ['cześć', 'elo', 'siema', 'czesc', 'hej', 'hejka', 'cześc', 'czesć', 'yo', 'joł', 'jol', 'witam', 'cze', 'siemanko', 'dobry', 'hi', 'hello'];

		var isFound = false;

		for (var i = 0; i < greetings.length; i++) {
			if (words.indexOf(greetings[i]) !== -1) {
				isFound = true;
				var reply = {
					recipient: {
						id: senderID
					},
					message: {
						text: greetings[i].charAt(0).toUpperCase() + greetings[i].slice(1) + ' ' + messengerAPI.userInfo.first_name + '! Napisz mi co masz w lodówce a znajdę Ci jakiś pyszny przepis 😋'
					},
				};
				messengerAPI.typingAnimation(senderID, 'typing_on', function () {
					messengerAPI.callSendAPI(reply, function () {
						messengerAPI.typingAnimation(senderID, 'typing_off')
					});
				});
				break;
			}
		}

		if (!isFound) {
			this.sendListMessage(senderID, words);
		}
	},

	typingAnimation: function (recipientId, action, callback) {
		var messageData = {
			recipient: {
				id: recipientId
			},
			sender_action: action
		};
		messengerAPI.callSendAPI(messageData);
		callback && callback();
	},

	sendListMessage: function (recipientId, queries) {
		console.log('queries: ' + queries);
		search.searchForRecipes(queries, function (arr) {
			search.recipesFound = [];
			if (arr === 'sendMessage') {
				messengerAPI.sendTextMessage(recipientId, 'Nie znalazłem przepisów zawierających WSZYSTKIE podane składniki ale szukam teraz najodpowiedniejszych przepisów 🤔')
			} else {
				var results = arr.sort(function compareNumbers(a, b) {
					return b.accuracy - a.accuracy;
				});
				var message;
				switch (results.length) {
				case 0:
					message = {
						text: 'Niestety nie znalazłem w mojej bazie przepisów nic co by Ci odpowiadało 😓'
					}
					break;
				case 1:
					message = {
						"attachment": {
							"type": "template",
							"payload": {
								"template_type": "generic",
								"elements": [{
									"title": results[0].title,
									"image_url": results[0].image,
									"buttons": [{
										"type": "web_url",
										"url": "https://recipefinder1502.herokuapp.com/recipe/" + results[0].id,
										"title": "Zobacz"
									}]
								}]
							}
						}
					};
					break;
				default:
					var elements = [];
					var count = (results.length > 4) ? 4 : results.length;

					for (var i = 0; i < count; i++) {
						console.log('sended: ' + results[i].title);
						var element = {
							"title": results[i].title,
							"image_url": results[i].image,
							"default_action": {
								"type": "web_url",
								"url": "https://recipefinder1502.herokuapp.com/recipe/" + results[i].id,
								"messenger_extensions": true,
								"webview_height_ratio": "tall"
							},
							"buttons": [{
								"title": "Zobacz",
								"type": "web_url",
								"url": "https://recipefinder1502.herokuapp.com/recipe/" + results[i].id,
								"messenger_extensions": true,
								"webview_height_ratio": "tall"
							}]
						}
						elements.push(element);
					};
					message = {
						"attachment": {
							"type": "template",
							"payload": {
								"template_type": "list",
								"elements": elements
							}
						}
					};

				};

				var response = {
					recipient: {
						id: recipientId
					},
					message: message
				};

				messengerAPI.typingAnimation(recipientId, 'typing_on', function () {
					messengerAPI.callSendAPI(response, function () {
						messengerAPI.typingAnimation(recipientId, 'typing_off')
					});
				});
			}
		});

	},

	sendTextMessage: function (recipientId, messageText) {
		var messageData = {
			recipient: {
				id: recipientId
			},
			message: {
				text: messageText
			},
		};
		messengerAPI.typingAnimation(recipientId, 'typing_on', function () {
			messengerAPI.callSendAPI(messageData, function () {
				messengerAPI.typingAnimation(recipientId, 'typing_off')
			});
		});
	},

	callSendAPI: function (messageData, callback) {
		request({
			uri: 'https://graph.facebook.com/v2.6/me/messages',
			qs: {
				access_token: this.token
			},
			method: 'POST',
			json: messageData

		}, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				var recipientId = body.recipient_id;
				var messageId = body.message_id;

				callback && callback();

				console.log("Successfully sent generic message with id %s to recipient %s",
					messageId, recipientId);
			} else {
				console.error("Unable to send message.");
			}
		});
	}
}

module.exports = messengerAPI;
