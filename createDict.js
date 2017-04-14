var fs = require('fs');
var readline = require('readline');
var myJSON = {};
var entry = [];
var filename = process.argv[2];

var stream = fs.createReadStream(filename);

stream.on('error', function (err) {
	throw 'File not found.'
})

readline.createInterface({

		input: fs.createReadStream(filename),
		terminal: false,

	}).on('line', function (line) {

		var word = line.split(", ");
		var lemat = word[0];
		var words = [];
		for (var i = 0; i < word.length; i++) {
			words.push(word[i]);
		}
		entry.push({
			'lemat': lemat,
			'words': words
		})

	})
	.on('close', function () {

		myJSON = {
			entry
		}

		function searchString(string, element) {
			for (var i = 0; i < element.words.length; i++) {
				if (element.words[i] == string) {
					return true
				}
			}
		}
		var x = JSON.stringify(myJSON, null, 4);
		fs.writeFile('small.json', x, 'utf8', function (err) {
			if (err) {
				console.log(err);
			} else {
				console.log('Successfully saved your JSON');
			}
		});

	});
