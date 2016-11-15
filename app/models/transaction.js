
const Object = require('./object')
require('../../config/firebase')
const admin = require('firebase-admin')
const db = admin.database()
const transactionsRef = db.ref('/transactions')

'use strict'
module.exports = class Transaction extends Object {

    constructor(data) {
        super(data)
        this.chargeId = data.chargeId
        this.sellerId = data.sellerId
        this.status = data.status
        this.buyerId = data.buyerId
        this.product = data.product

        if (this.exists) {
            this.ref = transactionsRef.child(this.uid)
        } else {
            this.ref = transactionsRef
        }
    }

    /**
     * Query transactions from database by userId.
     *
     * @param { String } userid - Id of the user
     * @return { Promise } Returns a Promise containing an array of transactions.
     */
    static queryByUserId(userId) {
        var ref = transactionsRef
        return new Promise(function(fulfill, reject) {
            ref.on('value', querySnapshot => {
                var transactions = []
                if (querySnapshot.numChildren() > 0) {
                    querySnapshot.forEach( snapshot => {
                        transactions.push(snapshot.val())
                    })
                }
                fulfill(transactions)
            }, error => {
                reject(error)
            })
        })
    }

    serializedData() {
        var data = super.serializedData()
        data.chargeId = (this.chargeId == null ? "" : this.chargeId)
        data.sellerId = this.sellerId
        data.status = this.status
        data.buyerId = this.buyerId
        data.product = this.product
        return data
    }
}
