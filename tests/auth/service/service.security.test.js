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
import { hashPassword, verifyPassword, isAdmin, createToken } from '../../../src/modules/auth/auth.utils.js';
import pool from '../../../src/config/db.js';

describe('AUTH SERVICE — Security & Vulnerability Tests', () => {
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

  it('SECURITY CHECK: should hash the password BEFORE passing it to createUser repository', async () => {
    isAdmin.mockReturnValue(false);
    hashPassword.mockResolvedValue('SAFE_HASHED_STRING_123');

    await setupUser({
      username: 'attacker',
      password: 'NEVER_STORE_PLAIN_TEXT_PASSWORD',
      nationalId: 'N',
      birthDate: 'D',
      res: mockRes,
    });

    expect(createUser).not.toHaveBeenCalledWith(expect.any(Object), expect.any(String), 'NEVER_STORE_PLAIN_TEXT_PASSWORD', expect.any(String));
    expect(createUser).toHaveBeenCalledWith(expect.any(Object), expect.any(String), 'SAFE_HASHED_STRING_123', expect.any(String));
  });

   it('SECURITY CHECK: should check Cookie security attributes against XSS and Session Hijacking', async () => {
    isAdmin.mockReturnValue(false);
    
    // الحل هنا: إعطاء قيمة نصية وهمية للتوكن المولد ليمر الفحص بنجاح
    createToken.mockResolvedValue('sample_safe_jwt_token_string');

    await setupUser({ 
      username: 'u', 
      password: 'p', 
      nationalId: 'N', 
      birthDate: 'D', 
      res: mockRes 
    });

    // التأكد من أن الكوكيز تم إعداده بخصائص الحماية المطلوبة
    expect(mockRes.cookie).toHaveBeenCalledWith(
      'token',
      'sample_safe_jwt_token_string',
      expect.objectContaining({ sameSite: 'strict' })
    );
  });


  it('SECURITY CHECK: should reject authentication completely if user role is tampered or unknown', async () => {
    const tamperedUser = { id: 9, username: 'hacker', role: 'ROOT_SUPERUSER_EXPLOIT', password_hash: 'hash' };
    check_user.mockResolvedValue(tamperedUser);
    verifyPassword.mockResolvedValue(true);

    await expect(
      loginUser('hacker', 'pass', mockRes)
    ).rejects.toThrow('Invalid username or password');
  });
});
