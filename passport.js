const passport  = require('passport'),
LocalStrategy = require('passport-local').Strategy,
Models = require('./models.js'),
passportJWT = require('passport-jwt');

let Users = Models.User,
JWTStrategy = passportJWT.Strategy,
ExtractJwt = passportJWT.ExtractJwt;

passport.use(
    new LocalStrategy(
        {
            usernameField:'Username',
            passwordField:'Password',
        },
        async (username, password, callback) => {
            console.log('${username} ${password}');
            await Users.findOne({Username: username})
            .then((user) => {
                if(!user) {
                    console.log('incorrect username');
                    return callback(null, false, {
                        message: 'Incorrect Username or Password.',
                    });
                }
                  if (!user.validatePassword(password)) {
                        console.log('incorrect password');
                        return callback(null, false, { message: 'Incorrect password.' });
                      }
                console.log('finished');
                return callback(null, user);
            })
            .catch((error) => {
                if(error) {
                    console.log(error);
                    return callback(error);
                }
            })
        }
    )
);

passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: 'your_jwt_secret'
}, async(jwtPayload, callback) => {
    return await Users.findById(jwtPayload._id)
    .then((user) => {
        return callback(null, user);
    })
    .catch((error) => {
        return callback(error)
    });
}));