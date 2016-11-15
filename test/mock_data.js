
const User = require('../app/models/user')
const Product = require('../app/models/product')

// Input variables for tests
module.exports = {

    // used for testing registration
    newUser: {
        email: "johny2.appleseed@sjsu.edu",
        password: "1234567"
    },

    user: {
        email: "john.appleseed@sjsu.edu",
        password: "1234567",
        name: {
            first: "Johny",
            last: "Appleseed"
        },
        contact: "1231231234"
    },

    product: {
        title: "Macbook Pro 2015",
        description: "a laptop asjdhfasdhkjahsdkjahskdjhkj",
        price: 1000.00
    },

    visaCreditCard: {
        number: "4242424242424242",
        exp_month: "12",
        exp_year: "2022",
        cvc: "123"
    },

    visaDebitCard: {
        number: "4000056655665556",
        exp_month: "12",
        exp_year: "2022",
        cvc: "123"
    }
}
