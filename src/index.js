import express from 'express';
import authRouter from './modules/auth/auth.router.js';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import pool from './config/db.js';
async function testDatabase() {
    try {
        const connection = await pool.getConnection();

        console.log('✅ MySQL connected successfully');

        connection.release();
    } catch (error) {
        console.error('❌ MySQL connection failed');
        console.error(error);
    }
}

testDatabase();
const app = express();
app.use(cors());

app.use(express.json());
app.use('/api/auth', authRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
