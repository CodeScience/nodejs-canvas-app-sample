var parse = require("pg-connection-string").parse,
  Q = require("q");
const { Client } = require("pg");
require("dotenv").config();
const databaseURL = process.env.DATABASE_URL;
const conf = parse(databaseURL);
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

  console.log('database config', databaseURL, conf);

  const client = new Client(conf);

  try {
    client.connect();
    client.query(sql, values, (err, res) => {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(singleItem ? res.rows[0] : res.rows);
      }
      client.end();
    });
  } catch (e) {
    console.error(e);
    deferred.reject(e);
  }

  return deferred.promise;
};
