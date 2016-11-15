
const express = require('express')
const router = express.Router()
const fs = require('fs')

const gcs = require('@google-cloud/storage')({
  projectId: 'spartanmart-5c83e',
  credentials: require('../../config/config.json').gcs
})

const storage = gcs.bucket('spartanmart-5c83e.appspot.com');

router

    .get('/:imageId', (req, res, next) => {
        var remoteReadStream = storage.file(req.params.imageId).createReadStream()
        remoteReadStream.pipe(res)
    })
;
module.exports = router
