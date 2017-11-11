'use strict';

const request = require('request-promise');

module.exports = (event) => {
    return new Promise((resolve, reject) => {

      const options = {

        method: 'DELETE',
        uri: `http://datacore.copia.vpc/Session/${event.token}`,
        headers: {
          'User-Agent': 'Request-Promise'
        },
        json: true
      };

      request(options)

      .then(response => {
        resolve({success: true});
      })
      .catch(err => {
        reject({errorCode: 404, success: false});
      });

    });
};
