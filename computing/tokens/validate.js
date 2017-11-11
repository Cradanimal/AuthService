'use strict';

const Promise = require('bluebird');
const jwt = Promise.promisifyAll(require('jsonwebtoken'));
const request = require('request-promise');

module.exports = (event, secret) => {

  return new Promise((resolve, reject) => {

    if (event.UUID && event.token) {
      // const verifyBase64UUID = base64Url.encode(event.UUID);
      const verifyBase64UUID = new Buffer(event.UUID).toString('base64');
      const keyUnlock = `${secret}.${verifyBase64UUID}`;
      jwt.verifyAsync(event.token, keyUnlock, { algorithms: ['HS256'] })
      .then(decoded => {
        const params = { TableName: 'Session', KeyConditionExpression: '#T = :token', ExpressionAttributeNames: { '#T': 'Token' }, ExpressionAttributeValues : { ':token': event.token }, ProjectionExpression: 'AnalystId, RecipientId, UserId, DriverId, Username, DispatcherId, PreparerAccessId, #T' };

        // TODO:
        const options = {
            // uri: `http://180.0.195.100/Session/${event.token}`,
            uri: `http://datacore.copia.vpc/Session/${event.token}`,
            headers: {
              'User-Agent': 'Request-Promise'
            },
            json: true
        };
        console.log('hey mang');

        return request(options);
        // return dynamo.query(params).promise();
      })
      .then(data => {
        console.log(data);
        if (data.token) {
          const keys = Object.keys(data);

          const validResponseWithId = keys.reduce((acc, val) => {
            if(acc.message === 'invalid key') {
              console.log(data[val], val);
              acc = attachIdAndType(data[val], val);
              }
              console.log(acc);
              return acc;
          },{ message: 'invalid key' });
          resolve(validResponseWithId);
        } else {
          resolve({valid: false, hi: data });
        }
      })
      .catch(err => {
        console.log(err);
        if (err.message === 'invalid token' || err.message === 'invalid signature' || err.message === 'invalid key') {
          reject({errorCode: 404, valid: false});
        } else if (err.message === 'jwt malformed') {
          reject({errorCode: 404, valid: false});
        } else {
          reject({errorCode: 500, valid: false});
        }
      });
    } else {
      reject({valid: false, reason: 'missing params'});
    }

  });
};


function attachIdAndType (id, key) {
let type;
switch (key) {
  case 'userId':
    type = 0;
    break;
  case 'analystId':
    type = 1;
    break;
  case 'recipientId':
    type = 2;
    break;
  case 'driverId':
    type = 3;
    break;
  case 'username':
    type = 4;
    break;
  case 'dispatcherId':
    type = 5;
    break;
  case 'preparerAccessId':
    type = 6;
    break;
  default:
  return { message: 'invalid key' };
}

return {type: type, id: id, valid: true};
}
