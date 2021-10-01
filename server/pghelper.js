const Q = require("q");
const { Client } = require("pg");
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

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

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
