
const express = require('express')
const router = express.Router()
const nodemailer = require('../../config/nodemailer')

router

    /**
     * Request for password recovery.
     * Checks if the email provided exists and sends a confirmation email for password recovery.
     *
     * {POST} /users/recover/{email}
     *
     * @param { String } email - The user's SJSU email.
     * @return { JSON } Returns the status of recovery. True is email is sent or an error if any.
     */
    .post('/recover', (req, res, next) => {
        nodemailer.sendRecoveryEmail(req.body.email)
            .then( res => {
                res.status(200).send({ status: 'sent' })
            })
            .catch( error => {
                console.log(error);
                res.status(500).send()
            })
    })

;
module.exports = router
