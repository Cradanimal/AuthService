"use strict";

const request = require('request-promise');
const randomToken = require('rand-token');
const config = require(`../../config/${process.env.NODE_ENV}`);
const Promise = require('bluebird');
const bcrypt = require('bcrypt');
const token = require('../tokens/initialize');
const analystHelper = require('../helpers/analyst');

module.exports = (event, secret) => {

  return new Promise((resolve, reject) => {

    if (event.email && event.password && event.UUID) {
      event.email = event.email.toLowerCase();

      //            TODO
      // ANALYST CALL TO DATACORE

      const queryAnalystDataCore = {
          TableName: 'Analyst',
          FilterExpression: 'Email = :email',
          ExpressionAttributeValues: { ':email': event.email },
          ProjectionExpression: 'Password, AnalystId'
      };

      

      .then(data => {
        if (data.Count > 0) {
          event.analystId = data.Items[0].AnalystId;
          return bcrypt.compare(event.password, data.Items[0].Password);
        } else {
          reject({errorCode: 404, reason: 'value does not match any record in Analyst Table'});
          // res.status(404).json({reason: 'value does not match any record in Analyst Table'});
        }

      })
      .then(match => {
        if (match) {
          return analystHelper.addTimestampAtLogin(event.analystId);
        } else {
          reject({errorCode: 404,  reason: 'Invalid Password' });
        }
      })
      .then(data => {
        console.log(data);
        return token({AnalystId : event.analystId, Sandbox: false }, event.UUID, secret);
      })
      .then(token => {
        // res.status(200).json({token: token, id: event.analystId, type: 1});


        resolve({token: token, id: event.analystId, type: 1});
      })
      .catch(err => {

          console.log('DB QUERY ERROR', err);
          // res.status(500).json(err);
          reject(err);
      });
    } else {
      reject({errorCode: 404, reason: 'request is missing a nessary value to login; email, password, or UUID'});

    }

  });
};
