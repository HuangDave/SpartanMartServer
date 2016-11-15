
// initialize Stripe with api key.
const stripe = require("stripe")(require('./config.json').stripe.secretKey)

module.exports = {

    /**
     * Creates a Stripe Connect account for a newly created User.
     * This account is managed by SpartanMart.
     *
     * Refer to the Stripe API for account creation here: https://stripe.com/docs/api/node#create_account
     *
     * @param  { User }    user - User to create the Stripe account for.
     * @return { Promise } Returns a Promise containing the data of the
     *                     created account id.
     *                     The promise is rejected if the user already has
     *                     a corresponding Connect account.
     */
    createAccount: email => {
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
    },

    /**
     * Creates a Stripe Customer account for a newly created User.
     * This Customer account will be used to manage the user's credit/debit cards.
     *
     * Refer to the Stripe API for Customer creattion here: https://stripe.com/docs/api#create_customer
     *
     * @param  { User }    user - User to create the customer for.
     * @return { Promise } Returns a Promise containing the data of the
     *                     created customer id.
     *                     The promise is rejected if the user already has
     *                     a corresponding Customer account.
     */
    createCustomer: user => {
        return new Promise((fulfill, reject) => {
            stripe.customers.create({
                account_balance: 0,                             // Integer with units in cents.
                email: user.email,
                description: 'Customer for user: ' + user.uid
            }, (error, customer) => {
                if (error)
                    reject(error)
                else
                    fulfill(customer.id)
            })
        })
    },

    /**
     * Get a customer's data from Stripe with the given customerId.
     *
     * @param  { String } customerId - ID of the customer on Stripe.
     * @return { Promise } Returns a Promise with a JSON object containing the customer's data.
     */
    fetchCustomer: customerId => {
        stripe.customers
            .retrieve(customerId,
                (error, customer) => {
                    if (error) {
                        return Promise.reject(error)
                    }
                    return Promise.fulfill(customer)
                }
            )
    }
}
