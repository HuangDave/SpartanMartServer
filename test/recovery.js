
const assert = require('chai').assert
const request = require('supertest')
const app = require('../server')

describe.skip("Account Password Recovery", function() {

    it('should send an email for password reset', done => {
        request(app)
            .post('/users/recover')
            .send({
                email: 'huangd95@gmail.com'
            })
            .end((error, res) => {
                if (error) {
                    throw new Error(error)
                }
                assert(res.body.status == 'sent')
                done()
            })
    })
})
