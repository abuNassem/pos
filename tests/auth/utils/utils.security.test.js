import { hashPassword, createToken } from '../../../src/modules/auth/auth.utils.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('AUTH UTILS — Security & Encryption Strength Checks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('SECURITY CHECK: should enforce at least 12 salt rounds for strong encryption strength', async () => {
    await hashPassword('unsafe_plain_text');

    // تأكيد أمني: التحقق من أن عدد دورات تشفير الـ Salt لا تقل عن 12 لحماية كلمات المرور ضد الـ Rainbow Tables
    const roundsUsed = bcrypt.hash.mock.calls[0][1];
    expect(roundsUsed).toBeGreaterThanOrEqual(12);
  });

  it('SECURITY CHECK: should isolate payload parameters strictly and discard extra user object properties', () => {
    // محاكاة كائن مستخدم يحتوي على خواص خبيثة لحقنها داخل الـ Token Payload مثل صلاحيات أعلى
    const unsafeUserObject = {
      id: 5,
      username: 'attacker',
      role: 'cashier',
      maliciousExtraPrivilege: 'SUPER_ADMIN_ACCESS_EXPLOIT'
    };

    createToken(unsafeUserObject);

    // تأكيد أمني: التحقق من أن الـ Payload يحتوي فقط على الخصائص المحددة برمجياً (id, username, role) لمنع هجمات Privilege Escalation حركياً
    const signedPayload = jwt.sign.mock.calls[0][0];
    expect(signedPayload).not.toHaveProperty('maliciousExtraPrivilege');
    expect(signedPayload).toEqual({
      id: 5,
      username: 'attacker',
      role: 'cashier'
    });
  });
});
