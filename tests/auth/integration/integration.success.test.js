// 1. عزل قاعدة البيانات أولاً لمنع مشكلة الـ Top-Level Await في الملف الحقيقي
jest.mock('../../../src/config/db.js', () => ({
  __esModule: true,
  default: {
    getConnection: jest.fn(),
  },
}));

import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from '../../../src/modules/auth/auth.router.js';
import pool from '../../../src/config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// بناء تطبيق Express وهمي يحاكي الإعدادات الحقيقية في app.js تماماً
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRouter);

describe('AUTH API INTEGRATION — Success Paths', () => {
  let mockConnection;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnection = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
      execute: jest.fn(), // الـ Service يستدعي الـ Repository الذي ينفذ الاستعلامات هنا
    };
    pool.getConnection.mockResolvedValue(mockConnection);
  });

  describe('POST /api/auth/setup-user', () => {
    it('should pass validation, run service, and return 201 with cookie header', async () => {
      // محاكاة استعلامات قاعدة البيانات للـ Repository الداخلي
      mockConnection.execute
        .mockResolvedValueOnce([[]]) // 1. findAdmin (لم يتم العثور على آدمن سابق)
        .mockResolvedValueOnce([{ insertId: 50 }]); // 2. createUser (إدخال ناجح)

      const response = await request(app)
        .post('/api/auth/setup-user')
        .send({
          username: 'subhi_admin',
          password: 'Password123!', // يجب أن تطابق شروط الـ Validation لديك
          nationalId: 'NAT12345',
          birthDate: '1990-01-01',
        });

      // التحقق من التكامل الشامل للطبقات
      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User created successfully');
      expect(response.body.user.id).toBe(50);
      
      // التأكد من أن السيرفر قام بإصدار الـ HTTP Set-CookieHeader حقيقة للعميل
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('token=');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should successfully authenticate user and return 200 with cookies', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 12);
      const mockUser = { id: 10, username: 'subhi', role: 'cashier', password_hash: hashedPassword };
      
      mockConnection.execute.mockResolvedValueOnce([[mockUser]]); // check_user

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'subhi',
          password: 'Password123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('login successfully');
      expect(response.body.token2).toBeDefined();
      expect(response.headers['set-cookie']).toBeDefined();
    });
  });
});
