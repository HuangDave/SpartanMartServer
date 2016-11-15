
const nodemailer = require('nodemailer')
const xoauth2 = require('xoauth2');
const config = require("./config.json").gmail

// TODO: Fix invalid Authentication error
const transporter = nodemailer.createTransport('SMTP', {
    service: 'gmail',
    auth: {
        xouath2: xoauth2.createXOAuth2Generator({
            user: config.user,
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            refreshToken: config.refreshToken
            //accessToken: 'ya29.Ci-1A0FP7FNy2hnzEIv3JPe_nInQ9TAQc0nVau5l7dUz_lhSxxZMRedOkh8Mmy68Eg'
        })
    }
})

module.exports = {
    sendRecoveryEmail: email => {
        return new Promise((fulfill, reject) => {
            console.log('sending email');
            transporter.sendMail({
                    from: config.user,
                    to: email,
                    subject: "SpartanMart Password Recovery",
                    //generateTextFromHTML: true,
                    test: 'test email',
                    //html: "<b>Testing</b>"
                }, (error, res) => {
                    if (error) {
                        console.log('not sent');
                        console.log(error)
                        reject(error)
                    } else {
                        console.log('sent');
                        console.log(res)
                        fulfill(res)
                    }
                    transporter.close()
                })
        })
    }
}
