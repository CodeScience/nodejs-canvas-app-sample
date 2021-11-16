const Q = require("q");
const { Pool } = require("pg");
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

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    pool.connect();
    pool.query(sql, values, (err, res) => {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(singleItem ? res.rows[0] : res.rows);
      }
      pool.end();
    });
  } catch (e) {
    console.error(e);
    deferred.reject(e);
  }

  return deferred.promise;
};
