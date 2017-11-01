"use strict";

module.exports = {

  addTimestampAtLogin: (userId) => {
    return new Promise ((resolve, reject) => {

                  // TODO:
      // UPDATE CALL TO DATACORE
      
      // const addTimestamp = {
      //   TableName: 'Analyst',
      //   Key: { AnalystId : userId },
      //   UpdateExpression: 'set #t = :x',
      //   ExpressionAttributeNames: {'#t' : 'Timestamp'},
      //   ExpressionAttributeValues: {
      //     ':x' : Math.floor(Date.now()/1000),
      //   }
      // };
      // dynamo.update(addTimestamp).promise()
      .then(data => {
        resolve(data);
      })
      .catch(err => {
        reject(err);
      });
    });
  },

};
