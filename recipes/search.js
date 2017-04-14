const Model = require('../db/model');

var search = {

	recipesFound: [],

	contains: function (arr, id) {
		for (var i = 0; i < arr.length; i++) {
			if (arr[i].id.toString() === id) {
				return i;
			};
		};
		return false;
	},

	searchForRecipes: function (queries, callback) {
		search.makeSearch(queries, 'and', function (recipesFoundForAll) {
			if (recipesFoundForAll.length === 0) {
				callback('sendMessage');
                var kupa = []
				for (let i = 0; i < queries.length; i++) {
					search.makeSearch(queries[i], 'or', function () {
						if (i === queries.length - 1) {
							callback(search.recipesFound);
						};
					})
				}
			} else {
				callback(recipesFoundForAll);
			}
		});
	},

	makeSearch: function (queries, mode, callback) {
		if (mode === 'and') {
			console.log('and');
			Model.model.find({
				ingredientsKeywords: {
					$all: queries
				}
			}, function (err, result) {
				if (err) {
					console.log(err);
				} else {
                    var recipesFoundForAll = [];
					search.pushResultsToArray(result, recipesFoundForAll, function (recipesFoundForAll) {
						callback(recipesFoundForAll);
					})
				}
			});
		} else if (mode === 'or') {
			console.log('or');
			Model.model.find({
				$or: [{
					ingredientsKeywords: queries
				}, {
					title: new RegExp("\\b" + queries + "\\b", "i")
				}]
			}, function (err, result) {
				if (err) {
					console.log(err);
				} else {
					search.pushResultsToArray(result, search.recipesFound, function () {
						callback(search.recipesFound);
					})
				}
			});
		}
	},

	pushResultsToArray: function (result, array, callback) {
		for (var i = 0; i < result.length; i++) {
			var recipe = {
				id: result[i]._id,
				title: result[i].title,
				url: result[i].url,
				image: result[i].imageUrl,
				ingredients: result[i].ingredients,
				directions: result[i].directions,
				accuracy: 1,
			}
			var found = search.contains(array, recipe.id.toString());
			if (found !== false) {
				array[found].accuracy++;
				//recipesFound[found].whichWasFound.push(ingredient);
			} else {
				array.push(recipe);
			};
		};
		callback && callback(array);
	}
};

module.exports = search;
