
const express = require('express')
const expressSession = require('express-session')
const bodyParser = require('body-parser')

const authRoutes = require('./app/routes/authentication')
const userRoutes = require('./app/routes/users')
const productRoutes = require('./app/routes/products')
const purchaseRoutes = require('./app/routes/purchase')
const transactionRoutes = require('./app/routes/transactions')
const imageRoutes = require('./app/routes/image')

const passport = require('passport')

// initialize firebase...
require('./config/firebase')

// initialize express app...
const app = express()
// process.env.PORT lets the port be set by Heroku...
const port = process.env.PORT || 8080

// configure express...
app

    // required for Heroku
    .set('view engine', 'ejs')

    // set configurations...
    .use(bodyParser.urlencoded({extended: false }))
    .use(bodyParser.json())

    // initialize passport for authentication...
    .use(passport.initialize())

    // set API routes...
    .use('/auth', authRoutes)
    .use('/users', userRoutes)
    .use('/products', productRoutes)
    .use('/purchase', purchaseRoutes)
    .use('/transactions', transactionRoutes)
    .use('/images', imageRoutes)

    // listen to Heroku or local port...
    .listen(port, function() {
        console.log('Running on port: ' + port)
    })
;

// export for use in testing
module.exports = app
