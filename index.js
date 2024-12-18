const express = require('express'); //import express module which is a web application framework for Node.js
const morgan = require('morgan'); //import morgan module for logging
const bodyParser = require('body-parser'); //import body-parser module for parsing incoming request bodies
const uuid = require("uuid"); //import uuid module for generating unique ids
const mongoose = require('mongoose');
// const mongoURI = process.env.MONGODB_URI;
const Models = require('./models.js');
const { check, validationResult } = require("express-validator");

const Movies = Models.Movie; //import the Movie model from models.js
const Users = Models.User;
const Genres = Models.Genre;
const Directors = Models.Director; 

const app = express(); //create an instance of express
app.use(morgan('common')); // Middleware
app.use(bodyParser.json()); //lets us be able to read data from body object
app.use(express.urlencoded({ extended: true })); //allows us to read data from the body of POST requests

const cors = require('cors'); //import cors module to allow requests from all origins
let allowedOrigins = [
  'http://localhost:8080', 
  'http://testsite.com',
  'http://localhost:1234',
];
app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        // If a specific origin isn’t found on the list of allowed origins
        let message =
          "The CORS policy for this application doesn’t allow access from origin " +
          origin;
        return callback(new Error(message), false);
      }
      return callback(null, true);
    },
  }));

// app.use(cors());  //allows all domains to access the API

//passport middleware function for authenticating users
let auth = require('./auth')(app); //(app) allows Express into auth.js file
const passport = require('passport');
      require('./passport');

      
// allows mongoose to connect to movie_apiDB database on local MongoDB server to perform CRUD ops    
//mongoose.connect('xxx', {xxx});
// mongoose.connect('mongodb://localhost:27017/myDB', {
//  useNewUrlParser: true, 
// useUnifiedTopology: true 
// });

//connects Heroku app to MongoDB Atlas database without showing Mongo credentials
mongoose.connect(process.env.CONNECTION_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
});


//CREATE
//Add a user
app.post('/users',
    [
      check('Username', 'Username is required').isLength({ min: 5 }),
      check(
        'Username',
        'Username contains non alphanumeric characters - not allowed.'
      ).isAlphanumeric(),
      check('Password', 'Password is required').not().isEmpty(),
      check('Email', 'Email does not appear to be valid').isEmail(),
    ],
    async (req, res) => {
      // check the validation object for errors
      let errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }
      let hashedPassword = Users.hashPassword(req.body.Password); //hash password entered by user when registering before storing it in MongoDB
          console.log("hashed password: ", hashedPassword); //log hashed password for debugging
      //Search to see if a user wit the requested username alredy exists
      await Users.findOne({ Username: req.body.Username })
        .then((user) => {
          if (user) {
            // If the user is found, send a response (400 status code) that it alredy exists
            return res.status(400).send(req.body.Username + ' already exists.');
          } else {
            Users.create({
              //if user does not exist, create new user with defined users schema in models.js
              Username: req.body.Username,
              Password: hashedPassword,
              Email: req.body.Email,
              Birthday: req.body.Birthday,
            })
              .then((user) => {
                 //if user is created, return 201 status code and user object
                res.status(201).json(user);
              }) //callback fn on the promise
              .catch((error) => {
                //error handling for create method
                console.log(error);
                res.status(500).send('Error: ' + error);
              });
          }
        })
         // error for findOne method
        .catch((error) => {
          console.log(error);
          res.status(500).send('Error: ' + error);
        });
    }
  );

