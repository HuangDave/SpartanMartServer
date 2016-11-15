
const assert = require('chai').assert
const request = require('supertest')
const app = require('../server')
const User = require('../app/models/user')
const Transaction = require('../app/models/transaction')

describe('Transaction History', function() {

    const mockUserData = require('./mock_data').user

    // userId and token are set when the user is authenticated
    var userId, authToken

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

    it('should be able to fetch their transation history, if any, w/o error', done => {
        request(app)
            .get('/transactions/' + userId + '/list')
            .set('Accept', 'application/json')
            .set('Authorization', 'bearer ' + authToken)
            .send()
            .expect(200, (error, res) => {
                if (error) {
                    throw new Error(error)
                }
                assert(res.body.length > 0)
                done()
            })
    })
})
