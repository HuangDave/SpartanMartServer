
const express = require('express')
const router = express.Router()
const passport = require('../../config/passport')
const imageUpload = require('../../config/imageupload')
const User = require('../models/user')

/**
 * The router consists of endpoints for User Account Management and Payment Management
 * All endpoints require user authentication.
 *
 * The router contains the following endpoints:
 *
 * {GET}     /users/{userId}                    - Request a user's information by ID.
 *
 * {PUT}     /users/{userId}/profle_image       - Update user's profile image.
 * {PUT}     /users/{userId}/password           - Update user's password.
 * {PUT}     /users/{userId}/contact            - Update user's contact.
 *
 * {POST}    /users/{userId}/cards              - Add a credit/debit card to the user's account.
 * {PUT}     /users/{userId}/cards/{cardId}     - Update a credit/debit card on the user's account.
 * {GET}     /users/{userId}/cards/{cardId}     - Get a user's credit/debit card information.
 * {GET}     /users/{userId}/cards/             - Get a list of all the user's currently saved credit/debit cards.
 * {DELETE}  /users/{userId}/cards/{cardId}     - Remove a credit/debit card from the user's account.
 */
router

    /**
     * Request a user's information by ID.
     * Returns a JSON response containing the user's data if the user exists.
     *
     * @endpoint {GET} /users/{userId}
     *
     * @param { String } userId - ID of the user fetch.
     * @response { JSON } JSON containing the user's information.
     */
    .get("/:userId", validateToken, (req, res, next) => {
        User.queryById(req.params.userId)
            .then( user => {
                res.status(200).json(user.serializedData())
            })
            .catch( error => {
                console.log(error)
                res.status(404).send()
            })
    })

    /**
     * Update a user's profile image.
     *
     * @endpoint {PUT} /users/{userId}/profile_image
     *
     * @params { String } userId - ID of the user.
     * @part   { File }   file   - Image data.
     */
    .put('/:userId/profile_image', validateToken, imageUpload.gcsUpload.single('file'), (req, res, next) => {
        User.queryById(req.params.userId)
            .then( user => {
                return user.update({ profile_image: req.file.path })
            })
            .then( user => {
                res.status(201).send()
            })
            .catch( error => {
                console.log(error)
                res.status(500).send()
            })
    })

    /**
    * Update the user's contact
    *
    * @endpoint {PUT} /users/{userId}/contact
    *
    * @body { String } newContact
    */
    .put('/:userId/contact', validateToken, (req, res) => {
        User.queryById(req.params.userId)
            .then( user => {
                return user.updateContact(req.body.contact)
            })
            .then( user => {
                res.status(200).send()
            })
            .catch( error => {
                console.log(error)
                res.status(500).send(new Error(error))
            })
    })

    /**
    * Update the user's password
    *
    * @endpoint {PUT} /users/{userId}/password
    *
    * @body { String } oldPassword
    * @body { String } newPassword
    */
    .put('/:userId/contact', validateToken, (req, res) => {
        const oldPassword = req.params.oldPassword
        const newPassword = req.params.newPassword
        User.queryById(req.params.userId)
            .then( user => {
                return user.updatePassword(oldPassword, newPassword)
            })
            .then( user => {
                res.status(200).send()
            })
            .catch( error => {
                console.log(error)
                res.status(500).send(new Error(error))
            })
    })

    /**
     * Add a credit/debit card to the user's account.
     * Returns a response notfiying if the card is successfully added.
     *
     * @endpoint {POST} /users/{userId}/cards
     *
     * @param { String } userId - ID of the user making the request.
     * @body  Consists of the following:
     *          { JSON } card        - Consists of the card's information
     *              { String } number     - the card's number
     *              { String } exp_month  - card's expiration month.
     *              { String } exp_year   - card's expiration year.
     *              { String } cvc        - security code.
     */
    .post("/:userId/cards", validateToken, (req, res) => {
        User.queryById(req.params.userId)
            .then( user => {
                user.addCard(req.body).then( card => {
                    res.status(201).send(card)
                }).catch( error => {
                    console.log(error)
                    res.status(500).send('error adding your card')
                })
            })
    })

    /**
     * Update a credit/debit card on the user's account.
     * Returns a response notfiying if the card is successfully updated.
     * The card's expiration month, year, and security code can be updated.
     *
     * @endpoint {PUT} /users/{userId}/cards/{cardId}
     *
     * @param { String } userId - ID of the user making the request.
     * @param { String } cardId - ID of the card to update.
     * @body  Consists of the following:
     *          { JSON } card        - Consists of the card's updated information
     *              { String } exp_month  - card's expiration month.
     *              { String } exp_year   - card's expiration year.
     *              { String } cvc        - security code.
     */
    .put("/:userId/cards/:cardId", validateToken, (req, res) => {
        const cardId = req.params.cardId
        const updates = req.body
        User.queryById(req.params.userId)
            .then( user => {
                user.updateCard(cardId, {
                        exp_month: updates.exp_month,
                        exp_year: updates.exp_year
                    })
                    .then( card => {
                        console.log("card updated: " + card.id);
                        res.status(200).send(card)
                    })
            })
            .catch( error => {
                console.log(error)
                res.status(500).send('error updating your card')
            })
    })

    /**
     * Get a user's credit/debit card information.
     * Returns a JSON response containing info of the card.
     *
     * @endpoint {GET} /users/{userId}/cards/{cardId}
     *
     * @param { String } userId - ID of the user making the request.
     * @param { String } cardId - ID of the card to retreive.
     */
    .get('/:userId/cards/:cardId', validateToken, (req, res) => {
        const cardId = req.params.cardId
        User.queryById(req.params.userId)
            .then( user => {
                user.getCard(cardId)
                    .then( card => {
                        res.status(200).send(card)
                    })
            })
            .catch( error => {
                console.log(error)
                res.status(500).send('error getting card')
            })
    })

     /**
      * Get a list of all the user's currently saved credit/debit cards.
      * Returns an array containing all the cards.
      *
      * @endpoint {GET} /users/{userId}/cards/
      *
      * @param { String } userId - ID of the user making the request.
      */
    .get('/:userId/cards/', validateToken, (req, res) => {
        User.queryById(req.params.userId)
            .then( user => {
                user.listCards()
                    .then( cards => {
                        res.status(200).send(cards)
                    })
                    .catch( error => {
                        console.log(error)
                        res.status(500).send()
                    })
            })
    })

    /**
     * Remove a credit/debit card from the user's account.
     * Returns a response notfiying if the card is successfully removed.
     *
     * @endpoint {DETELE} /users/{userId}/cards/{cardId}
     *
     * @param { String } userId - ID of the user making the request.
     * @param { String } cardId - ID of the card to retreive.
     */
    .delete('/:userId/cards/:cardId', validateToken, (req, res) => {
        User.queryById(req.params.userId)
            .then( user => {
                user.removeCard(req.params.cardId).then(function() {
                    console.log('card removed: ' + req.params.cardId)
                    res.status(200).send('card successfully removed')
                }).catch( error => {
                    console.log(error)
                    res.status(500).send('error removing your card')
                })
            })
    })
;
module.exports = router
