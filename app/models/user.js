
const Object = require('./object')
require('../../config/firebase')
const stripe = require("stripe")(require('../../config/config.json').stripe.secretKey)
const bcrypt = require('bcrypt-nodejs')
const admin = require('firebase-admin')
const db = admin.database()
const userRef = db.ref('/users')

'use strict'
module.exports = class User extends Object {

    /**
     * Initialize a User object with provided data
     *
     * @param { JSON } data - Contains the data of the User object and consists of the following required fields:
     *                          - { String } stripeId - ID of the user's Stripe Connect Account.
     *                          - { String } email    - The user's email.
     *                          - { String } password - The user's password.
     *                          - { Object } name     - Consists of two components: first and last.
     *                                  - { String } first - First name of the user.
     *                                  - { String } last  - Last name of the user.
     *                          - { String } contact  - The user's phone number.
     */
    constructor(data) {
        super(data)
        this.stripe = data.stripe
        this.email = data.email
        this.password = data.password
        this.name = data.name
        this.contact = data.contact
        this.profile_image = data.profile_image
        this.verified = data.verified   // True if the user verified their email
        this.products = data.products == null ? [] : data.products

        // if the object already exists in the database, initialize its reference
        if (this.exists) {
            this.ref = userRef.child(this.uid) // reference in database
        } else {
            this.ref = userRef
            this.stripe = {
                accountId: "",
                customerId: ""
            }
            this.verified = false
        }
    }

    /**
     * Query a user by ID.
     *
     * @param  { String }  userId - ID of the user.
     * @return { Promise } Returns a Promise consisting of the User object if the user exists.
     */
    static queryById(userId) {
        var ref = userRef.child(userId)
        return new Promise((fulfill, reject) => {
            ref.once("value", snapshot => {
                if (snapshot.exists()) {
                    fulfill(new User(snapshot.val()))
                } else {
                    reject("User doesn't exist")
                }
            })
        })
    }

    /**
     * Query a user by email.
     *
     * @param  { String }  email - Email to search
     * @return { Promise } Returns a User object if the provided email is registered.
     */
    static queryByEmail(email) {
        var ref = userRef
        return new Promise((fulfill, reject) => {
            ref.orderByChild("email")
                .equalTo(email)
                .limitToFirst(1)
                .on("value", querySnapshot => {              // querySnapshot is an array of users found
                    if (querySnapshot.numChildren() > 0) {   // querySnapshot should have at least 1 object
                        querySnapshot.forEach( snapshot => { // return the first user in the querySnapshot
                            const data = snapshot.val()
                            if (data.email == email) {
                                fulfill(new User(data))
                                return
                            }
                        })
                    } else { // querySnapshot is empty...user is not registered
                        reject(new Error("This email is not registered."))
                    }
                })
        })
    }

    /**
     * Delete a user from the database.
     *
     * @param { String } userId - ID of user to delete.
     */
    static delete(userId) {
        const ref = userRef.child(userId)
        return new Promise((fulfill, reject) => {
            ref.remove( error => {
                if (error) reject(error)
                else       fulfill()
            })
        })
    }

    /**
     * @return { JSON } Returns the data of the object in JSON format.
     *
     * Example serialized JSON data of a User:
     * {
     *    "uid": "-KWe-2UDZONSTD-UZfJK",
     *    "email": "john.appleseed@sjsu.edu",
     *    "password": "1234567",
     *    "name": {
     *        "first": "John",
     *        "last": "Appleseed"
     *    },
     *    "contact": "1231231234",
     *    "prodcuts": [
     *        "-KWelB7EJVTT3a-wuMd6",
     *        "-KWelQZtblR_fR-7iFkC"
     *    ],
     *    "verified": false,
     *    "exists": true,
     *    "createdAt": "2016-11-15T21:59:09.118Z",
     *    "updatedAt": "2016-11-16T18:01:04.501Z"
     * }
     */
    serializedData() {
        var data = super.serializedData()
        data.email = this.email
        data.password = this.password
        data.name = this.name
        data.contact = this.contact
        data.products = this.products
        data.verified = this.verified
        if (this.profile_image) { data.profile_image = this.profile_image }
        return data
    }

    /**
     * Override save method to create a new Stripe Connect Account if the user is newly registered...
     */
    save() {
        var self = this
        return super
                .save()
                .then(function() {
                    if (self.stripe.accountId == "") {                  // created a stripe managed & customer account if new user
                        var stripeInfo = {
                            accountId: "",
                            customerId: ""
                        }
                        return self.createStripeAccount()
                                    .then(accountId => {
                                        stripeInfo.accountId = accountId
                                        return stripeInfo
                                    })
                                    .then( stripeInfo => {
                                        return self.createStripeCustomer()
                                                    .then(customerId => {
                                                        stripeInfo.customerId = customerId
                                                        return stripeInfo
                                                    })
                                    })
                                    .then( stripeInfo => {
                                        return self.update({ stripe: stripeInfo })
                                    })
                    } else {
                        return Promise.fulfill()
                    }
                })
                .catch( error => {
                    console.log(error)
                    return Promise.reject(error)
                })
    }

    /**
     * Creates a Stripe Connect account for a newly created User.
     * This account is managed by SpartanMart.
     *
     * Refer to the Stripe API for account creation here: https://stripe.com/docs/api/node#create_account
     *
     * @return { Promise } Returns a Promise containing the data of the
     *                     created account id.
     *                     The promise is rejected if the user already has
     *                     a corresponding Connect account.
     */
    createStripeAccount() {
        const email = this.email
        return new Promise((fulfill, reject) => {
            stripe.accounts.create({
                managed: true,
                country: 'US',
                email: email
            }, (error, account) => {
                if (error)
                    reject(error)
                else
                    fulfill(account.id)
            })
        })
    }

    /**
     * Creates a Stripe Customer account for a newly created User.
     * This Customer account will be used to manage the user's credit/debit cards.
     *
     * Refer to the Stripe API for Customer creattion here: https://stripe.com/docs/api#create_customer
     *
     * @return { Promise } Returns a Promise containing the data of the
     *                     created customer id.
     *                     The promise is rejected if the user already has
     *                     a corresponding Customer account.
     */
    createStripeCustomer() {
        const email = this.email
        const uid = this.uid
        return new Promise((fulfill, reject) => {
            stripe.customers.create({
                account_balance: 0,                             // Integer with units in cents.
                email: email,
                description: 'Customer for user: ' + uid
            }, (error, customer) => {
                if (error) reject(error)
                else       fulfill(customer.id)
            })
        })
    }

    /**
     * Update the user's password if the prodived old password matches with the currently stored password.
     *
     * @param { String } oldPassword
     * @param { String } newPassword
     * @return { Promise }
     */
    updatePassword(oldPassword, newPassword) {
        if (bcrypt.compareSync(oldPassword, this.password)) {
            this.password = bcrypt.hashSync(newPassword)
            return this.update({ password: this.password })
        } else {
            return Promise.reject('Invalid password combination!')
        }
    }

    updateContact(newContact) {
        this.contact = newContact
        return this.update({ contact: this.contact })
    }

    /**
     * Creates a token from the given data of a credit/debit card and then stores the token
     * for later use.
     * Since only the token, and not the actual card info, is stored, PCI Compliance is met.
     *
     * For card token creation refer to https://stripe.com/docs/api#create_card_token
     * For card creation refer to https://stripe.com/docs/api#create_card
     *
     * @param { JSON } card - Consists of information of the card.
     *                        Must consist of the following:
     *                          { String } number    - credit/debit card number
     *                          { String } exp_month - valid expiration month found on the card
     *                          { String } exp_year  - valid expiration year found on the card
     *                          { String } cvc       - card security code
     * @param { Promise }
     */
    addCard(card) {
        const customerId = this.stripe.customerId
        return new Promise((fulfill, reject) => {
            stripe.tokens.create({
                    card: card
                }, (error, token) => {
                    stripe.customers.createSource(
                        customerId,
                        { source: token.id },
                        (error, card) => {
                            if (error)  reject(error)
                            else        fulfill(card)
                        })
                })
        })
    }

    /**
     * Update a user's credit card information.
     *
     * Refer to https://stripe.com/docs/api#update_card
     *
     * @param { String } cardId - Id of the card to remove.
     * @param { JSON }   info   - Information of the card to update.
     * @return { Promise }        Returns the updated card in a Promise.
     */
    updateCard(cardId, info) {
        const customerId = this.stripe.customerId
        return new Promise((fulfill, reject) => {
            stripe.customers.updateCard(
                customerId,
                cardId,
                info,
                (error, card) => {
                    if (error)  reject(error)
                    else        fulfill(card)
                }
            )
        })
    }

    /**
     * Get a user's credit/debit card.
     *
     * Refer to https://stripe.com/docs/api#retrieve_card
     *
     * @param { String } cardId - Id of the card to retrieve.
     * @return { Promise }        Promise containing the card in JSON fromat.
     */
    getCard(cardId) {
        const customerId = this.stripe.customerId
        return new Promise((fulfill, reject) => {
            stripe.customers.retrieveCard(
                customerId,
                cardId,
                (error, card) => {
                    if (error)  reject(error)
                    else        fulfill(card)
                }
            )
        })
    }

    /**
     * Remove a card.
     *
     * Refer to https://stripe.com/docs/api#delete_card
     *
     * @param  { String }  cardId - ID of the card saved on Stripe to removed.
     * @return { Promise } Returns a Promise, true if the card is successfully deleted.
     */
    removeCard(cardId) {
        const customerId = this.stripe.customerId
        return new Promise((fulfill, reject) => {
            stripe.customers.deleteCard(
                    customerId,
                    cardId,
                (error, confirmation) => {
                    if (error) {
                        reject(error)
                    }
                    fulfill(confirmation.deleted)
                })
        })
    }

    /**
     * Retrieves an array of all the user's credit/debit cards.
     *
     * Refer to https://stripe.com/docs/api#list_cards
     *
     * @param  { String } customerId - Id of the customer
     * @return { Promise }             Returns a Promise with an array of cards.
     */
    listCards() {
        const customerId = this.stripe.customerId
        return new Promise((fulfill, reject) => {
            stripe.customers.listCards(customerId,
                (error, cards) => {
                    if (error) {
                        reject(error)
                    }
                    fulfill(cards.data)
                })
        })
    }

    /**
     * Adds a product the user posted to their products list and updates itself.
     *
     * @param  { String }  productId - ID of the product to add.
     * @return { Promise }
     */
    addProduct(productId) {
        if (this.products == null) {
            this.products = [productId]
        } else {
            this.products.push(productId)
        }
        return this.update({ products: this.products })
    }

    /**
    * Remove a product the user posted
    *
    * @param  { String }  productId - ID of the product to remove.
    * @return { Promise }
    */
    removeProduct(productId) {
        var ref = db.ref('/products').child(productId)              // database reference of the product
        var self = this
        var index = self.products.indexOf(productId)            // get the index of the product
        if (index != -1) {
            return ref.remove().then(function() {
                self.products.splice(index, 1)                  // remove the product from the user's products list.
                return self.update({ products: self.products }) // update the user's product list in database.
            })
        } else {
            return new Promise.reject(new Error("The user doesn't have this product."))
        }
    }
}
