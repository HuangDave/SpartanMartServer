
const express = require('express')
const router = express.Router()
const passport = require('passport')
require('../../config/passport')

// Authentication and Authorization are handled in '/config/passport.js'
router

    /**
     * Register and authenticate a user.
     * Returns a JWT in the response if authentication is successful.
     *
     * @endpoint {POST} '/auth/signup'
     * @param { String } email
     * @param { String } password
     * @param { String } contact
     * @param { JSON }   name
     */
    .post("/signup", passport.authenticate("local-signup", { session: false }), generateToken, response)

    /**
     * Authenticate a user.
     * Returns a JWT in the response if authentication is successful.
     *
     * @endpoint {POST} '/auth/login'
     * @param { String } email
     * @param { String } password
     */
    .post("/login", passport.authenticate('local', { session: false }), generateToken, response)

;
module.exports = router
