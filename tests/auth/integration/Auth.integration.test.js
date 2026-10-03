import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import app from '../../../src/app.js';
import {
  resetDatabase,
  closeDatabase,
  findUserRow,
  findAdminProfileRow,
  countUsers,
} from './dbHelper.js';

const PASSWORD = 'Password123!';

const cashierBody = (username = 'cashier_one') => ({ username, password: PASSWORD });
const adminBody = (username = 'admin_one', nationalId = 'NAT12345') => ({
  username,
  password: PASSWORD,
  nationalId,
  birthDate: '1990-01-01',
});

const tokenCookie = (token) => ['Cookie', `token=${token}`];

// ينشئ مستخدمًا عبر الـ API الحقيقي ويرجع الـ id والتوكن
const registerViaApi = async (body) => {
  const res = await request(app).post('/api/auth/setup-user').send(body);
  expect(res.status).toBe(201);
  return res.body.user;
};

beforeAll(() => {
  // الكود الحالي يطبع logs كثيرة (منها بيانات المستخدم)، نخفيها لتبقى النتائج مقروءة
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  jest.restoreAllMocks();
  await closeDatabase();
});

describe('POST /api/auth/setup-user', () => {
  it('creates a cashier: 201, token cookie, hashed password, no admin profile', async () => {
    const res = await request(app).post('/api/auth/setup-user').send(cashierBody());

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('User created successfully');
    expect(res.body.user).toMatchObject({ username: 'cashier_one', role: 'cashier' });
    expect(res.headers['set-cookie'][0]).toContain('token=');

    const row = await findUserRow('cashier_one');
    expect(row).not.toBeNull();
    expect(row.role).toBe('cashier');
    expect(row.password_hash).not.toBe(PASSWORD);
    expect(await bcrypt.compare(PASSWORD, row.password_hash)).toBe(true);
    expect(await findAdminProfileRow(row.id)).toBeNull();
  });

  it('creates an admin with a profile row when nationalId and birthDate are sent', async () => {
    const res = await request(app).post('/api/auth/setup-user').send(adminBody());

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('admin');

    const row = await findUserRow('admin_one');
    expect(row.role).toBe('admin');
    const profile = await findAdminProfileRow(row.id);
    expect(profile.national_id).toBe('NAT12345');
  });

  it('returns a JWT whose payload matches the created user', async () => {
    const user = await registerViaApi(cashierBody());
    const decoded = jwt.decode(user.token);

    expect(decoded).toMatchObject({ id: user.id, username: 'cashier_one', role: 'cashier' });
  });

  it('returns 409 for a duplicate username and keeps a single row', async () => {
    await registerViaApi(cashierBody());
    const res = await request(app).post('/api/auth/setup-user').send(cashierBody());

    expect(res.status).toBe(409);
    expect(await countUsers()).toBe(1);
  });

  it('rolls back the user insert when the admin profile violates a unique key', async () => {
    await registerViaApi(adminBody('admin_one', 'NAT12345'));
    // اسم مستخدم جديد لكن نفس الرقم الوطني => يفشل إدخال admin_profiles بعد إدخال users
    const res = await request(app)
      .post('/api/auth/setup-user')
      .send(adminBody('admin_two', 'NAT12345'));

    expect(res.status).toBe(409);
    expect(await findUserRow('admin_two')).toBeNull();
    expect(await countUsers()).toBe(1);
  });

  it.each([
    ['username too short', { ...cashierBody(), username: 'ab' }],
    ['password too short', { ...cashierBody(), password: '1234567' }],
    ['missing password', { username: 'cashier_one' }],
    ['bad birthDate format', { ...adminBody(), birthDate: '01-01-1990' }],
  ])('returns 400 and writes nothing when %s', async (_name, body) => {
    const res = await request(app).post('/api/auth/setup-user').send(body);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation failed');
    expect(await countUsers()).toBe(0);
  });
});

describe('POST /api/auth/login', () => {
  it('logs a cashier in after registration (full flow)', async () => {
    await registerViaApi(cashierBody());
    const res = await request(app).post('/api/auth/login').send(cashierBody());

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('login successfully');
    expect(res.body.token2).toBeDefined(); // اسم الحقل الحالي في الكود
    expect(res.headers['set-cookie'][0]).toContain('token=');
    expect(jwt.decode(res.body.token2).role).toBe('cashier');
  });

  it('logs an admin in with a short-lived (5 min) token', async () => {
    await registerViaApi(adminBody());
    const res = await request(app).post('/api/auth/login').send({
      username: 'admin_one',
      password: PASSWORD,
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('to next step');
    const decoded = jwt.decode(res.body.token);
    expect(decoded.role).toBe('admin');
    expect(decoded.exp - decoded.iat).toBe(300);
  });

  it('returns 401 for a wrong password', async () => {
    await registerViaApi(cashierBody());
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'cashier_one', password: 'WrongPassword1' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid username or password');
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('returns the same 401 message for an unknown user (no user enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'ghost_user', password: PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid username or password');
  });

  it.each([
    ['missing password', { username: 'cashier_one' }],
    ['username too short', { username: 'ab', password: PASSWORD }],
    ['empty body', {}],
  ])('returns 400 when %s', async (_name, body) => {
    const res = await request(app).post('/api/auth/login').send(body);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation failed');
  });
});

describe('Admin routes protection (/api/admin)', () => {
  let admin;
  let cashier;

  beforeEach(async () => {
    admin = await registerViaApi(adminBody());
    cashier = await registerViaApi(cashierBody());
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });

  it('returns 401 with an invalid token', async () => {
    const res = await request(app).get('/api/admin/users').set(...tokenCookie('not.a.jwt'));
    expect(res.status).toBe(401);
  });

  it('returns 403 for a cashier token', async () => {
    const res = await request(app).get('/api/admin/users').set(...tokenCookie(cashier.token));
    expect(res.status).toBe(403);
  });

  it('lets an admin list users (without password hashes)', async () => {
    const res = await request(app).get('/api/admin/users').set(...tokenCookie(admin.token));

    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(2);
    expect(res.body.users[0]).not.toHaveProperty('password_hash');
  });

  it('lets an admin delete a cashier and removes the row', async () => {
    const res = await request(app)
      .delete(`/api/admin/users/${cashier.id}`)
      .set(...tokenCookie(admin.token));

    expect(res.status).toBe(200);
    expect(await findUserRow('cashier_one')).toBeNull();
  });

  it('refuses to delete an admin account (404) and keeps the row', async () => {
    const res = await request(app)
      .delete(`/api/admin/users/${admin.id}`)
      .set(...tokenCookie(admin.token));

    expect(res.status).toBe(404);
    expect(await findUserRow('admin_one')).not.toBeNull();
  });

  it('returns 404 when deleting a non-existent user', async () => {
    const res = await request(app)
      .delete('/api/admin/users/999999')
      .set(...tokenCookie(admin.token));

    expect(res.status).toBe(404);
  });

  it('forbids a cashier from deleting users (403) and keeps the row', async () => {
    const res = await request(app)
      .delete(`/api/admin/users/${cashier.id}`)
      .set(...tokenCookie(cashier.token));

    expect(res.status).toBe(403);
    expect(await findUserRow('cashier_one')).not.toBeNull();
  });
});