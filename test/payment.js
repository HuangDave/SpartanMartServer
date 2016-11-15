
const assert = require('chai').assert
const request = require('supertest')
const app = require('../server')
const User = require('../app/models/user')

describe('Payment Management', function() {

    const user = require('./mock_data').user

    // Visa credit card
    const creditCard = require('./mock_data').visaCreditCard

    // userId and token are set when the user is authenticated
    var userId, authToken, cardId

    before( done => {
        request(app)
            .post('/auth/login')
            .expect('Content-Type', /json/)
            .send({
                email: user.email,
                password: user.password
            })
            .end((error, res) => {
                if (error) {
                    throw new Error(error)
                }
                userId = res.body.user.uid
                authToken = res.body.token
                done()
            })
    })

    it('should add a new payment method w/o error', done => {
        request(app)
            .post('/users/' + userId + '/cards')
            .set('Accept', 'application/json')
            .set('Authorization', 'bearer ' + authToken)
            .send(creditCard)
            .expect(201, (error, res) => {
                if (error) {
                    throw new Error(error)
                }
                assert(res.body.id)
                cardId = res.body.id
                done()
            })
    })

    it('should get a information of a specific payment method w/o error', done => {
        request(app)
            .get('/users/' + userId + '/cards/' + cardId)
            .set('Accept', 'application/json')
            .set('Authorization', 'bearer ' + authToken)
            .expect(200, (error, res) => {
                if (error) {
                    throw new Error(error)
                }
                done()
            })
    })

    it('should update a payment method w/o error', done => {
        const update = {
            exp_month: "01",
            exp_year: "2030"
        }
        request(app)
            .put('/users/' + userId + '/cards/' + cardId)
            .set('Accept', 'application/json')
            .set('Authorization', 'bearer ' + authToken)
            .send({ card: update })
            .expect(200, (error, res) => {
                if (error) {
                    throw new Error(error)
                }
                done()
            })
    })

    it('should remove a payment method w/o error', done => {
        request(app)
            .delete('/users/' + userId + '/cards/' + cardId)
            .set('Accept', 'application/json')
            .set('Authorization', 'bearer ' + authToken)
            .expect(200, (error, res) => {
                if (error) {
                    throw new Error(error)
                }
                done()
            })
    })

    it('should list all of the user\'s payment methods (cards) w/o error', done => {
        request(app)
            .get('/users/' + userId + '/cards/')
            .set('Accept', 'application/json')
            .set('Authorization', 'bearer ' + authToken)
            .send(creditCard)
            .expect(200, (error, res) => {
                if (error) {
                    throw new Error(error)
                }
                assert(res.body.length > 0)
                done()
            })
    })
})
