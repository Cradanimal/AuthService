"use strict";

const https = require('https');
const AWS = require('aws-sdk');
const Promise = require('bluebird');
const agent = new https.Agent({maxSockets: 25});
AWS.config = new AWS.Config({region: 'us-west-2', httpOptions: {agent: agent}});


const TYPE = ['NA', 'analyst', 'recipient', 'driver', 'NA', 'dispatch', 'preparer'];

// const event = {
//   token: process.env.TOKEN,
//   UUID:'123'
// };
//
// require(`./computing/tokens/validate`)(event, process.env.SECRET)
//     .then(response => {
//       console.log(response);
//       // callback(response);
//     })
//     .catch(err => {
//       console.log(err);
//       // callback(err);
//     });

// const encrypted_onfleet = process.env.ONFLEET;
const encrypted_secret = process.env.SECRET;
// let decrypted_onfleet;
let decrypted_secret;


function processEvent(event, context, callback) {
    // TODO handle the event here
  // event.type = indicates the clientType to authenticate
  // event.UUID
  // event.email
  // event.password
  // event.phone
  // event.confirmId

  console.log(event, decrypted_secret);

  if (event.type){
    require(`./computing/controllers/${TYPE[event.type]}`)(event, decrypted_secret)
    .then(response => {
      callback(null, response);
    })
    .catch(err => {
      callback(err);
    });
  } else if (event.token) {
    require(`./computing/tokens/validate`)(event, decrypted_secret)
    .then(response => {
      callback(null, response);
    })
    .catch(err => {
      callback(err);
    });
    return;
  }



}

exports.handler = (event, context, callback) => {
    // if (decrypted_onfleet !== undefined && decrypted_secret !== undefined) {
    if (decrypted_secret !== undefined){
    // if (false) {
        processEvent(event, context, callback);
    } else {
        // Decrypt code should run once and variables stored outside of the function
        // handler so that these are decrypted once per container
        // const kms = new AWS.KMS();
        // kms.decrypt({ CiphertextBlob: new Buffer(encrypted_onfleet, 'base64') }, (err, data) => {
        //     if (err) {
        //         console.log('Decrypt error:', err);
        //         return callback(err);
        //     }
        //     decrypted_onfleet = data.Plaintext.toString('ascii');
        //     if (decrypted_secret) {
        //       processEvent(event, context, callback);
        //     } else {
              const kms = new AWS.KMS();
              kms.decrypt({ CiphertextBlob: new Buffer(encrypted_secret, 'base64') }, (err, data) => {
                  if (err) {
                      console.log('Decrypt error:', err);
                      return callback(err);
                  }
                  decrypted_secret = data.Plaintext.toString('ascii');
                  processEvent(event, context, callback);
    //       });
    //     }
        });
    }
};
