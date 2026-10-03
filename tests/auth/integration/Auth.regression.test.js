import './env.js';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../../src/app.js';
console.log("CHECKING APP INSTANCE:", app);
import {
  pool,
  resetDatabase,
  closeDatabase,
  findUserRow,
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

const registerViaApi = async (body) => {
  const res = await request(app).post('/api/auth/setup-user').send(body);
  expect(res.status).toBe(201);
  return res.body.user;
};

const countAdmins = async () => {
  const [rows] = await pool.query("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'");
  return rows[0].c;
};

// قيمة التوكن كما أرسلها السيرفر في الـ Set-Cookie
const cookieToken = (res) => {
  const cookies = res.headers['set-cookie'] || [];
  const match = cookies.join(';').match(/token=([^;]+)/);
  return match ? match[1] : null;
};

// يفشل برسالة واضحة بدل أن يعلّق الاختبار إذا نفدت اتصالات الـ pool
const withTimeout = async (promise, ms, message) => {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
};

/*
|--------------------------------------------------------------------------
| تتبّع الاتصالات: كل اتصال يؤخذ من الـ pool ولم يُعَد = اتصال مسرَّب
|--------------------------------------------------------------------------
*/
let openConnections;
let getConnectionSpy;

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  // jest.spyOn(console, 'error').mockImplementation(() => {});
});

beforeEach(async () => {
  await resetDatabase();

  openConnections = new Set();
  const original = pool.getConnection.bind(pool);
  getConnectionSpy = jest.spyOn(pool, 'getConnection').mockImplementation(async (...args) => {
    const conn = await original(...args);
    const release = conn.release.bind(conn);
    openConnections.add(conn);
    conn.release = () => {
      openConnections.delete(conn);
      return release();
    };
    return conn;
  });
});

afterEach(() => {
  // نحرّر أي اتصال مسرَّب حتى لا يعلّق فشل اختبار واحد بقية الاختبارات
  [...openConnections].forEach((conn) => conn.release());
  getConnectionSpy.mockRestore();
});

afterAll(async () => {
  jest.restoreAllMocks();
  await closeDatabase();
});

/*
|==========================================================================
| 1) تسريب الاتصالات
|==========================================================================
*/
describe('Connection leak: every request must give its DB connection back', () => {
  let admin;
  let cashier;

  beforeEach(async () => {
    admin = await registerViaApi(adminBody());
    cashier = await registerViaApi(cashierBody());
  });

  const scenarios = [
    ['POST /login (cashier, success)', () => request(app).post('/api/auth/login').send(cashierBody())],
    ['POST /login (admin, success)', () => request(app).post('/api/auth/login').send({ username: 'admin_one', password: PASSWORD })],
    ['POST /login (wrong password)', () => request(app).post('/api/auth/login').send({ username: 'cashier_one', password: 'WrongPassword1' })],
    ['POST /login (unknown user)', () => request(app).post('/api/auth/login').send({ username: 'ghost_user', password: PASSWORD })],
    ['POST /setup-user (new cashier)', () => request(app).post('/api/auth/setup-user').send(cashierBody('cashier_two'))],
    ['POST /setup-user (duplicate username)', () => request(app).post('/api/auth/setup-user').send(cashierBody())],
    ['GET /admin/users', () => request(app).get('/api/admin/users').set(...tokenCookie(admin.token))],
    ['DELETE /admin/users/:id (cashier)', () => request(app).delete(`/api/admin/users/${cashier.id}`).set(...tokenCookie(admin.token))],
    ['DELETE /admin/users/:id (admin => 404)', () => request(app).delete(`/api/admin/users/${admin.id}`).set(...tokenCookie(admin.token))],
    ['DELETE /admin/users/:id (missing => 404)', () => request(app).delete('/api/admin/users/999999').set(...tokenCookie(admin.token))],
  ];

  it.each(scenarios)('%s leaves no open connection', async (_name, send) => {
    await send();

    expect(openConnections.size).toBe(0);
  });

  it('keeps serving after more deletes than the pool size (default 10)', async () => {
    const ids = [];
    for (let i = 0; i < 12; i += 1) {
      const [result] = await pool.query(
        "INSERT INTO users (username, password_hash, role) VALUES (?, 'x', 'cashier')",
        [`temp_cashier_${i}`]
      );
      ids.push(result.insertId);
    }

    for (const id of ids) {
      const res = await withTimeout(
        request(app).delete(`/api/admin/users/${id}`).set(...tokenCookie(admin.token)),
        3000,
        `DELETE hung on user ${id}: the connection pool is exhausted (leak)`
      );
      expect(res.status).toBe(200);
    }
  });
});

/*
|==========================================================================
| 2) النظام مصمم لأدمن واحد فقط، والباقي كاشير
|==========================================================================
*/
describe('Single admin policy', () => {
  it('rejects a second admin with 409 and stores nothing', async () => {
    await registerViaApi(adminBody('admin_one', 'NAT12345'));

    const res = await request(app)
      .post('/api/auth/setup-user')
      .send(adminBody('admin_two', 'NAT99999')); // اسم ورقم وطني مختلفان تمامًا

    expect(res.status).toBe(409);
    expect(await findUserRow('admin_two')).toBeNull();
    expect(await countAdmins()).toBe(1);
  });

  it('still allows any number of cashiers after the admin exists', async () => {
    await registerViaApi(adminBody());
    await registerViaApi(cashierBody('cashier_one'));
    await registerViaApi(cashierBody('cashier_two'));

    expect(await countUsers()).toBe(3);
    expect(await countAdmins()).toBe(1);
  });

  it('lets only one admin through when two sign-ups arrive at the same time', async () => {
    const [a, b] = await Promise.all([
      request(app).post('/api/auth/setup-user').send(adminBody('admin_a', 'NAT11111')),
      request(app).post('/api/auth/setup-user').send(adminBody('admin_b', 'NAT22222')),
    ]);

    expect([a.status, b.status].sort()).toEqual([201, 409]);
    expect(await countAdmins()).toBe(1);
  });
});

/*
|==========================================================================
| 3) شكل استجابة الدخول يجب أن يكون واحدًا لكل الأدوار
|==========================================================================
*/
describe('Login response shape is consistent across roles', () => {
  it.each([
    ['cashier', cashierBody()],
    ['admin', adminBody()],
  ])('%s login returns "token" (not "token2") matching the cookie', async (role, body) => {
    await registerViaApi(body);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: body.username, password: body.password });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body).not.toHaveProperty('token2');
    expect(typeof res.body.message).toBe('string');

    expect(cookieToken(res)).toBe(res.body.token);
    expect(jwt.decode(res.body.token).role).toBe(role);
  });
});