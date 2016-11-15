
const express = require('express')
const router = express.Router()
const Transaction = require('../models/transaction')
const Product = require('../models/product')

router

    .post('/create/:userId/:productId', validateToken, (req, res, next) => {

        // TODO: Check for existing transaction with the same productId

        const buyerId = req.params.userId
        const productId = req.params.productId
        Product.queryById(productId).then( product => { // get product info
            var transaction = new Transaction({
                sellerId: product.sellerId,
                buyerId: buyerId,
                product: {
                    id: product.uid,
                    title: product.title,
                    amount: product.price
                },
                status: 'pending'
            })
            return transaction.save()
        })
        .then(function() {
            res.status(201).send()
        })
        .catch( error => {
            console.log(error)
            res.status(500).send({
                status: 'failed',
                error: error
            })
        })
    })

    /**
     * Gets an array containing the users transactions.
     *
     * @endpoint {GET} /transactions/{userId}/list
     *
     * @params { String } userId - Id of the user
     * @returns { Array } Returns an array of transactions
     */
    .get('/:userId/list', validateToken, (req, res, next) => {
        const userId = req.params.userId
        Transaction.queryByUserId(userId)
            .then( transactions => {
                res.status(200).send(transactions)
            })
            .catch(error => {
                console.log(error)
                res.status(500).send(error)
            })
    })

    .get('/:transactionId', validateToken, (req, res, next) => {

    })

;
module.exports = router
