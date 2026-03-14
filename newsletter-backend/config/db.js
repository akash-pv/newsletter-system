//config/db.js

const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    multipleStatements: true, // Optional: Enable if you plan to execute multiple SQL queries at once
});

db.connect((err) => {
    if (err) {
        console.error("❌ Database connection failed:", err.message);
        process.exit(1); // Exit the application if DB connection fails
    } else {
        console.log("✅ Connected to MySQL database.");
    }
});

module.exports = db;
