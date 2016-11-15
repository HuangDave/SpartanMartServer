
const Object = require('./object')

require('../../config/firebase')
const Promise = require('promise')
const admin = require('firebase-admin')
const db = admin.database()
const productRef = db.ref("/products")

'use strict'
module.exports = class Product extends Object {

    /**
     * Initialize a Product object with the provided data.
     *
     * @param { JSON } data - Consists of the following:
     *                      - { String } sellerId - ID of the user that posted the product.
     */
    constructor(data) {
        super(data)
        this.sellerId = data.sellerId
        this.image = data.image == null ? "" : data.image
        this.title = data.title
        this.description = data.description
        this.price = data.price
        this.tags = data.tags == null ? [] : data.tags

        if (this.exists) {
            this.ref = db.ref('/products').child(this.uid)
        } else {
            this.ref = db.ref('/products')
        }
    }

    /**
     * Query a prodcut by ID.
     *
     * @param  { String } productId - ID of the product to query.
     * @return { Promise } Returns a Promise consisting of the queried Product.
     */
    static queryById(productId) {
        var ref = productRef.child(productId)
        return new Promise((fulfill, reject) => {
            ref.once("value", snapshot => {
                if (snapshot.exists()) {
                    var product = new Product(snapshot.val())
                    fulfill(product)
                } else {
                    reject("Product doesn't exist")
                }
            })
        })
    }

    /**
     * Query a list of products with options
     *
     * @param { JSON } options
     *                  { String } keyword - The tag to search for.
     * @return { JSON } Returns a Promise with an array of the products found.
     */
    static query(options) {
        const keyword = options.keyword
        const limit = options.limit
        var ref = productRef
        var results = []
        return new Promise((fulfill, reject) => {
            ref.once('value', query => {                // get list of products
                query.forEach( snapshot => {
                    var product = new Product(snapshot.val())
                    if (product.title.includes(keyword) || product.description.includes(keyword)) { // filter by keyword in title and description
                        results.push(product.serializedData())
                    }
                })
                fulfill(results)
            })
        })
    }

    /**
     * Get a list of recently posted products.
     *
     * @param { Int } limit - The number of results to limit to.
     * @return { Promise } Returns a Promise with an array of the products found.
     */
    static queryRecent(limit) {
        var ref = productRef
        var results = []
        return new Promise((fulfill, reject) => {
            ref.orderByChild("createdAt")
                .limitToLast(limit)
                .once('value', query => {
                    query.forEach( snapshot => {
                        const product = new Product(snapshot.val())
                        results.push(product.serializedData())
                    })
                    fulfill(results)
                })
        })
    }

    /**
     * Override
     * @return { JSON } Returns the data of the object in JSON format.
     *
     * Example serialized JSON data of a Product:
     * {
     *    "uid": "-KWiI8mOboWn9djoP3I6",
     *    "sellerId": "-KWe-2UDZONSTD-UZfJK",
     *    "title": "Apple",
     *    "image": "",
     *    "description": "An expensive apple.",
     *    "price": 1000.00,
     *    "exists": true,
     *    "createdAt": "2016-11-16T18:01:04.436Z",
     *    "updatedAt": "2016-11-16T18:01:04.436Z"
     * }
     */
    serializedData() {
        var data = super.serializedData()
        data.sellerId = this.sellerId
        data.image = this.image
        data.title = this.title
        data.description = this.description
        data.price = this.price
        data.tags = this.tags
        return data
    }
}
