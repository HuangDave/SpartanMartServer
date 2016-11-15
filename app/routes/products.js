
const express = require('express')
const router = express.Router()
const passport = require('../../config/passport')
const User = require('../models/user');
const Product = require('../models/product')

/**
 * The router consists of endpoints for Product Management and Product Search.
 *
 * All requests require the user to be authenticated.
 * The router contains the following endpoints:
 *
 * {POST}   /products/{userId}                                  - Post a product
 * {PUT}    /products/{userId}/{productId}                      - Update a user's product post
 *
 * {GET}    /products/search?keyword={keyword}&limit?={limit}   - Query product posts by keyword
 * {GET}    /products/recent?limit?={limit}                     - Query the most recent product posts
 * {GET}    /products/{userId}/list                             - List a user's posted products
 * {GET}    /products/{productId}                               - Get a product by Id
 *
 * {DELETE} /products/{userId}/{productId}                      - Delete a user's product post
 */
router

    /**
     * Add a product post.
     * Returns a JSON response of the product if it is successfully added.
     *
     * @endpoint {POST} /products/{userId}
     *
     * @param { String } userId - ID of the user posting the product.
     * @body  Consists of the following:
     *          { String } image        - Optional, user provided image in String format.
     *          { String } title        - The product's title.
     *          { String } description  - The product's description.
     *          { double } price        - User's suggested price.
     */
    .post("/:userId", validateToken, (req, res, next) => {
        var _user
        User.queryById(req.params.userId)
            .then( user => {
                _user = user
                var product = new Product({
                    sellerId: req.params.userId,
                    image: req.body.image,
                    title: req.body.title,
                    description: req.body.description,
                    price: req.body.price,
                    tags: req.body.title.split(" ")
                })
                return product.save()                   // save product to database
            })
            .then( product => {
                _user.addProduct(product.uid)           // add product to user's products list
                return product
            })
            .then( product => {
                res.status(201).json({
                    uid: product.uid,
                    title: product.title,
                    description: product.description,
                    price: product.price,
                    createdAt: product.createdAt,
                    updatedAt: product.updatedAt
                })
            })
            .catch(error => {
                console.log(error)
                res.status(500).send(error)
            })
    })

    /**
     * Update a product post.
     * Returns a JSON response of the product if update is successful.
     *
     * @endpoint {PUT} /products/{userId}/{productId}
     *
     * @param { String } userId     - ID of the user making the request.
     * @param { String } productId  - ID of the product to update.
     * @body Consists of any of all of the following:
     *          { String } image        - Optional, user provided image in String format.
     *          { String } title        - The product's title.
     *          { String } description  - The product's description.
     *          { double } price        - User's suggested price.
     *          { Array }  tags         - String array consisting of tags for the product.
     */
    .put("/:userId/:productId", validateToken, (req, res, next) => {
        const userId = req.params.userId
        const productId = req.params.productId
        const data = req.body
        Product.queryById(productId)
            .then( product => {
                if (product.sellerId == userId) {
                    return product.update(data)
                        .then(function() {
                            return product
                        })
                } else {
                    return Promise.reject(new Error('This product does not belong to the user.'))
                }
            })
            .then( product => {
                res.status(200).json({
                    message: 'product is updated'
                })
            })
            .catch( error => {
                res.status(400).send(error)
            })
    })

    /**
     * Query products with options.
     * Returns an array of queried products.
     *
     * @endpoint {GET} '/products/search?keyword={keyword}&limit?={limit}'
     *
     * @query { String}  keyword - Keywords of a product to search for.
     * @query { Number } limit   - Optional. Maximum number of products to query. Default = 10
     * @return Returns an array of products
     */
    .get('/search?:keyword:limit?', validateToken, (req, res, next) => {
        var keyword = req.query.keyword
        var limit = req.query.limit == undefined ? 10 : req.query.limit
        Product.query({
            keyword: keyword,
            limit: limit
        })
        .then( query => {
            res.status(200).send(query)
        })
        .catch( error => {
            console.log(error)
            res.status(500).send()
        })
    })

    /**
     * Query products with options.
     * Returns an array of queried products.
     *
     * @endpoint {GET} '/products/recent?limit?={limit}'
     *
     * @query { Number } limit   - Optional. Maximum number of products to query. Default = 10
     * @return Returns an array of products
     */
    .get('/recent?:limit?', validateToken, (req, res, next) => {
        var limit = req.query.limit == undefined ? 10 : +req.query.limit
        Product.queryRecent(limit)
            .then( query => {
                res.status(200).send(query)
            })
            .catch( error => {
                console.log(error)
                res.status(500).send()
            })
    })

    /**
     * Query all of the user's product posts.
     * Returns an array containing the queried products.
     *
     * @endpoint {GET} '/products/{userId}/list'
     *
     * @return Returns an array of the user's products
     */
    .get("/:userId/list", validateToken, (req, res, next) => {
        var user = User.queryById(req.params.userId).then( user => {

            // array containing IDs of the users product posts
            var products = user.products

            if (products.length == 0) {
                // send empty array if user does not have any product posts.
                res.status(201).send([])
            } else {
                var add = id => {
                    return Product.queryById(id)
                        .then( product => {
                            return product.serializedData()
                        })
                }
                return Promise.all(products.map(add)).then( result => {
                    res.status(200).send(result)
                })
            }
        }).catch( error => {
            console.log(error);
            res.status(500).send("Error getting the users products")
        })
    })

    /**
     * Query a product by its ID.
     * Returns a JSON response containing the product.
     *
     * @endpoint {GET} 'products/{productId}'
     * @param { String } productId - ID of the product to query.
     * @return Returns a JSON representation of the product.
     */
    .get("/:productId", validateToken, (req, res, next) => {
        Product.queryById(req.params.productId).then( product => {
            res.status(201).json(product.serializedData())
        })
        .catch( error => {
            console.log(error);
            res.status(500).send(error)
        })
    })

    /**
     * Remove a user's product post.
     * Return a JSON response with the status of the request.
     *
     * @endpoint {DELETE} 'products/{userId}/{productId}'
     * @param { String } userId    - ID of the user.
     * @param { String } productId - ID of the product to remove.
     * @return Returns a JSON object containing the status of the removal.
     */
    .delete("/:userId/:productId", validateToken, (req, res, next) => {
        Product.queryById(req.params.productId)
            .then( product => {
                if (product.uid == req.params.productId) {
                    return User.queryById(req.params.userId).then( user => {
                        return user.removeProduct(product.uid)
                    })
                }
            })
            .then(function() {
                res.status(200).json({ removed: true })
            })
            .catch( error => {
                console.log(error);
                res.status(500).send(error)
            })
    })
;
module.exports = router
