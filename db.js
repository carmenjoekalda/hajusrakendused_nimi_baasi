const mysql = require('mysql2/promise');

// Setup database connection
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'margusDB',
    password: 'qwerty',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;