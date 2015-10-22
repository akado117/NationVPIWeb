/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();

var port = (process.env.VCAP_APP_PORT || 3000);
var host = (process.env.VCAP_APP_HOST || 'localhost');
var MONGOHQ_URL="mongodb://nation:nation@candidate.53.mongolayer.com:10617/NationTest"



var mongoose = require('mongoose');
mongoose.connect(MONGOHQ_URL);

//sets connection errors to show in console
var db = mongoose.connection;
db.on('error',console.error.bind(console, 'connection error: '));
db.once('open', function(callback) {
	console.log("Database Connected");
});

//define schemas - basically the interface for a document 
var kittySchema = mongoose.Schema({
	name: String
});
kittySchema.methods.speak = function () {
	var greeting = this.name
	? "Meow name is " + this.name
	: "I don't have a name";
	console.log(greeting);
}



//define models - these are what are used to interact with database
var Kitten = mongoose.model('Kitten', kittySchema);





var silence = new Kitten({name : 'Silence'});
console.log(silence.name);
var fluffy = new Kitten({name : 'Fluffy'});

fluffy.save(function (err, fluffy) {
	if(err) return console.error(err);
	fluffy.speak();
});


//define model
var Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

var BlogPost = new Schema({
	auther	: ObjectId,
	title 	: String,
	body	: String,
	date	: Date
});

//define another schema
var Comment = new Schema({
	name	: {type: String, default: 'Somewords'},
	age		: {type: Number, min: 18, index: true},
	bio		: {type: String, match: /[a-z]/},
	date 	: {type: Date, default: Date.now},
	buff 	: Buffer
});
//setter
Comment.path('name').set(function (v) {
	return capitalize(v);
})
//middleware
Comment.pre('save', function (next) {
	notify(this.get('email'));
	next();
});






// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
app.listen(appEnv.port, function() {

	// print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
