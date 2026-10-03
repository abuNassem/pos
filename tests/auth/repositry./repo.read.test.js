import {
  findAdmin,
  check_user,
  check_user_by_id,
  findUserByUsername,
  getUsers,
} from '../../../src/modules/auth/auth.repositry.js';

const mockConnection = {
  execute: jest.fn(),
};

describe('AUTH REPOSITORY — Read Operations', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // findAdmin
  // =========================================================================
  describe('findAdmin()', () => {
    it('should return the existing admin when an admin exists', async () => {
      mockConnection.execute.mockResolvedValueOnce([
        [{ id: 1 }]
      ]);

      const result = await findAdmin(mockConnection, 'NAT123', '1990-01-01');

      expect(mockConnection.execute).toHaveBeenCalledTimes(1);
      expect(mockConnection.execute).toHaveBeenCalledWith(expect.stringContaining('SELECT id'));
      expect(mockConnection.execute).toHaveBeenCalledWith(expect.stringContaining("WHERE role = 'admin'"));
      expect(mockConnection.execute).toHaveBeenCalledWith(expect.stringContaining('LIMIT 1'));
      expect(result).toEqual({ id: 1 });
    });

    it('should return null when no admin exists', async () => {
      mockConnection.execute.mockResolvedValueOnce([[]]);
      const result = await findAdmin(mockConnection, 'NAT123', '1990-01-01');
      expect(result).toBeNull();
    });

    it('should return null when nationalId is missing WITHOUT querying the database', async () => {
      const result = await findAdmin(mockConnection, null, '1990-01-01');
      expect(result).toBeNull();
      expect(mockConnection.execute).not.toHaveBeenCalled();
    });

    it('should return null when birthDate is missing WITHOUT querying the database', async () => {
      const result = await findAdmin(mockConnection, 'NAT123', null);
      expect(result).toBeNull();
      expect(mockConnection.execute).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // check_user
  // =========================================================================
  describe('check_user()', () => {
    it('should return the user when username exists', async () => {
      const user = { id: 1, username: 'subhi', role: 'cashier', password_hash: 'hashed_password' };
      mockConnection.execute.mockResolvedValueOnce([[user]]);

      const result = await check_user(mockConnection, 'subhi');

      expect(mockConnection.execute).toHaveBeenCalledTimes(1);
       expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, username, role, password_hash'),
        ['subhi']
      );
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('FROM users'),
        ['subhi']
      );
      expect(result).toEqual(user);
    });

    it('should return null when username does not exist', async () => {
      mockConnection.execute.mockResolvedValueOnce([[]]);
      const result = await check_user(mockConnection, 'unknown_user');
      expect(result).toBeNull();
    });
  });

  // =========================================================================
  // check_user_by_id
  // =========================================================================
  describe('check_user_by_id()', () => {
    it('should return the user when ID exists', async () => {
      const user = { id: 10, username: 'cashier1', role: 'cashier', password_hash: 'hashed_password' };
      mockConnection.execute.mockResolvedValueOnce([[user]]);

      const result = await check_user_by_id(mockConnection, 10);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = ?'),
        [10]
      );
      expect(result).toEqual(user);
    });

    it('should return null when user ID does not exist', async () => {
      mockConnection.execute.mockResolvedValueOnce([[]]);
      const result = await check_user_by_id(mockConnection, 999999);
      expect(result).toBeNull();
    });
  });

  // =========================================================================
  // findUserByUsername
  // =========================================================================
  describe('findUserByUsername()', () => {
    it('should return the user ID when username exists', async () => {
      mockConnection.execute.mockResolvedValueOnce([[{ id: 25 }]]);

      const result = await findUserByUsername(mockConnection, 'cashier1');

      expect(mockConnection.execute).toHaveBeenCalledWith(expect.stringContaining('SELECT id'), ['cashier1']);
      expect(mockConnection.execute).toHaveBeenCalledWith(expect.stringContaining('WHERE username = ?'), ['cashier1']);
      expect(result).toEqual({ id: 25 });
    });

    it('should return null when username does not exist', async () => {
      mockConnection.execute.mockResolvedValueOnce([[]]);
      const result = await findUserByUsername(mockConnection, 'not_found');
      expect(result).toBeNull();
    });

    it('should use LIMIT 1', async () => {
      mockConnection.execute.mockResolvedValueOnce([[{ id: 1 }]]);
      await findUserByUsername(mockConnection, 'cashier1');
      expect(mockConnection.execute).toHaveBeenCalledWith(expect.stringContaining('LIMIT 1'), ['cashier1']);
    });
  });

  // =========================================================================
  // getUsers
  // =========================================================================
  describe('getUsers()', () => {
    it('should return an array of users', async () => {
      const mockUsers = [
        { id: 1, username: 'user1' },
        { id: 2, username: 'user2' }
      ];
      mockConnection.execute.mockResolvedValueOnce([mockUsers]);

      const result = await getUsers(mockConnection);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT')
      );
      expect(result).toEqual(mockUsers);
    });
  });

});
