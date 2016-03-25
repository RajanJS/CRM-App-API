// BASE SETUP
// ======================================
'use strict';
// CALL THE PACKAGES --------------------
var express = require('express'), // call express
	app = express(), // define our app using express
	bodyParser = require('body-parser'), // get body-parser
	morgan = require('morgan'), // used to see log of requests
	mongoose = require('mongoose'), // for working with our databae
	config = require('./config');
	//var path = require('path');

// APP CONFIGURATION ---------------------
// use body parser so we can grab information from POST requests
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());
// configure our app to handle CORS requests
app.use(function(req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
	next();
});
// log all requests to the console
app.use(morgan('dev'));
// DB CONFIGURATION -----------------------
// connect to our database (hosted on modulus.io)
mongoose.connect(config.database);
// basic route for the home page
app.get('/', function(req, res) {
	res.send('Welcome to the home page!');
});
// set static files location
// used for requests that our frontend will make
// app.use(express.static(__dirname + '/public'));
// ROUTES FOR OUR API =================
// ====================================
// API ROUTES ------------------------
var apiRoutes = require('./app/routes/api')(app, express);
app.use('/api', apiRoutes);
// MAIN CATCHALL ROUTE ---------------
// SEND USERS TO FRONTEND ------------
// has to be registered after API ROUTES
// app.get('*', function(req, res) {
// 	res.sendFile(path.join(__dirname + '/public/app/views/index.html'));
// });
// START THE SERVER
// ====================================
app.listen(config.port);
console.log('Magic happens on port ' + config.port);