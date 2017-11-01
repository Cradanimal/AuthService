'use strict';

const request = require('request-promise');
const Promise = require('bluebird');
const bcrypt = require('bcrypt');
const token = require('../tokens/initialize');

module.exports = (event, res) => {

  return new Promise((resolve, reject) => {

    if (event.email && event.password && event.UUID) {
      event.email = event.email.toLowerCase();
      const params = {
        TableName: 'Recipient',
        IndexName: 'EmailHash-Email-Index',
        KeyConditionExpression: 'EmailHash = :eh and Email = :email',
        // FilterExpression: 'Email = :email ',
        ExpressionAttributeValues: { ':eh': event.email.slice(0,1), ':email': event.email },
        ProjectionExpression: 'Password, RecipientId, MobileVerified'
      };

          // TODO:

      // dynamo.query(params).promise()

      .then(data => {
        if (data.Count > 0) {
          event.recipientId = data.Items[0].RecipientId;
          event.verified = data.Items[0].MobileVerified;
          if (data.Items[0].Password) {
            return bcrypt.compare(event.password, data.Items[0].Password);
          } else {
            reject({ errorCode: 404, reason: 'User does not have a password set up, advise them to contact us to configure one for them', message: 'Account has not been activated, please contact us for assistance'});
          }
        } else {
          reject({errorCode: 404, reason: 'value does not match any record in Recipient Table', message: 'Invalid Email'});
        }

      })
      .then(match => {
        if (match) {
          // next();
          // CALL TO GET TOKEN
          return token({RecipientId : event.recipientId, Sandbox: false }, event.UUID, event.recipientId, 'recipient');
        } else {
          reject({errorCode: 404, reason: 'password is not a match to hash in table'});
          throw {error: 'responseSent'}
        }
      })
      .then(token => {
        resolve({token: token, id: event.recipientId, type: 2});
      })
      .catch(err => {
        console.log('DB QUERY ERROR', err);
        reject(err);
      });
    } else {
      reject({errorCode: 404, reason: 'request is missing a nessary value to login; email, password, or UUID', message: 'Missing Field: Email or Password'});
    }

  });
};
