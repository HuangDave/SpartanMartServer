
const express = require('express')
const router = express.Router()
const passport = require('../../config/passport')
const User = require('../models/user')
const Transaction = require('../models/transaction')
const Product = require('../models/product')
const stripe = require("stripe")(require('../../config/config.json').stripe.secretKey)

router

    /**
     * Performs a payment transaction through Stripe and
     * returns a JSON response with the status of the transaction.
     *
     * Refer to charge creation and response handling here: https://stripe.com/docs/api#charges
     *
     * @endpoint {POST} /purchase/
     *
     * @body { String } userId   - Id of the user making the purchase
     * @body { String } productId - Id of the product
     * @return { JSON } Returns a JSON response containing the status of the transaction.
     */
    .post('/', validateToken, (req, res, next) => {
        const buyerId = req.body.userId
        const productId = req.body.productId
        var _product, sellerId
        Product.queryById(productId).then( product => { // get product info
            _product = product
            return User.queryById(buyerId)              // get Stripe accountId of buyer to receive transaction
                    .then( buyer => {
                        sellerId = product.sellerId
                        return User.queryById(sellerId) // get Stripe customerId of seller for charging transaction
                                .then( seller => {
                                    return {
                                        recipientId: buyer.stripe.accountId,
                                        customerId: seller.stripe.customerId,
                                        product: product
                                    }
                                })
                    })
        })
        .then( info => {
            return stripe.charges.create({
                    amount: info.product.price * 100,
                    currency: 'usd',
                    customer: info.customerId,
                    destination: info.recipientId
            })
        })
        .then( charge => {
            var transaction = new Transaction({
                chargeId: charge.id,
                sellerId: sellerId,
                buyerId: buyerId,
                product: {
                    id: _product.uid,
                    title: _product.title,
                    amount: charge.amount
                },
                status: charge.status
            })
            return transaction.save()
        })
        .then( transaction => {
            res.status(200).json({ status: transaction.status })
        })
        .catch( error => {
            console.log(error)
            res.status(500).send({
                status: 'failed',
                error: error
            })
        })
    })
;
module.exports = router
