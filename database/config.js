const mysql = require("mysql2/promise");

try {
  const dbConnection = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  // Interceptar el método query para logging
  const originalQuery = dbConnection.query.bind(dbConnection);
  dbConnection.query = function (...args) {
    return originalQuery(...args);
  };

  module.exports = dbConnection;
} catch (error) {
  console.log(error);
  throw new Error("Error a la hora de iniciar la BD ver logs");
}
