'use strict';

const request = require('request-promise');
const Promise = require('bluebird');
const bcrypt = require('bcrypt');
const token = require('../tokens/initialize');

module.exports = (event, secret) => {
  return new Promise((resolve, reject) => {
    // PULL DISPATCHER USING EMAIL
    // VALIDATE PASSWORD AGAINST HASH
    // CHECK IF ATHORITYID POINTS TO A RECORD IN THE DATABASE
    // IF SO, CREATE A TOKEN USING SENT UUID AND RETURN IT :)
    if (event.email && event.password && event.UUID) {
      event.email = event.email.toLowerCase();
      const getDispatcherRecord = {
        IndexName: 'Email-Index',
        KeyConditionExpression: 'Email = :email',
        ExpressionAttributeValues: { ':email': event.email },
        ProjectionExpression: 'Password, DispatcherId, AuthorityId'
      };

      const options = {
        method: 'POST',
        // uri: 'http://180.0.195.100/Dispatcher/Query',
        uri: `http://datacore.copia.vpc/Dispatcher/Query`,
        body: getDispatcherRecord,
        headers: {
          'User-Agent': 'Request-Promise'
        },
        json: true
      };

      request(options)

      // dynamo.query(getDispatcherRecord).promise()
      .then(JSON.parse)
      .then(data => {
        if (data.length > 0) {
          console.log(event.password, data[0].password);
          event.dispatcherId = data[0].dispatcherId;
          event.authorityId = data[0].authorityId;
          return bcrypt.compare(event.password, data[0].password);
        } else {
          reject({errorCode: 404, reason: 'value does not match any record in Dispatcher Table' });
        }
      })
      .then(match => {
        if (match) {
          console.log('match');

          // next();
          // CALL TO GET TOKEN
          const verifyAuthorityId = {
            TableName: 'Authority',
            KeyConditionExpression: 'AuthorityId = :auth',
            ExpressionAttributeValues: { ':auth': event.authorityId }
          };

          const options = {
            // uri: 'http://180.0.195.100/Authority/${event.authorityId}',
            uri: `http://datacore.copia.vpc/Authority/${event.authorityId}`,
            headers: {
              'User-Agent': 'Request-Promise'
            },
            json: true
          };

          return request(options);
                // TODO:

          // return dynamo.query(verifyAuthorityId).promise();
        } else {
          reject({errorCode: 404, reason: 'password is not a match to hash in table' });
        }
      })
      .then(data => {
        console.log("data");
        if (data.authorityId) {
          return token({dispatcherId : event.dispatcherId, sandbox: false }, event.UUID, secret);
        } else {
          reject({errorCode: 404, reason: 'Invalid AuthorityId' });
        }
      })
      .then(token => {
        resolve({token: token, id: event.dispatcherId, type: 5});
      })
      .catch(err => {
        console.log('DB QUERY ERROR', err);
        reject(err);
      });
    } else {
      reject({errorCode: 404, reason: 'request is missing a nessary value to login; email, password, or UUID'});
    }

  });
};
