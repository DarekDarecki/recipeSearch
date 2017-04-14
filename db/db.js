const mongoose = require('mongoose');
const secrets = require('../secrets');

mongoose.Promise = global.Promise;

var connection = {

	connectToDb: function () {
		mongoose.connect('mongodb://' + secrets.dbUser + ':' + secrets.dbPassword + '@ds117109.mlab.com:17109/recipes', function () {
		//mongoose.connect('mongodb://localhost/recipes', function () {
			console.log('Connected to database.');
		})
	},

	disconnect: function () {
		mongoose.disconnect();
	}
}

module.exports = connection;
