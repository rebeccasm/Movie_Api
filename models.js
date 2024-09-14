// models.js
const mongoose = require('mongoose');

// Movie Schema
let movieSchema = mongoose.Schema({
    Title: { type: String, required: true},
    Description: { type: String, required: true},
    Director: {
        Name: String,
        Bio: String,
        Birthdate: Date,
        Deathdate: Date,
        Movies: [String]
    },
     Genre: {
        Name: String,
        Description: String
    },
//     Actors: [String],
//     ReleaseYeat: Number,
//     ImagePath: String,
//     Featured: Boolean
});

// User Schema
let userSchema = mongoose.Schema({
    Username: {type: String, required: true, unique: true},
    Password: {type: String, required: true},
    Email: {type: String, required: true, unique: true},
    Birthday: Date,
    Favorite: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }]
});

// Creation of the Models
let Movie = mongoose.model('Movie', movieSchema);
let User = mongoose.model('User', userSchema);

// Export the models
module.exports.Movie = Movie;
module.exports.User = User;