'use strict';

const randomToken = require('rand-token');
const config = require(`../../config/${process.env.NODE_ENV}`);
const Promise = require('bluebird');
const bcrypt = require('bcrypt');
const sessionHelper = require('../helpers/session-helpers');
const analystHelper = require('../helpers/analyst');

module.exports = (event, res) => {

    // PREPARER AUTHENTICATION SEEMS VERY SIMPLE
    // THE PREPARER SENDS REQUIRED INFO (ask Kevin if we want to deep validate the metadata hash from client?)
      // WE VALIDATE THE 'accessCode' VS 'PreparerAccessId' IN THE 'PreparerAccess' TABLE
        // IF THERE IS A MATCH THEN THE PREPARER IS VALID AND WE CREATE A TOKEN THAT WE STORE IN THE SESSION TABLE, AND SEND TO THE CLIENT
    if (event.UUID && event.metadata && event.accessCode) {
      const checkPreparerAccessCode = {
  				TableName: 'PreparerAccess',
  				KeyConditionExpression: 'PreparerAccessId = :ac',
  				ExpressionAttributeValues: { ':ac': event.accessCode },
  				ProjectionExpression: 'PreparerAccessId'
  		};

      const getPreparerAccessCode = {
        // uri: `http://180.0.195.100/PreparerAccess/${event.accessCode}`,
        uri: `http://datacore.copia.vpc/PreparerAccess/${event.accessCode}`,
        headers: {
          'User-Agent': 'Request-Promise'
        },
        json: true
      }

            // TODO:

      // dynamo.query(checkPreparerAccessCode).promise()
      .then(data => {
        if (data.preparerAccessId) {
          event.preparerAccessId = data.preparerAccessId;
          return sessionHelper.getToken({ Metadata: event.metadata, UUID: event.UUID, PreparerAccessId: event.accessCode, Sandbox: process.env.NODE_ENV === 'dev' ? true : false }, event.UUID);
        } else {
          throw { code: 404 };
        }
      })
      .then(token => {
        res.status(200).send({token: token, id: event.preparerAccessId, type: 6});
      })
      .catch(err => {
        console.log(err);
        res.status(err.code || 404).send();
      });
    } else {
      res.status(400).json({ reason: 'Request missing required values' });
    }
  };
