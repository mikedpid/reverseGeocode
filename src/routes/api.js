const express = require('express');
let router = express.Router();
let {retrieveMapsData} = require('../controllers/geocodeReverse');

router.get('/api/v1/geocode/reverse/:long/:lat', (req, res) => {
    const long = parseFloat(req.params.long)
    const lat = parseFloat(req.params.lat)

    retrieveMapsData(long, lat).then((data) => {
        return res.status(200).send(data)
    }).catch(err => console.log)

})

module.exports = router;