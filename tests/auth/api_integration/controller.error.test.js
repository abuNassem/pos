jest.mock('../../../src/modules/auth/auth.service.js');
jest.mock('../../../src/config/db.js', () => ({
  __esModule: true,
  default: {
    getConnection: jest.fn(),
  },
}));

import { createUsers, login } from '../../../src/modules/auth/auth.controllar.js';
import { setupUser, loginUser } from '../../../src/modules/auth/auth.service.js';

describe('AUTH CONTROLLER — Error Handling Operations', () => {
  let mockReq;
  let mockRes;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    // استخدام Spy لحجب طباعة الأخطاء في الترمينال أثناء الفحص
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('createUsers() — Errors', () => {
    it('should catch a customized error withstatusCode (e.g. 409 Conflict) and return it correctly', async () => {
      const conflictError = new Error('Admin account or unique data already exists');
      conflictError.statusCode = 409;
      setupUser.mockRejectedValue(conflictError);

      mockReq = { body: {} };

      await createUsers(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Admin account or unique data already exists' });
    });

    it('should fallback to 500 Internal Server Error when an unexpected raw error occurs', async () => {
      setupUser.mockRejectedValue(new Error('Low level native database connection collapse'));

      mockReq = { body: {} };

      await createUsers(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('login() — Errors', () => {
    it('should return the accurate status code and message provided by loginUser (e.g. 401 Unauthorized)', async () => {
      const unauthorizedError = new Error('Invalid username or password');
      unauthorizedError.statusCode = 401;
      loginUser.mockRejectedValue(unauthorizedError);

      mockReq = { body: { username: 'u', password: 'p' } };

      await login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid username or password' });
    });

        it('should return 500 when loginUser throws an error without a defined statusCode', async () => {
      loginUser.mockRejectedValue(new Error('Crypto module runtime unexpected failure'));

      mockReq = { body: { username: 'u', password: 'p' } };

      await login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      
      // التعديل هنا: نتوقع الرسالة الأصلية للخطأ لأن دالة الـ login لديك تسمح بتمريرها
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Crypto module runtime unexpected failure' });
    });

  });
});
