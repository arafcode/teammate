const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'teammate_user',
    password: process.env.DB_PASSWORD || 'teammate_password',
    database: process.env.DB_NAME || 'teammate_db',
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

// Bağlantıyı test et
pool.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Veritabanı bağlantısı koptu.');
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Veritabanı çok fazla bağlantıya sahip.');
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('Veritabanı bağlantısı reddedildi.');
        }
    }
    if (connection) connection.release();
    return;
});

module.exports = promisePool;
