"use strict";

const https = require('https');
const AWS = require('aws-sdk');
const Promise = require('bluebird');
const agent = new https.Agent({maxSockets: 25});
AWS.config = new AWS.Config({region: 'us-west-2', httpOptions: {agent: agent}});


const TYPE = ['NA', 'analyst', 'recipient', 'driver', 'NA', 'dispatch', 'preparer'];

const encrypted_secret = process.env.SECRET;
let decrypted_secret;


function processEvent(event, context, callback) {

  if (event.type){
    require(`./computing/controllers/${TYPE[event.type]}`)(event, decrypted_secret)
    .then(response => {
      callback(null, response);
    })
    .catch(err => {
      callback(err);
    });
  } else if (event.token && event.delete === undefined) {
    require(`./computing/tokens/validate`)(event, decrypted_secret)
    .then(response => {
      callback(null, response);
    })
    .catch(err => {
      callback(err);
    });
    return;
  } else if (event.delete) {
    require('./computing/tokens/delete')(event)
    .then(response => {
      callback(null, response);
    })
    .catch(err => {
      callback(err);
    });
  }

}

exports.handler = (event, context, callback) => {
  if (decrypted_secret !== undefined) {
      processEvent(event, context, callback);
  } else {
    const kms = new AWS.KMS();
    kms.decrypt({ CiphertextBlob: new Buffer(encrypted_secret, 'base64') }, (err, data) => {
        if (err) {
            console.log('Decrypt error:', err);
            return callback(err);
        }
        decrypted_secret = data.Plaintext.toString('ascii');
        processEvent(event, context, callback);

    });
  }
};
