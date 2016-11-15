
const assert = require('chai').assert
const request = require('supertest')
const app = require('../server')
const User = require('../app/models/user')

describe('Registration & Login', function() {

    const user = require('./mock_data').user
    const newUser = require('./mock_data').newUser

    // Id of the new user used for testing registration, Id is used for deleting the user
    var newUserId

    after( done => {
        if (newUserId == null) {
            done()
            return
        }
        User.delete(newUserId)
            .then(done())
            .catch( error => {
                throw new Error(error)
            })
    })

    it('it should require an @sjsu.edu email at registration', done => {
        request(app)
            .post('/auth/signup')
            .expect('Content-Type', /json/)
            .send({
                email: 'john.appleseed@yahoo.com',
                password: '1234567'
            })
            .expect(400, (error, res) => {
                done()
            })
    }).timeout(3000)

/*
    it('should be able to register with an @sjsu.edu email if it is not in use', done => {
        request(app)
            .post('/auth/signup')
            .send({
                email: newUser.email,
                passoword: newUser.password,
                first_name: 'Test',
                last_name: 'user',
                contact: '1231231234'
            })
            .expect((error, res) => {
                if (error) {
                    throw new Error(error)
                }
                assert(res.body.token)
                newUserId = res.body.user.uid
                done()
            })
    }).timeout(4000) */

    it('should authenticate a registered user w/o error', done => {
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
                assert(res.body.token)
                done()
            })
    })
})
