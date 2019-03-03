const config = require('../config')
const crate = require('node-crate');
const googleMapsClient = require('@google/maps').createClient({
    key: config.MAPS_API_KEY,
    Promise: Promise
});

crate.connect('localhost', '4200')

let retrieveMapsData = function (long, lat) {
    return new Promise((resolve, reject) => {
        const geopoint = `POINT (${long} ${lat})` //[long, lat];
        crate.execute("select * from tracknamic.geo_data where distance(coordinates, ?) < 10 limit 1", [geopoint]).then((res) => {
            console.log(res.json.length)
            if (!res.json.length) {
                getMapsData(long, lat).then((mapsData) => {
                    const results = mapsData.json.results[0]
                    let address = {}
                    address.formatted = results.formatted_address
                    results.address_components.forEach(function (component) {
                        address[component.types[0]] = { 'short_name': component.short_name, 'long_name': component.long_name }
                    })

                    getRoadSpeedLimit(results.place_id).then((roadData) => {
                        let obj = { address: address, coordinates: [long, lat], country: address['country'].long_name, speed_limit: '0', updated_at: new Date()}
                        if(roadData.json.speedLimits) { 
                            let speedLimit = roadData.json.speedLimits[0].speedLimit
                            obj.speed_limit = speedLimit
                        }
                        storeMapsData(obj).then(data => { console.log(data) }).catch(err => { console.log(err) })
                        resolve([obj])
                    }).catch(err => {
                        console.log('getRoadSpeedLimit error::', err)
                        reject(err)
                    });
                }).catch(err => {
                    console.log('getMapsData error::', err)
                    reject(err)
                });
            } else {
                resolve(res.json)
            }
        }).catch((err) => {
            console.log(err)
            reject(err)
        });
    })
}

let getMapsData = function (long, lat) {
    return new Promise((resolve, reject) => {
        googleMapsClient.reverseGeocode({ latlng: [lat, long] }).asPromise().then((data) => {
            resolve(data);
        })
    });
}

let storeMapsData = function (data) {
    return new Promise((resolve, reject) => {
        let fields = {
            'address': data.address,
            'coordinates': data.coordinates,
            'country': data.country,
            'speed_limit': data.speed_limit,
            'updated_at': new Date()
        }

        crate.insert('tracknamic.geo_data', fields).then((result) => {
            resolve(result)
        }).catch(err => { reject(err) })
    });
}

let getRoadSpeedLimit = function (place_id) {
    return new Promise((resolve, reject) => {
        googleMapsClient.speedLimits({ placeId: [place_id] }).asPromise().then((data) => {
            resolve(data)
        })
    });
}

module.exports.retrieveMapsData = retrieveMapsData;
module.exports.getMapsData = getMapsData;