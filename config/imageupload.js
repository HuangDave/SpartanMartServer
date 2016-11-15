
const multer = require('multer')
const gcs = require('multer-gcs')

const storage = gcs({
    filename: function(req, file, cb) {
        cb( null, Date.now())
    },
    bucket: 'spartanmart-5c83e.appspot.com',
    projectId: '',
    keyFilename: __dirname + '/gcs_config.json'
});

const gcsUpload = multer({ storage: storage })

exports.storage = storage
exports.gcsUpload = gcsUpload
