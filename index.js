const express = require('express');
const morgan = require('morgan');
const path = require('path');

const app = express();

// Top 10 movies data
const topMovies = [
    { title: 'Ruby Red', director: 'Felix Fuchssteiner' },
    { title: 'Vampire Academy', director: 'Mark Waters' },
    { title: 'Pirates of the Caribbean', director: 'Gore Verbinski' },
    { title: 'National Treasure', director: 'Jon Turteltaub' },
    { title: 'Iron Man', director: 'Jon Favreau' },
    { title: 'The Fast and the Furious', director: 'Rob Cohen' },
    { title: 'Damsel', director: 'Juan Carlos Fresnadillo' },
    { title: 'Avengers: Endgame', director: 'Anthony and Joe Russo' },
    { title: 'Culpa Mia', director: 'Domingo González' },
    { title: 'Hitman' , director: 'Xavier Gens'}
];

// Morgan middleware to log all requests to the terminal
app.use(morgan('combined'));

// Serve static files from the "public" directory
app.use(express.static('public'));

// GET route for "/movies" that returns top 10 movies in JSON format
app.get('/movies', (req, res) => {
    res.json(topMovies);
});

// GET route for "/" that returns a default textual response
app.get('/', (req, res) => {
    res.send('Welcome to my site! Go to /documentation.html to view the documentation.');
});

// Error-handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).send('Something broke!');
});

// Start the server
app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});