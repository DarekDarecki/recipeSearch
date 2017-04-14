const Model = require('../db/model');

var views = {

	lookForRecipe: function (id, callback) {
		Model.model.findById(id, function (err, result) {
			if (err) {
				console.log(err);
			} else {
                var recipe = {
                    title: result.title && result.title,
                    image: result.imageUrl,
                    url: result.url && result.url,
                    directions: result.directions,
                    ingredients: result.ingredients
                };
                callback && callback(recipe);
			}
		});
	},

};

module.exports = views;
