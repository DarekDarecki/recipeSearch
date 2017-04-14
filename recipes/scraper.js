const request = require('request');
const cheerio = require('cheerio');
const lemma = require('../lemma');
const Model = require('../db/model');
const db = require('../db/db');

db.connectToDb();

var scraper = {

	number: 10580,
	recipesSaved: 1,

	generateUrl: function (number) {
		// 9050 - 9150
		console.log(number);
		var url = 'http://polki.pl/przepisy/haha,' + number + ',przepis.html';
		this.parsePage(url, function (err, model) {
			if (scraper.number < 11000) {
				if (err) {
					process.stdout.write('-');
				} else {
					scraper.save(model);
				};
				scraper.generateUrl(++scraper.number);
			} else {
				console.log('\nSaved successfully ' + scraper.recipesSaved + ' recipes.');
				db.disconnect();
			};
		});
	},

	parsePage: function (url, callback) {
		var model;
		var recipeUrl = url;

		request(url, (err, response, body) => {
			if (err) {
				console.log(err);
			} else {
				var $ = cheerio.load(body);
				var isNotFound = $('body').hasClass('notfound');
				if (isNotFound) {
					return callback(new Error('Page not found.'));
				}
				var ingredients = $('.components ul li').text();
				var ingredient = ingredients.replace(/\r/g, '').trim().split('\n');
				var title = $('.title-box h1').text();
				var url = recipeUrl;
				var imageUrl = $('article img:first-of-type').attr('src');
				var directions = [];
				$('.recipe-text ol li').each(function () {
					directions.push($(this).text().replace(/\n/g, ''))
				});
				if (directions.length === 0) {
					$('.recipe-text div').each(function () {
						var xd = $(this).text().replace(/\n\n/g, '\n').split('\n');
						for (var i = 0; i < xd.length; i++) {
							if (/^\d/.test(xd[i])) {
								directions.push(xd[i].replace(/^\d. /, ''))
							}
						}
					})
				}

				var keywords = [];

				var strings = ingredients.replace(/[\r,\d!@#$%^&*()_+,.;'"/?]/g, '').replace(/\n/g, ' ').toLocaleLowerCase().split(' ');
				for (var i = 0; i < strings.length; i++) {
					if (strings[i].length > 2) {
						keywords.push(lemma.getLemmaOf(strings[i]));
					}
				};
				model = {
					title: title,
					url: url,
					imageUrl: imageUrl,
					ingredients: ingredient,
					ingredientsKeywords: keywords,
					directions: directions
				};
				callback(null, model);
			};
		});
	},
	save: function (data) {
		model = new Model.model(data);
		model.save(function (err) {
			if (err) {
				console.log(err);
			} else {
				process.stdout.write('#');
				scraper.recipesSaved++;
			};
		});
	}
}

scraper.generateUrl(scraper.number);
