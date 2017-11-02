"use strict";

const Promise = require('bluebird');
const base64Url = require('base64-url');
const path = require('path');
const crypto = Promise.promisifyAll(require('crypto'));
const fs = Promise.promisifyAll(require('fs'));
const jwt = Promise.promisifyAll(require('jsonwebtoken'));
const request = require('request-promise');

module.exports = (record, uuId, secret) => {

  return new Promise((resolve, reject) => {
    // ACCEPTS A RECORD TO SEND TO THE SESSION TABLE
    // const base64UUID = base64Url.encode(uuId);
    const base64UUID = new Buffer(uuId).toString("base64");
    const getSecret = secret;
    const getRandBytes = crypto.randomBytesAsync(20);
    const storage = {};

    return getRandBytes
    .then(buff => {
      const keyLock = `${secret}.${base64UUID}`;
      return jwt.sign({ ts: Date.now(), USID: buff.toString("hex") }, keyLock, { header : {alg : "HS256", typ: "JWT"}});
    })
    .then(token => {
      record.token = token;

      // ============== TODO =================
      // SUPPLY SESSION RECORD TO SESSION TABLE THROUGH DATACORE
      // const params = {
      //   TableName: "Session", Item: record
      // };
      storage.token = token;

      const postToSessionTable = {
        method: 'POST',
        uri: 'http://180.0.195.100/Session',
        body: record,
        headers: {
          'User-Agent': 'Request-Promise'
        },
        json: true
      };

      return request(postToSessionTable);
    })
    .then(data => {
      const token = storage.token;
      resolve(token);
    })
    .catch(err => {
      reject(err);
    });
  });

};
