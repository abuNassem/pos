jest.mock('bcrypt');
jest.mock('jsonwebtoken');
import { hashPassword, createToken, verifyToken, verifyPassword, isAdmin } from '../../../src/modules/auth/auth.utils.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';



describe('AUTH UTILS — Success Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // hashPassword
  // =========================================================================
  describe('hashPassword()', () => {
    it('should successfully hash a password with 12 salt rounds', async () => {
      bcrypt.hash.mockResolvedValue('mocked_secure_hash_123');

      const result = await hashPassword('my_password');

      expect(bcrypt.hash).toHaveBeenCalledWith('my_password', 12);
      expect(result).toBe('mocked_secure_hash_123');
    });
  });

  // =========================================================================
  // createToken & verifyToken
  // =========================================================================
  describe('Token Operations', () => {
    const mockUser = { id: 1, username: 'subhi', role: 'admin' };

    it('should create a valid JWT token without explicit duration', () => {
      jwt.sign.mockReturnValue('mocked_jwt_string');

      const token = createToken(mockUser);

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 1, username: 'subhi', role: 'admin' },
        'your_jwt_secret_key',
        undefined
      );
      expect(token).toBe('mocked_jwt_string');
    });

    it('should create a JWT token with custom expiration duration', () => {
      jwt.sign.mockReturnValue('mocked_jwt_5min');

      const token = createToken(mockUser, '5min');

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        'your_jwt_secret_key',
        { expiresIn: '5min' }
      );
      expect(token).toBe('mocked_jwt_5min');
    });

    it('should successfully decode and verify a valid token', () => {
      const payload = { id: 1, username: 'subhi', role: 'admin' };
      jwt.verify.mockReturnValue(payload);

      const decoded = verifyToken('valid_token_string');

      expect(jwt.verify).toHaveBeenCalledWith('valid_token_string', 'your_jwt_secret_key');
      expect(decoded).toEqual(payload);
    });
  });

  // =========================================================================
  // verifyPassword
  // =========================================================================
  describe('verifyPassword()', () => {
    it('should return true when passwords match', async () => {
      bcrypt.compare.mockResolvedValue(true);

      const result = await verifyPassword('plain_pass', 'hashed_pass');

      expect(bcrypt.compare).toHaveBeenCalledWith('plain_pass', 'hashed_pass');
      expect(result).toBe(true);
    });

    it('should return false when passwords do not match', async () => {
      bcrypt.compare.mockResolvedValue(false);

      const result = await verifyPassword('wrong_pass', 'hashed_pass');
      expect(result).toBe(false);
    });
  });

  // =========================================================================
  // isAdmin
  // =========================================================================
  describe('isAdmin()', () => {
    it('should return true when both nationalId and birthDate are provided', () => {
      expect(isAdmin('NAT123', '1990-01-01')).toBe(true);
    });

    it('should return false when either nationalId or birthDate is missing', () => {
      expect(isAdmin(null, '1990-01-01')).toBe(false);
      expect(isAdmin('NAT123', undefined)).toBe(false);
    });
  });
});
