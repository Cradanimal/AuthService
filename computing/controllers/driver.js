'use strict';

const request = require('request-promise');
const randomToken = require('rand-token');
const token = require('../tokens/initialize');

module.exports = (event, res) => {

  return new Promise((resolve, reject) => {
    if (event.UUID && event.phone && event.confirmId) {
      // USE PHONE NUMBER TO GET DRIVER OBJ
      // USE CONFIRMID TO GET DRIVERID FROM CONFIRMATION TABLE
      // COMPARE ID'S FROM TWO SOURCES
      // IF MATCH CREATE A SESSION USING THE UUID
      const isDriverPhoneValid = {
        IndexName: 'Phone-Index',
        KeyConditionExpression: 'Phone = :phone',
        // FilterExpression: 'Email = :email ',
        ExpressionAttributeValues: { ':phone': `+1${event.phone}` },
        ProjectionExpression: 'DriverId'
      };

      const options = {
        method: 'POST',
        // uri: 'http://180.0.195.100/Dispatcher/Query',
        uri: `http://datacore.copia.vpc/Driver/Query`,
        body: isDriverPhoneValid,
        headers: {
          'User-Agent': 'Request-Promise'
        },
        json: true
      };

      request(options)

      .then(data => {
        if (data.Count > 0) {
          event.driverIdFromDriverTable = data[0].driverId;

          const options = {
            // uri: 'http://180.0.195.100/Dispatcher/Query',
            uri: `http://datacore.copia.vpc/Confirmation/${event.confirmId}`,
            headers: {
              'User-Agent': 'Request-Promise'
            },
            json: true
          };

          return request(options);
        } else {
          reject({ statusCode: 404 });
        }
      })
      .then(data => {
        if (data.id) {
          if (event.driverIdFromDriverTable === data.id) {
            const driverSessionToBe = {
              driverId: event.driverIdFromDriverTable,
              sandbox: false
            };
            return token(driverSessionToBe, event.UUID);
          } else {
            reject({ statusCode: 401 });
          }
        } else {
          reject({ statusCode: 404 });
        }
      })
      .then(token => {
        resolve({token: token, id: event.driverIdFromDriverTable, type: 3});
      })
      .catch(err => {
        reject(err);
      });
    } else {
      reject({reason: 'Missing eventuired params'});
    }

  });
};
