import msql from 'mysql2/promise';

import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: "127.0.0.1",
    port: 3306,
    user: "pos_user",
    password: "pass-sql",
    database: "POSSystem"
});




try {
    const connection = await pool.getConnection();

    console.log("✅ MySQL connection successful");

    connection.release();
} catch (error) {
    console.error("❌ MySQL connection failed");
    console.error("Reason:", error.message);
}

export default pool;