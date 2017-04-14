var dictionary = require('./dict.json');

module.exports = {
     searchString : function(string, element) {
        for (var i = 0; i < element.words.length; i++) {
            if (element.words[i] === string){
                return true;
            }
        }
    },
    getLemmaOf : function(string){
        var object = dictionary.entry.filter(module.exports.searchString.bind(this, string));
        return (object.length) ? object[0].lemat : -1;
    }
}
