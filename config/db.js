const mysql = require('mysql2/promise'); // Use the promise-based version

const db = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'financial_chatbot',
    waitForConnections: true,
    queueLimit: 0
});

// Check if the database is connected
async function checkDBConnection() {
    try {
        const connection = await db.getConnection();
        console.log('Successfully connected to MySQL database.');
        connection.release(); // Release connection back to the pool
    } catch (error) {
        console.error('Database connection failed:', error.message);
    }
}

checkDBConnection(); // Call the function to check DB connection

module.exports = db;