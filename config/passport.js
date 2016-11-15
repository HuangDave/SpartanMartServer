
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy

const jwt = require('jsonwebtoken')
const bcrypt = require("bcrypt-nodejs")

// Server secret for signing JWT token.
const secret = require('./config.json').secret

const User = require('../app/models/user')

// Configure Passport for LocalStrategy...
passport
    .use(new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password'
        }, authenticate))
    .use("local-signup", new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true
        }, register))

/**
 * Register a new user and authenticates them, then returns a JWT in the response.
 *
 * @param { String } email      - The user's email
 * @param { String } password   - Hashed password.
 * @param            done       - Callback
 */
function register(req, email, password, done) {
    User.queryByEmail(email)
        .then( user => {
            done(null, false, { message: "This email is already registered." })
        })
        .catch( error => {
            if (!email.includes('@sjsu.edu')) {
                done(null, false, { error: 'must be sjsu email' })
                return
            }
            var user = new User({
                email: email,
                password: bcrypt.hashSync(password),
                name: {
                    first: req.body.first_name,
                    last: req.body.last_name
                },
                contact: req.body.contact
            })
            user.save()
                .then( user => {
                    done(null, { uid: user.uid });
                }).catch( error => {
                    done(null, false, { error: error })
                })
        })
}

/**
 * Authenticates a user, returns a JWT token if auth is successful.
 *
 * @param { String } email      - The user's email
 * @param { String } password   - Hashed password.
 * @param            done       - Callback
 */
function authenticate(email, password, done) {
    User.queryByEmail(email)
        .then( user => {
            if (!bcrypt.compareSync(password, user.password)) {
                return done(null, false, {message: "Password is incorrect"})
            }
            done(null, { uid: user.uid })
        }).catch( error => {
            done(null, false, { message: error })
        })
}

/**
 * Sign a JWT token for an authenticated user.
 *
 * @param req  { JSON } Consists of uid and user data.
 * @param res
 * @param next
 */
generateToken = function(req, res, next) {
    req.token = jwt.sign({
        user: req.uid,
    }, secret, {
        expiresIn: 3600 //3600 * 24 * 14
    });
    next();
}

/**
 * Verify a JWT is valid.
 *
 * @param { JSON } req  - Consists of a JWT.
 * @param          res  - Send an error if the JWT is invalid
 * @param          next - callback for when validation is successful
 */
validateToken = function(req, res, next) {
    req.token = req.headers.authorization.split(" ")[1]
    jwt.verify(req.token, secret, (err, decoded) => {
        if (!err) {
            next()
        } else {
            res.status(404).send(err);
        }
    })
}

/**
 * Response for signup and login routes
 *
 * @return { JSON } Returns the user's uid and the signed JWT token if authentication was successful.
 */
response = function(req, res) {
    res.status(201).json({
        user: req.user,
        token: req.token
    });
}
