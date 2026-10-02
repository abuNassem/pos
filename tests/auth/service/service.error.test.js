jest.mock('../../../src/config/db.js', () => ({
  __esModule: true,
  default: {
    getConnection: jest.fn(),
  },
}));
jest.mock('../../../src/modules/auth/auth.repositry.js');
jest.mock('../../../src/modules/auth/auth.utils.js');

import { setupUser, loginUser } from '../../../src/modules/auth/auth.service.js';
import { createUser, check_user } from '../../../src/modules/auth/auth.repositry.js';
import { hashPassword, verifyPassword, isAdmin } from '../../../src/modules/auth/auth.utils.js';
import pool from '../../../src/config/db.js';

describe('AUTH SERVICE — Error Handling & Transactions', () => {
  let mockConnection;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnection = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
    };
    pool.getConnection.mockResolvedValue(mockConnection);
    mockRes = { cookie: jest.fn() };
  });

  describe('setupUser() — Errors', () => {
    it('should trigger rollback and release connection if createUser fails', async () => {
      isAdmin.mockReturnValue(false);
      hashPassword.mockResolvedValue('hash');
      createUser.mockRejectedValue(new Error('Insert Failed'));

      await expect(
        setupUser({ username: 'u', password: 'p', nationalId: 'N', birthDate: 'D', res: mockRes })
      ).rejects.toThrow('Insert Failed');

      expect(mockConnection.rollback).toHaveBeenCalledTimes(1);
      expect(mockConnection.release).toHaveBeenCalledTimes(1);
    });

    it('should catch ER_DUP_ENTRY and convert it to 409 conflict error', async () => {
      isAdmin.mockReturnValue(false);
      const dbError = new Error('Duplicate entry');
      dbError.code = 'ER_DUP_ENTRY';
      createUser.mockRejectedValue(dbError);

      try {
        await setupUser({ username: 'u', password: 'p', nationalId: 'N', birthDate: 'D', res: mockRes });
      } catch (err) {
        expect(err.statusCode).toBe(409);
        expect(err.message).toBe('Admin account or unique data already exists');
      }
    });
  });

  describe('loginUser() — Errors', () => {
    it('should throw 401 error if user does not exist in DB', async () => {
      check_user.mockResolvedValue(null);

      await expect(
        loginUser('unknown', 'pass', mockRes)
      ).rejects.toThrow('Invalid username or password');
      
      expect(mockConnection.release).toHaveBeenCalledTimes(1);
    });

    it('should throw 401 error if password verification fails', async () => {
      check_user.mockResolvedValue({ id: 1, password_hash: 'hash' });
      verifyPassword.mockResolvedValue(false);

      try {
        await loginUser('user', 'wrong_pass', mockRes);
      } catch (err) {
        expect(err.statusCode).toBe(401);
        expect(err.message).toBe('Invalid username or password');
      }
      expect(mockConnection.release).toHaveBeenCalledTimes(1);
    });
  });
});
