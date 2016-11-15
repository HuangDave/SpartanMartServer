
const assert = require('chai').assert
const request = require('supertest')
const app = require('../server')
const User = require('../app/models/user')
const Product = require('../app/models/product')

describe('User', function() {

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

    it('should be able to fetch their account info w/o error', done => {
        request(app)
            .get('/users/' + userId)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Authorization', 'bearer ' + authToken)
            .send()
            .expect(200, (error, res) => {
                if (error) {
                    throw new Error(error)
                }
                const user = res.body
                assert.equal(mockUserData.email, user.email)
                assert.equal(mockUserData.name.first, user.name.first)
                assert.equal(mockUserData.name.last, user.name.last)
                done()
            })
    }).timeout(5000)

    // TODO: Add test case for updating profile image
    it('should be able to update the user\'s profile image w/o error')

    it('should be able to update the user\'s password and contact w/o error', done => {
        const oldPassword = '1234567'
        const newPassword = '7654321'
        const newContact  = '3213214321'
        request(app)
            .put('/users/' + userId)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('Authorization', 'bearer ' + authToken)
            .send({
                password: {
                    old: oldPassword,
                    new: newPassword
                },
                contact: newContact
            })
            .expect(200, (error, res) => {
                if (error) {
                    throw new Error(error)
                }
                User.queryById(userId)
                .then( user => {
                    //assert(bcrypt.compareSync(user.password, newPassword))
                    assert.equal(user.contact, newContact)
                    done()
                })
            })
    })
})
