const db = require('./db/db');
const search = require('./recipes/search');
const messengerAPI = require('./messenger/messengerAPI');
const express = require('express');
const request = require('request');
const mustacheExpress = require('mustache-express');
const bodyParser = require('body-parser');
const views = require('./views/views');
const secrets = require('./secrets');

const app = express();

var jsonParser = bodyParser.json();

app.set('port', (process.env.PORT || 5000));
db.connectToDb();
app.engine('html', mustacheExpress());
app.set('view engine', 'mustache');
app.set('views', __dirname + '/views/templates');
app.use(express.static(__dirname + '/static'));


app.get('/', function (req, res) {
	res.send('Hello world, I am a chat bot! Go to <a href="https://www.facebook.com/Szybkie-przepisy-317977181931573/?fref=ts">https://www.facebook.com/Szybkie-przepisy-317977181931573/?fref=ts</a> and write to me (unfortunately in polish only).')
});

app.get('/recipe/:id', function (req, res) {
	var id = req.params.id;
	views.lookForRecipe(id, function (recipe) {
		res.render('recipe.html', recipe)
	})
})

app.get('/privacy', function (req, res) {
    res.send('You are free to use it.');
    res.sendStatus(200);
});

app.get('/webhook', function (req, res) {
	if (req.query['hub.mode'] === 'subscribe' &&
		req.query['hub.verify_token'] === secrets.token) {
		console.log("Validating webhook");
		res.status(200).send(req.query['hub.challenge']);
	} else {
		console.error("Failed validation. Make sure the validation tokens match.");
		res.sendStatus(403);
	}
});

app.post('/webhook', jsonParser, function (req, res) {
	var data = req.body;

	// Make sure this is a page subscription
	if (data.object === 'page') {

		// Iterate over each entry - there may be multiple if batched
		data.entry.forEach(function (entry) {
			var pageID = entry.id;
			var timeOfEvent = entry.time;

			// Iterate over each messaging event
			entry.messaging.forEach(function (event) {
				if (event.message) {
					messengerAPI.receivedMessage(event);
				} else {
					console.log("Webhook received unknown event: ", event);
				}
			});
		});
		res.sendStatus(200);
	}
});

// Spin up the server
app.listen(app.get('port'), function () {
	console.log('running on port', app.get('port'))
})
