const express = require('express'),
      morgan = require('morgan'),
      uuid = require('uuid'),
      bodyParser = require('body-parser'),
      mongoose = require('mongoose'),
      Models = require('./models.js');

      const app = express();

      const Movies = Models.Movie,
      Users = Models.User;

//mongoose.connect('xxx', {xxx});
mongoose.connect('mongodb://localhost:27017/movieAPI', { useNewUrlParser: true, useUnifiedTopology: true });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Import auth.js
let auth = require('./auth')(app);

// Import passport and passport.js
const passport = require('passport');
require('./passport');

// Morgan middleware to log all requests to the terminal
app.use(morgan('combined'));

// Serve static files from the "public" directory

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('Welcome to my app!');
});

//CREATE
//Add a user
app.post('/users',
    async (req, res) => {
    //   let hashedPassword = Users.hashPassword(req.body.Password);
      await Users.findOne({ Username: req.body.Username })
        .then((user) => {
          if (user) {
            return res.status(400).send(req.body.Username + ' already exists.');
          } else {
            Users.create({
              Username: req.body.Username,
              Password: req.body.Password,
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
    async (req, res) => {
      // CONDITION TO CHECK ADDED HERE
      if (req.body.Username !== req.params.Username) {
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
    res.send('Welcome to Movie_API!');
});

// READ
app.get('/movies', passport.authenticate('jwt', {session: false}), async (req, res) => {
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

//Middleware for serving static files from the public directory
app.use(express.static('public'));

// Error-handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).send('Something broke!');
});

// Start the server
app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});
