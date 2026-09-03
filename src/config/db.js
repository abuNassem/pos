import msql from 'mysql2/promise';

const pool = msql.createPool({
    host:"localhost",
    user:"root",
    password:"pass-sql",
    database:'POSSystem'
})

export default pool;