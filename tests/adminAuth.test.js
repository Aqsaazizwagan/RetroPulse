const test = require('node:test');
const assert = require('node:assert');
const { authenticate, requireAdmin } = require('../src/middleware/auth');

function createMockReqRes(headers = {}) {
  const req = { headers };
  let statusCode = 200;
  let responseData = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    }
  };

  return {
    req,
    res,
    getStatus: () => statusCode,
    getData: () => responseData
  };
}

test('Administrative Route Authorization Failure Suite', async (t) => {
  await t.test('AUTH FAILURE 1: Missing Authorization header returns 401 Unauthorized', () => {
    const { req, res, getStatus, getData } = createMockReqRes();
    let nextCalled = false;

    authenticate(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(getStatus(), 401);
    assert.strictEqual(getData().success, false);
    assert.strictEqual(getData().error.code, 'AUTH_REQUIRED');
  });

  await t.test('AUTH FAILURE 2: Malformed token header returns 401 Unauthorized', () => {
    const { req, res, getStatus, getData } = createMockReqRes({ authorization: 'NotBearer token' });
    let nextCalled = false;

    authenticate(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(getStatus(), 401);
    assert.strictEqual(getData().error.code, 'INVALID_AUTH_FORMAT');
  });

  await t.test('AUTH FAILURE 3: Invalid token signature/value returns 401 Unauthorized', () => {
    const { req, res, getStatus, getData } = createMockReqRes({ authorization: 'Bearer completely_fake_token' });
    let nextCalled = false;

    authenticate(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(getStatus(), 401);
    assert.strictEqual(getData().error.code, 'INVALID_TOKEN');
  });

  await t.test('AUTHORIZATION FAILURE 4: Authenticated user with role="buyer" fails with 403 Forbidden', () => {
    const { req, res, getStatus, getData } = createMockReqRes({ authorization: 'Bearer token_user_buyer' });
    let authNext = false;
    let adminNext = false;

    authenticate(req, res, () => { authNext = true; });
    assert.strictEqual(authNext, true);
    assert.strictEqual(req.user.role, 'buyer');

    requireAdmin(req, res, () => { adminNext = true; });
    assert.strictEqual(adminNext, false);
    assert.strictEqual(getStatus(), 403);
    assert.strictEqual(getData().success, false);
    assert.strictEqual(getData().error.code, 'FORBIDDEN_ADMIN_ONLY');
  });

  await t.test('SUCCESS: Authenticated user with role="admin" passes both middlewares', () => {
    const { req, res, getStatus } = createMockReqRes({ authorization: 'Bearer token_user_admin' });
    let authNext = false;
    let adminNext = false;

    authenticate(req, res, () => { authNext = true; });
    assert.strictEqual(authNext, true);
    assert.strictEqual(req.user.role, 'admin');

    requireAdmin(req, res, () => { adminNext = true; });
    assert.strictEqual(adminNext, true);
    assert.strictEqual(getStatus(), 200);
  });
});
