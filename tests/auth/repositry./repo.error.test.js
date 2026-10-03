import {
  findAdmin,
  check_user,
  check_user_by_id,
  findUserByUsername,
  createUser,
  createAdminProfile,
  deleteUserById,
  getUsers,
} from '../../../src/modules/auth/auth.repositry.js';
const mockConnection = {
  execute: jest.fn(),
};

describe('AUTH REPOSITORY — Error Handling Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should propagate database errors from findAdmin()', async () => {
    mockConnection.execute.mockRejectedValueOnce(new Error('DB error'));
    await expect(findAdmin(mockConnection, 'NAT123', '1990-01-01')).rejects.toThrow('DB error');
  });

  it('should propagate database errors from check_user()', async () => {
    mockConnection.execute.mockRejectedValueOnce(new Error('DB error'));
    await expect(check_user(mockConnection, 'subhi')).rejects.toThrow('DB error');
  });

  it('should propagate database errors from check_user_by_id()', async () => {
    mockConnection.execute.mockRejectedValueOnce(new Error('DB error'));
    await expect(check_user_by_id(mockConnection, 10)).rejects.toThrow('DB error');
  });

  it('should propagate database errors from findUserByUsername()', async () => {
    mockConnection.execute.mockRejectedValueOnce(new Error('DB error'));
    await expect(findUserByUsername(mockConnection, 'subhi')).rejects.toThrow('DB error');
  });

  it('should propagate database errors from createUser()', async () => {
    mockConnection.execute.mockRejectedValueOnce(new Error('DB error'));
    await expect(createUser(mockConnection, 'u', 'p', 'r')).rejects.toThrow('DB error');
  });

  it('should propagate database errors from createAdminProfile()', async () => {
    mockConnection.execute.mockRejectedValueOnce(new Error('DB error'));
    await expect(createAdminProfile(mockConnection, 1, 'N', 'D')).rejects.toThrow('DB error');
  });

  it('should propagate database errors from deleteUserById()', async () => {
    mockConnection.execute.mockRejectedValueOnce(new Error('DB error'));
    await expect(deleteUserById(mockConnection, 1)).rejects.toThrow('DB error');
  });

  it('should propagate database errors from getUsers()', async () => {
    mockConnection.execute.mockRejectedValueOnce(new Error('DB error'));
    await expect(getUsers(mockConnection)).rejects.toThrow('DB error');
  });

});
