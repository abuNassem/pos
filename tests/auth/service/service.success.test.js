// 1. Mock external DB connections first to isolate top-level await syntax errors
jest.mock('../../../src/config/db.js', () => ({
  __esModule: true,
  default: {
    getConnection: jest.fn(),
  },
}));
jest.mock('../../../src/modules/auth/auth.repositry.js');
jest.mock('../../../src/modules/auth/auth.utils.js');

// 2. Safely import modules with relative paths adjusted
import { setupUser, loginUser } from '../../../src/modules/auth/auth.service.js';
import { createUser, createAdminProfile, check_user } from '../../../src/modules/auth/auth.repositry.js';
import { hashPassword, createToken, verifyPassword, isAdmin } from '../../../src/modules/auth/auth.utils.js';
import pool from '../../../src/config/db.js';

describe('AUTH SERVICE — Success Operations', () => {
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

  describe('setupUser()', () => {
    it('should successfully register a cashier when isAdmin returns false', async () => {
      isAdmin.mockReturnValue(false);
      hashPassword.mockResolvedValue('hashed_123');
      createUser.mockResolvedValue(101); 
      createToken.mockResolvedValue('mock_cashier_token');

      const result = await setupUser({
        username: 'subhi_cashier',
        password: 'password123',
        nationalId: 'NAT789',
        birthDate: '1995-05-05',
        res: mockRes,
      });

      expect(mockConnection.beginTransaction).toHaveBeenCalledTimes(1);
      expect(createUser).toHaveBeenCalledWith(mockConnection, 'subhi_cashier', 'hashed_123', 'cashier');
      expect(mockConnection.commit).toHaveBeenCalledTimes(1);
      expect(mockRes.cookie).toHaveBeenCalledWith('token', 'mock_cashier_token', expect.any(Object));
      expect(mockConnection.release).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        id: 101,
        username: 'subhi_cashier',
        role: 'cashier',
        token: 'mock_cashier_token'
      });
    });

    it('should successfully register an admin and create profile when isAdmin returns true', async () => {
      isAdmin.mockReturnValue(true);
      hashPassword.mockResolvedValue('hashed_admin');
      createUser.mockResolvedValue(1); 
      createAdminProfile.mockResolvedValue();
      createToken.mockResolvedValue('mock_admin_token');

      const result = await setupUser({
        username: 'subhi_admin',
        password: 'password123',
        nationalId: 'NAT123',
        birthDate: '1990-01-01',
        res: mockRes,
      });

      expect(createUser).toHaveBeenCalledWith(mockConnection, 'subhi_admin', 'hashed_admin', 'admin');
      expect(createAdminProfile).toHaveBeenCalledWith(mockConnection, 1, 'NAT123', '1990-01-01');
      expect(mockConnection.commit).toHaveBeenCalledTimes(1);
      expect(result.role).toBe('admin');
    });
  });

  describe('loginUser()', () => {
    it('should login successfully as a cashier', async () => {
      const mockUser = { id: 5, username: 'cashier1', role: 'cashier', password_hash: 'hash' };
      check_user.mockResolvedValue(mockUser);
      verifyPassword.mockResolvedValue(true);
      createToken.mockResolvedValue('cashier_jwt');

      const result = await loginUser('cashier1', 'pass123', mockRes);

      expect(mockRes.cookie).toHaveBeenCalledWith('token', 'cashier_jwt', expect.any(Object));
      expect(mockConnection.release).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ token2: 'cashier_jwt', message: 'login successfully' });
    });

    it('should login successfully as an admin with 5min token expiration', async () => {
      const mockUser = { id: 2, username: 'admin1', role: 'admin', password_hash: 'hash' };
      check_user.mockResolvedValue(mockUser);
      verifyPassword.mockResolvedValue(true);
      createToken.mockResolvedValue('admin_jwt');

      const result = await loginUser('admin1', 'pass123', mockRes);

      expect(createToken).toHaveBeenCalledWith(expect.any(Object), '5min');
      expect(result).toEqual({ token: 'admin_jwt', message: 'to next step' });
    });
  });
});
