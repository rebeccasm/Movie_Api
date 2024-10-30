const mongoose = require('mongoose');
const mongoURI = process.env.MONGODB_URI;
const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;

//mongoose.connect('xxx', {xxx});
// mongoose.connect('mongodb://localhost:27017/myDB', { useNewUrlParser: true, useUnifiedTopology: true });
// mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });


mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => console.log("MongoDB connected"))
        .catch(err => console.log(err));

const express = require('express');
const morgan = require('morgan');
// const uuid = require('uuid');
const bodyParser = require('body-parser');


const app = express();

app.use(bodyParser.json());

const cors = require('cors');
app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));

let auth = require('./auth')(app);

const passport = require('passport');
      require('./passport');

const { check, validationResult } = require('express-validator');

    check('Username', 'Username contains non-alphanumeric characters - not allowed.').isAlphanumeric()

// Express static function
app.use(express.static('public'));

// Middleware
app.use(morgan('common'));


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
      let hashedPassword = Users.hashPassword(req.body.Password);
      //Search to see if a user wit the requested username alredy exists
      await Users.findOne({ Username: req.body.Username })
        .then((user) => {
          if (user) {
            // If the user is found, send a response that it alredy exists
            return res.status(400).send(req.body.Username + ' already exists.');
          } else {
            Users.create({
              Username: req.body.Username,
              Password: hashedPassword,
              Email: req.body.Email,
              Birthday: req.body.Birthday,
            })
              .then((user) => {
                res.status(201).json(user);
              })
              .catch((error) => {
                console.log(error);
                res.status(500).send('Error: ' + error);
              });
          }
        })
        .catch((error) => {
          console.log(error);
          res.status(500).send('Error: ' + error);
        });
    }
  );

// UPDATE
// A user's info, by username
app.put(
    '/users/:Username',
    passport.authenticate('jwt', { session: false }),
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
      // CONDITION TO CHECK ADDED HERE
      if (req.user.Username !== req.params.Username) {
        return res.status(400).send('Permission denied');
      }
      // CONDITION ENDS
      await Users.findOneAndUpdate(
        { Username: req.params.Username },
        {
          $set: {
            Username: req.body.Username,
            Password: req.body.Password,
            Email: req.body.Email,
            Birthday: req.body.Birthday,
          },
        },
        { new: true }
      ) // This line makes sure that the updated document is returned
        .then((updatedUser) => {
          res.json(updatedUser);
        })
        .catch((err) => {
          console.log(err);
          res.status(500).send('Error: ' + err);
        });
    }
  );

// UPDATE
// Add a movie to a user's list of favorites
app.patch('/users/:Username/movies/:MovieID', passport.authenticate('jwt', {session: false}), async (req, res) => {
    await Users.findOneAndUpdate({ Username: req.params.Username }, {
        $push: { FavoriteMovies: req.params.MovieID }
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
// Delete a movie from a user's list of favorites
app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', {session: false}), async (req, res) => {
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
app.delete('/users/:Username', passport.authenticate('jwt', {session: false}), async (req, res) => {

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
app.get('/', (req, res) => {
    res.send('Welcome to myFlix!');
});

// READ
app.get('/movies', async (req, res) => {
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
app.get('/movies/:title', passport.authenticate('jwt', {session: false}), async (req, res) => {

    const title = req.params.title;
    const movie = await Movies.findOne({ Title: title });

    if (movie) {
        res.status(200).json(movie);
    } else {
        res.status(404).send('Movie not found');
    }

});

// READ
app.get('/movies/genre/:genreName', passport.authenticate('jwt', {session: false}), async (req, res) => {
    try {
        const genreName = req.params.genreName;
        const movie = await Movies.findOne({ 'Genre.Name': genreName });

        if (movie) {
            res.status(200).json(movie.Genre);
        } else {
            res.status(404).send('No such genre found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});

// READ
app.get('/movies/directors/:directorName', passport.authenticate('jwt', {session: false}), async (req, res) => {
    try {
        const directorName = req.params.directorName;
        const movie = await Movies.findOne({ 'Director.Name': directorName });

        if (movie) {
            res.status(200).json(movie.Director);
        } else {
            res.status(404).send('No such director');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});

//READ
app.get('/users', passport.authenticate('jwt', {session: false}), async (req, res) => {
    await Users.find()
        .then((users) => {
            res.status(201).json(users);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

//READ
app.get('/users/:Username', passport.authenticate('jwt', {session: false}), async (req, res) => {
    await Users.findOne({ Username: req.params.Username })
        .then((user) => {
            res.json(user);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

// Middleware for serving static files from the public directory
app.use(express.static('public'));

// Error-handling middleware called when an error occurs
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start the server and listen for requests on port 8080
// const port = process.env.PORT || 8080;
// app.listen(port, '0.0.0.0',() => {
//  console.log('Listening on Port ' + port);
// });
app.listen(process.env.PORT || 3000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});