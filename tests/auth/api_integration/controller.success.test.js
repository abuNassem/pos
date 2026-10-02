// وضع الـ Mocks في البداية لمنع تتبع أي كود خارجي
jest.mock('../../../src/modules/auth/auth.service.js');
jest.mock('../../../src/config/db.js', () => ({
  __esModule: true,
  default: {
    getConnection: jest.fn(),
  },
}));
import { createUsers, login } from '../../../src/modules/auth/auth.controllar.js';
import { setupUser, loginUser } from '../../../src/modules/auth/auth.service.js';

describe('AUTH CONTROLLER — Success Operations', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();

    // إعداد كائن الاستجابة الوهمي لـ Express لدعم التمرير المتسلسل (Method Chaining)
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('createUsers()', () => {
    it('should return 201 and user data upon successful registration', async () => {
      const mockResultUser = { id: 1, username: 'subhi', role: 'admin' };
      setupUser.mockResolvedValue(mockResultUser);

      mockReq = {
        body: { username: 'subhi', password: 'password123', nationalId: 'NAT123', birthDate: '1990-01-01' }
      };

      await createUsers(mockReq, mockRes);

      expect(setupUser).toHaveBeenCalledWith(expect.objectContaining({
        username: 'subhi',
        password: 'password123'
      }));
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "User created successfully",
        user: mockResultUser,
      });
    });
  });

  describe('login()', () => {
    it('should return 200 and login result details upon successful authentication', async () => {
      const mockLoginResponse = { token: 'mock_jwt_token', message: 'to next step' };
      loginUser.mockResolvedValue(mockLoginResponse);

      mockReq = {
        body: { username: 'subhi', password: 'password123' }
      };

      await login(mockReq, mockRes);

      expect(loginUser).toHaveBeenCalledWith('subhi', 'password123', mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockLoginResponse);
    });
  });
});