// UPDATE
// Add a movie to a user's list of favorites
app.patch('/users/:Username/:MovieID', 
  passport.authenticate('jwt', {session: false}), 
  async (req, res) => {
    await Users.findOneAndUpdate(
      { Username: req.params.Username }, 
      {
        $push: { FavoriteMovies: req.params.MovieID }
      },
      { new: true }) // This line makes sure that the updated document is returned
        .then((updatedUser) => {
          res.status(201).json(updatedUser);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
});

// DELETE
// Remove a movie from a user's list of favorites
app.delete('/users/:Username/:MovieID', 
  passport.authenticate('jwt', {session: false}), 
  async (req, res) => {
    await Users.findOneAndUpdate(
      { Username: req.params.Username }, 
      {
        $pull: { FavoriteMovies: req.params.MovieID }
      },
      { new: true }) // This line makes sure that the updated document is returned
        .then((updatedUser) => {
          res.status(201).json(updatedUser);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
});

//READ
// Get all users ADMIN USE ONLY
app.get('/users', 
  passport.authenticate('jwt', {session: false}), 
  async (req, res) => {
    await Users.find() //find grabs data on all docs in collection using the User model
        .then((users) => {
            res.status(201).json(users);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

//READ
// Get a user by Username
app.get('/users/:Username', 
  passport.authenticate('jwt', {session: false}), 
  async (req, res) => {
    await Users.findOne({ Username: req.params.Username }) //pass a parameter(Username) to the findOne method to find a user by username
        .then((user) => {
            res.json(user);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

// READ
// Return a list of all movies to user as JSON object
app.get('/movies', 
  passport.authenticate('jwt', {session: false}), 
  async (req, res) => {
    await Movies.find()
        .then((movies) => {
            res.status(201).json(movies);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

// READ
// Return data about a single movie by title to user
app.get('/movies/:title', 
  passport.authenticate('jwt', {session: false}), 
  async (req, res) => {
   await Movies.findOne({ Title: req.params.title }) //pass a parameter(title) to the findOne method to find a movie by title
      .then((movie) => {
        res.status(201).json(movie);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
});

// READ
// Return data about a director (bio, birthyear, deathyear) by name
app.get('/director/:directorName', 
  passport.authenticate('jwt', {session: false}), 
  async (req, res) => {
      await Director.findOne({ "director.name": req.params.name })
      .then((director) => {
        res.json(director.director);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
    });

// READ
// Return data about a genre (desription) by name/title (e.g. Horror)
app.get('/genre/:genreName', 
  passport.authenticate('jwt', {session: false}), 
  async (req, res) => {
     await Genre.findOne({ "genre.name": req.params.name })
      .then((genre) => {
        res.json(genre.genre);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
});

// UPDATE
// A user's info, by username
app.put(
    '/users/:Username',
    passport.authenticate('jwt', { session: false }),
    //ensures provided fields are valid
    [
      check('Username')
      .optional()
      .isLength({ min: 5 })
      .withMessage('Username is required'),

      check('Username')
      .optional()
      .isAlphanumeric()
      .withMessage('Username contains non alphanumeric characters - not allowed.'),

      check('Password')
      .optional()
      .not()
      .isEmpty()
      .withMessage('Password is required'),

      check('Email')
      .optional()
      .isEmail()
      .withMessage('Email does not appear to be valid')
    ],
    async (req, res) => {
      // check the validation object for errors
      let errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }
      // condition to check for authorizetion
      if (req.user.Username !== req.params.Username) {
        return res.status(400).send(req.params.username + 'Permission denied');
      }
      // update user doc with provided fieldx
      await Users.findOneAndUpdate(
        { Username: req.params.Username },
        {
          //find user by username and update using set (specifies what fields to update)
          $set: {
            Username: req.body.Username,
            Password: Users.hashPassword(req.body.Password),
            Email: req.body.Email,
            Birthday: req.body.Birthday,
          },
        },
        { new: true }
      ) // This line makes sure that the updated document is returned
        .then((updatedUser) => {
          //promise then method to return updated user
          res.json(updatedUser);
        })
        .catch((err) => {
          console.log(err);
          res.status(500).send('Error: ' + err);
        });
    }
  );

// DELETE
// Delete a movie from a user's list of favorites
app.delete('/users/:Username/movies/:MovieID', 
  passport.authenticate('jwt', {session: false}), 
  async (req, res) => {
    await Users.findOneAndUpdate({ Username: req.params.Username }, {
        $pull: { FavoriteMovies: req.params.MovieID }
    },
        { new: true }) // This line makes sure that the updated document is returned
        .then((updatedUser) => {
            res.json(updatedUser);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

// DELETE
// Delete a user by username
app.delete('/users/:Username', 
  passport.authenticate('jwt', {session: false}), 
  async (req, res) => {
    await Users.findOneAndDelete({ Username: req.params.Username })
        .then((user) => {
            if (!user) {
                res.status(404).send(req.params.Username + ' was not found');
            } else {
                res.status(200).send(req.params.Username + ' was deleted.');
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

// READ
// default respons for when a request is made
app.get('/', (req, res) => {
    res.send('Welcome to myFlix!');
});

// Middleware for serving static files from the public directory
app.use(express.static('public'));

// Error-handling middleware called when an error occurs
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

//Listen for requests on port 8080
// app.listen(8080, () => {
//   console.log("Your app is listening on port 8080.");
// });

// Start the server and listen for requests on port 8080
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0',() => {
 console.log('Listening on Port ' + port);
});
