var mongoose = require("mongoose")

mongoose.Promise = global.Promise;

var RecipeSchema = new mongoose.Schema({
	title: String,
    url: String,
	imageUrl: String,
	ingredients: Array,
	ingredientsKeywords: Array,
	directions: Array
});
module.exports = {
    model: mongoose.model('Recipe', RecipeSchema)
};
