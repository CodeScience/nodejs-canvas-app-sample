var //pg = require("pg"),
  config = require("./config"),
  Q = require("q");
  //databaseURL = config.databaseURL;
  const {  Client } = require('pg');
  const databaseURL = process.env.DATABASE_URL;
/**
 * Utility function to execute a SQL query against a Postgres database
 * @param sql
 * @param values
 * @param singleItem
 * @returns {promise|*|Q.promise}
 */
exports.query = function (sql, values, singleItem, dontLog) {
  if (!dontLog) {
    console.log(sql, values);
  }

  var deferred = Q.defer();

  const client = new Client();

  client.connect({databaseURL});

  try {
    client.query(sql, values, (err, res) => {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(singleItem ? res.rows[0] : res.rows);
      }
      client.end();
    });
  } catch (e) {
    deferred.reject(e);
  }

  return deferred.promise;
};
