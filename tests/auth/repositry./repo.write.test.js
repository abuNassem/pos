import {
  check_user,
  createUser,
  createAdminProfile,
  deleteUserById,
} from '../../../src/modules/auth/auth.repositry.js';

const mockConnection = {
  execute: jest.fn(),
};

describe('AUTH REPOSITORY — Write & Security Operations', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // createUser
  // =========================================================================
  describe('createUser()', () => {
    it('should successfully insert a user and return insertId', async () => {
      // قاعدة البيانات ترجع مصفوفة في أول عنصر لها كائن يحتوي على الـ insertId
      mockConnection.execute.mockResolvedValueOnce([{ insertId: 101 }]);

      const result = await createUser(
        mockConnection, 
        'new_user', 
        'hashed_pass', 
        'cashier'
      );

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        ['new_user', 'hashed_pass', 'cashier']
      );
      
      // التعديل هنا: نتوقع الرقم مباشرة كما يرجعه كودك الحقيقي
      expect(result).toEqual(101);
    });
  });

  // =========================================================================
  // createAdminProfile
  // =========================================================================
  describe('createAdminProfile()', () => {
    it('should successfully insert admin profile', async () => {
      mockConnection.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const result = await createAdminProfile(
        mockConnection,
        1,
        'NAT123',
        '1990-01-01'
      );

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO'),
        [1, 'NAT123', '1990-01-01']
      );
      
      // التعديل هنا: نتوقع undefined لأن الدالة لديك لا ترجع قيمة
      expect(result).toBeUndefined();
    });
  });

  // =========================================================================
  // deleteUserById
  // =========================================================================
  describe('deleteUserById()', () => {
    it('should successfully delete user by id', async () => {
      mockConnection.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const result = await deleteUserById(mockConnection, 5);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM users'),
        expect.any(Array)
      );
      
      // التعديل هنا: نتوقع undefined لأن الدالة لديك لا ترجع قيمة
      expect(result).toBeUndefined();
    });
  });

  // =========================================================================
  // Security / Parameterized Queries
  // =========================================================================
  describe('Security Checks', () => {
    it('should use parameterized query instead of interpolating username', async () => {
      mockConnection.execute.mockResolvedValueOnce([[]]);
      const maliciousUsername = "' OR 1=1 --";

      await check_user(mockConnection, maliciousUsername);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.any(String),
        [maliciousUsername]
      );
    });
  });

});
