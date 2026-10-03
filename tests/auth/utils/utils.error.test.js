import { hashPassword, verifyToken, verifyPassword } from '../../../src/modules/auth/auth.utils.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('AUTH UTILS — Error Handling Tests', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    // عمل Spy للـ console.error لمنع تلويث مخرجات الـ Terminal أثناء فحص الأخطاء المتوقعة
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should catch bcrypt errors in hashPassword() and throw "Failed to hash password"', async () => {
    bcrypt.hash.mockRejectedValue(new Error('Internal OS Crypto Error'));

    await expect(hashPassword('password'))
      .rejects.toThrow('Failed to hash password');
    
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should catch jwt verification errors and throw unified "Invalid token" exception', () => {
    jwt.verify.mockImplementation(() => {
      throw new Error('jwt expired or signature mismatch');
    });

    expect(() => verifyToken('expired_or_forged_token'))
      .toThrow('Invalid token');
    
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should catch bcrypt comparison errors in verifyPassword() and throw "Failed to verify password"', async () => {
    bcrypt.compare.mockRejectedValue(new Error('Bcrypt hardware fault'));

    await expect(verifyPassword('pass', 'hash'))
      .rejects.toThrow('Failed to verify password');
    
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
