import express from 'express';
import registerUser from './auth.controllar.js';

const router = express.Router();

router.post('/register', registerUser);
// router.post('/login', loginUser);

export default router;