jest.mock('../../../src/modules/auth/auth.service.js');
jest.mock('../../../src/config/db.js', () => ({
  __esModule: true,
  default: {
    getConnection: jest.fn(),
  },
}));
import { createUsers } from '../../../src/modules/auth/auth.controllar.js';
import { setupUser } from '../../../src/modules/auth/auth.service.js';

describe('AUTH CONTROLLER — Security Checks', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  it('SECURITY CHECK: should pass the raw res object into setupUser to securely attach HttpOnly cookies from within the service layer', async () => {
    mockReq = { body: { username: 'secure_user', password: 'secure_password' } };
    setupUser.mockResolvedValue({ id: 1 });

    await createUsers(mockReq, mockRes);

    // تأكيد أمني: التحقق من تمرير كائن الاستجابة res بالكامل لطبقة الخدمات لحقن التوكن الآمن في الكوكيز
    expect(setupUser).toHaveBeenCalledWith(expect.objectContaining({
      res: mockRes
    }));
  });
});
