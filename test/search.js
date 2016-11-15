
// initialize firebase...
const assert = require('chai').assert
const request = require('supertest')
const app = require('../server')

describe('Product Search', function() {
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

    it('should be able to query a product by a keyword', done => {
        const keyword = 'Macbook'
        request(app)
            .get('/products/search?keyword=' + keyword)
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

    it('should get the latest added product', done => {
        const limit = 1
        request(app)
            .get('/products/recent?limit=' + limit)
            .set('Authorization', 'bearer ' + authToken)
            .send()
            .expect(200, (error, res) => {
                if (error) {
                    throw new Error(error)
                }
                assert(res.body.length == 1)
                done()
            })
    })

    it('should get all of the latest added product', done => {
        const limit = 1
        request(app)
            .get('/products/recent?')
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
