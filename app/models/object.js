
require('../../config/firebase')

const Promise = require('promise')
const admin = require('firebase-admin')
const db = admin.database()

'use strict'
module.exports = class Object {

    /**
     * Initialize an Object with the provided data.
     * Overriden in subclasses.
     *
     * @param { JSON } data - Contains the data of the User object.
     */
    constructor(data) {
        this.uid = data.uid             // unique identifier of the object
        this.exists = data.exists       // true if the data already exists in the database
        this.createdAt = data.createdAt // date the object was created
        this.updatedAt = data.updatedAt // date the object was last updated

        if (!this.exists) {
            this.exists = false
        }
    }

    /**
     * Delete the object from the database.
     *
     * @return { Promise }
     */
    delete() {
        const ref = this.ref
        return new Promise((fulfill, reject) => {
            ref.remove( error => {
                if (error) reject(error)
                else       fulfill()
            })
        })
    }

    /**
     * Returns the data of the object in JSON format.
     *
     * @return { JSON } Returns the data of the object in JSON format.
                        Contains the following:
                            - uid: {String }
                            - exists: { boolean}
                            - createdAt: { Date }
                            - updatedAt: { Date }
     */
    serializedData() {
        return {
            uid: this.uid,
            exists: this.exists,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        }
    }

    /**
     * Update the object in Firebase with provided data
     *
     * @param { JSON } data - Consists of data to update
     */
    update(data) {
        const self = this
        const ref = this.ref
        data.updatedAt = new Date()
        return new Promise((fulfill, reject) => {
            ref.update(data, error => {
                if (error) {
                    reject(error)
                } else {
                    fulfill(self)
                }
            })
        })
    }

    /**
     * Update the object in Firebase to reflect the Object's current data.
     */
    save() {
        var date = new Date()

        // create a new node if the object did not previously exist in the database
        if (!this.exists) {
            var baseRef = this.ref
            const key = this.ref.push().key
            this.ref = baseRef.child(key)
            this.uid = key
            this.exists = true
            this.createdAt = date
        }
        this.updatedAt = date

        const data = this.serializedData()
        const ref = this.ref
        const self = this
        return new Promise((fulfill, reject) => {
            ref.update(data, error => {
                if (error) {
                    reject(error)
                } else {
                    fulfill(self)
                }
            })
        })
    }
}
