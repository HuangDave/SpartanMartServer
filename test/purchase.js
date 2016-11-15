
const assert = require('chai').assert
const request = require('supertest')
const app = require('../server')

describe('Product Purchase', function() {

    const mockUserData = require('./mock_data').user

    // userId and token are set when the user is authenticated
    var userId, authToken

    // product to test purchase
    const productId = "-KYuG22GyjB0-iL7W-v8"

    before( done => {
        request(app)
            .post('/auth/login')
            .expect('Content-Type', /json/)
            .send({
                email: mockUserData.email,
                password: mockUserData.password
            })
            .end((error, res) => {
                if (error) {
                    throw new Error(error)
                }
                assert(res.body.token)
                userId = res.body.user.uid
                authToken = res.body.token
                done()
            })
    })

    it('should complete a transaction', done => {
        request(app)
            .post('/purchase')
            .set('Accept', 'application/json')
            .set('Authorization', 'bearer ' + authToken)
            .send({
                userId: userId,
                productId: productId
            })
            .expect(200, (error, res) => {
                if (error) {
                    throw new Error(error)
                }
                console.log(JSON.stringify(res.body));
                //assert(res.body.status == 'succeeded')
                done()
            })
    })

})
