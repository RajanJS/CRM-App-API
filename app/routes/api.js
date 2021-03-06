 'use strict';

 var User = require('../models/user.model'), // imported the user model for db
 	jwt = require('jsonwebtoken'), // use jsonwebtoken module for auth 
 	config = require('../../config');

 // super secret for creating tokens
 var superSecret = config.secret;

 module.exports = function(app, express) {
 	// get an instance of the express router
 	var apiRouter = express.Router();


 	// route to authenticate a user (POST http://localhost:8080/api/authenticate)
 	apiRouter.post('/auth', function(req, res) {
 		console.log(req.body.username);
 		// find the user
 		// select the name username and password explicitly  since mongoose is not returning it by default
 		User.findOne({
 			username: req.body.username
 		}).select('name username password').exec(function(err, user) {
 			if (err) throw err;

 			// no user with that username was found
 			if (!user) {
 				res.status(400).json({
 					success: false,
 					message: 'Authentication failed. User not found.'
 				});
 			} else if (user) {
 				// check if password matches
 				var validPassword = user.comparePassword(req.body.password);
 				if (!validPassword) {
 					res.status(401).json({
 						success: false,
 						message: 'Authentication failed. Wrong password.'
 					});
 				} else {
 					// if user is found and password is right
 					// create a token
 					var token = jwt.sign({
 						name: user.name,
 						username: user.username
 					}, superSecret, {
 						expiresInMinutes: 1440 // expires in 24 hours
 					});
 					// return the information including token as JSON
 					res.json({
 						success: true,
 						message: 'Enjoy your token!',
 						token: token
 					});
 				}
 			}
 		});
 	});


 	// middleware to use for all requests
 	apiRouter.use(function(req, res, next) {
 		// do logging
 		console.log('Somebody just came to our app!');

 		// this is where we will authenticate users
 		// check header or url parameters or post parameters for token
 		var token = req.body.token || req.query.token || req.headers['x-access-token'];

 		// decode token
 		if (token) {
 			// verifies secret and checks exp
 			jwt.verify(token, superSecret, function(err, decoded) {
 				if (err) {
 					return res.status(403).send({
 						success: false,
 						message: 'Failed to authenticate token.'
 					});
 				} else {
 					// if everything is good, save to request for use in other routes
 					req.decoded = decoded;
 					next();
 				}
 			});
 		} else {
 			// if there is no token
 			// return an HTTP response of 403 (access forbidden) and an error message
 			return res.status(403).send({
 				success: false,
 				message: 'No token provided.'
 			});
 		}
 	});


 	apiRouter.route('/users')
 		// create a user (accessed at POST http://localhost:8080/api/users)
 		.post(function(req, res) {
 			// create a new instance of the User model
 			var user = new User();
 			// set the users information (comes from the request)
 			user.name = req.body.name;
 			user.username = req.body.username;
 			user.password = req.body.password;

 			// check if the any value are left blank
 			if (user.name === '' || user.username === '' || user.password === '') {
 				return res.status(400).json({
 					success: false
 				});
 			}
 			// save the user and check for errors
 			user.save(function(err) {
 				if (err) {
 					// duplicate entry
 					if (err.code == 11000)
 						return res.status(400).json({
 							success: false,
 							message: 'A user with that username already exists. '
 						});
 					else
 						return res.status(500).send(err);
 				}
 				res.json({
 					message: 'User created!'
 				});
 			});
 		});


 	// test route to make sure everything is working
 	// accessed at GET http://localhost:8080/api
 	apiRouter.get('/', function(req, res) {
 		res.status(200).json({
 			message: 'hooray! Welcome to our api!'
 		});
 	});

 	// on routes that end in /users ie. handle multiple routes for the same URI /users
 	// ----------------------------------------------------
 	apiRouter.route('/users')

 	// get all the users (accessed at GET http://localhost:8080/api/users)
 	.get(function(req, res) {
 		User.find(function(err, users) {
 			if (err) res.send(err);
 			// return all the users
 			res.json(users);
 		});
 	});

 	// on routes that end in /users/:user_id
 	// ----------------------------------------------------
 	apiRouter.route('/users/:user_id')
 		// get the user with that id
 		// (accessed at GET http://localhost:8080/api/users/:user_id)
 		.get(function(req, res) {
 			User.findById(req.params.user_id, function(err, user) {
 				if (err) res.status(500).send(err);
 				// return that user
 				res.status(200).json(user);
 			});
 		})

 	// update the user with this id
 	// (accessed at PUT http://localhost:8080/api/users/:user_id)
 	.put(function(req, res) {
 		// use our user model to find the user we want
 		User.findById(req.params.user_id, function(err, user) {
 			if (err) res.status(500).send(err);
 			// update the users info only if its new
 			if (req.body.name) user.name = req.body.name;
 			if (req.body.username) user.username = req.body.username;
 			if (req.body.password) user.password = req.body.password;
 			// save the user
 			user.save(function(err) {
 				if (err) res.status(400).send(err);
 				// return a message
 				res.status(200).json({
 					message: 'User updated!'
 				});
 			});
 		});
 	})

 	// delete the user with this id
 	// (accessed at DELETE http://localhost:8080/api/users/:user_id)
 	.delete(function(req, res) {
 		User.remove({
 			_id: req.params.user_id
 		}, function(err) {
 			if (err) return res.status(500).send(err);
 			res.status(200).json({
 				message: 'Successfully deleted'
 			});
 		});
 	});


 	// api endpoint to get user information
 	apiRouter.get('/me', function(req, res) {
 		console.log('Info for logged user sent.');
 		res.send(req.decoded);
 	});

 	return apiRouter;
 };