
// initialize firebase...
const assert = require('chai').assert
const request = require('supertest')
const app = require('../server')
const Product = require('../app/models/product')

describe('Product Management', function() {

    const mockUserData = require('./mock_data').user

    // userId and token are set when the user is authenticated
    var userId, authToken
    // set when a product is added, used as a reference to test the removal of the product
    var productId

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

    it('should be able to post a product w/o error', done => {
        request(app)
            .post('/products/' + userId)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Authorization', 'bearer ' + authToken)
            .send({
                title: "Macbook Pro 2015",
                description: "a laptop asjdhfasdhkjahsdkjahskdjhkj",
                price: 1000.00
            })
            .expect(201, (error, res) => {
                if (error) {
                    throw new Error(error)
                }
                productId = res.body.uid
                done()
            })
    })

    it('should be able to fetch posted products w/o error', done => {
        request(app)
            .get('/products/' + userId + '/list')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Authorization', 'bearer ' + authToken)
            .expect(200, (error, res) => {
                if (error) {
                    throw new Error(error)
                }
                assert(res.body.length > 0)
                done()
            })
    })

    it('should be able to update a product post w/o error', done => {
        const updates = {
            description: "an expensive laptop",
            price: 3000.0
        }
        request(app)
            .put('/products/' + userId + '/' + productId)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Authorization', 'bearer ' + authToken)
            .send(updates)
            .expect(200, (error, res) => {
                if (error) {
                    throw new Error(error)
                }
                const product = res.body.product
                assert(res.body.message == 'product is updated')
                done()
            })
    })

    it('should be able to delete a post w/o error', done => {
        request(app)
            .delete('/products/' + userId + '/' + productId)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Authorization', 'bearer ' + authToken)
            .expect(200, (error, res) => {
                if (error) {
                    throw new Error(error)
                }
                done()
            })
    })
})
