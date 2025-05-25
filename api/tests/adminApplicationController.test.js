// __tests__/adminApplicationController.test.js

// 1. Declare mock client for Jest hoisting
let mockSupabaseClient;

// 2. jest.mock factory safely assigns mockSupabaseClient
jest.mock('@supabase/supabase-js', () => {
  mockSupabaseClient = { from: jest.fn() };
  return { createClient: jest.fn(() => mockSupabaseClient) };
});

// 3. Import controller after mock setup
const {
  checkApplication,
  submitApplication,
  rejectUser,
  getRoleUsers,
  getAuthUsers,
  addAdmin,
  removeAdmin,
} = require('../controllers/adminApplicationController');

// Helper: chain builder for select() queries
function createSelectChain({ data, error }) {
  const chain = {};
  chain.select = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.order = jest.fn().mockReturnValue(chain);
  chain.limit = jest.fn().mockReturnValue(chain);
  chain.data = data;
  chain.error = error;
  // make chain awaitable
  chain.then = (resolve) => resolve({ data: chain.data, error: chain.error });
  return chain;
}

// Helper: chain builder for insert operations
function createInsertChain({ error }) {
  return {
    insert: jest.fn().mockReturnValue(Promise.resolve({ error })),
  };
}

// Helper: chain builder for update->eq operations
function createUpdateChain({ error }) {
  const chain = {};
  chain.update = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.error = error;
  // await chain
  chain.then = (resolve) => resolve({ error: chain.error });
  return chain;
}

// Helper: chain builder for delete->eq->eq operations
function createDeleteChain({ error }) {
  const chain = {};
  chain.delete = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.error = error;
  // await chain
  chain.then = (resolve) => resolve({ error: chain.error });
  return chain;
}

// Minimal mock response
target = null;
function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    sendStatus: jest.fn(),
  };
}

// 📄 Application endpoints
describe('checkApplication()', () => {
  let req, res;
  beforeEach(() => {
    res = createRes();
    mockSupabaseClient.from.mockReset();
  });

  it('returns accepted status when latest application is accepted', async () => {
    const data = [{ is_accepted: true, is_denied: false }];
    const chain = createSelectChain({ data, error: null });
    mockSupabaseClient.from.mockReturnValueOnce(chain);
    req = { userId: 'u1' };

    await checkApplication(req, res);
    expect(res.json).toHaveBeenCalledWith({ alreadyApplied: true, status: 'accepted', application: data[0] });
  });

  it('returns denied status when latest application is denied', async () => {
    const data = [{ is_accepted: false, is_denied: true }];
    const chain = createSelectChain({ data, error: null });
    mockSupabaseClient.from.mockReturnValueOnce(chain);
    req = { userId: 'u2' };

    await checkApplication(req, res);
    expect(res.json).toHaveBeenCalledWith({ alreadyApplied: true, status: 'denied', application: data[0] });
  });

  it('returns pending when neither accepted nor denied', async () => {
    const data = [{ is_accepted: false, is_denied: false }];
    const chain = createSelectChain({ data, error: null });
    mockSupabaseClient.from.mockReturnValueOnce(chain);
    req = { userId: 'u3' };

    await checkApplication(req, res);
    expect(res.json).toHaveBeenCalledWith({ alreadyApplied: true, status: 'pending', application: data[0] });
  });

  it('reports empty when no application exists', async () => {
    const chain = createSelectChain({ data: [], error: null });
    mockSupabaseClient.from.mockReturnValueOnce(chain);
    req = { userId: 'u4' };

    await checkApplication(req, res);
    expect(res.json).toHaveBeenCalledWith({ alreadyApplied: false, status: '', application: null });
  });

  it('propagates a DB error', async () => {
    const chain = createSelectChain({ data: null, error: new Error('DB fail') });
    mockSupabaseClient.from.mockReturnValueOnce(chain);
    req = { userId: 'u5' };

    await checkApplication(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'DB fail' });
  });
});

describe('submitApplication()', () => {
  let req, res;
  beforeEach(() => {
    res = createRes();
    mockSupabaseClient.from.mockReset();
  });

  it('inserts a new application and returns 200', async () => {
    const chain = createInsertChain({ error: null });
    mockSupabaseClient.from.mockReturnValueOnce(chain);
    req = { body: { id: 'u1', user_name: 'Alice', motivation: 'I care' } };

    await submitApplication(req, res);
    expect(res.sendStatus).toHaveBeenCalledWith(200);
  });

  it('returns 500 if insert fails', async () => {
    const chain = createInsertChain({ error: new Error('insert error') });
    mockSupabaseClient.from.mockReturnValueOnce(chain);
    req = { body: { id: 'u2', user_name: 'Bob', motivation: 'Please' } };

    await submitApplication(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: new Error('insert error') });
  });
});

describe('rejectUser()', () => {
  let req, res;
  beforeEach(() => {
    res = createRes();
    mockSupabaseClient.from.mockReset();
  });

  it('marks as denied and returns 200', async () => {
    const chain = createUpdateChain({ error: null });
    mockSupabaseClient.from.mockReturnValueOnce(chain);
    req = { body: { id: 'u1' } };

    await rejectUser(req, res);
    expect(res.sendStatus).toHaveBeenCalledWith(200);
  });

  it('returns 500 on update error', async () => {
    const chain = createUpdateChain({ error: new Error('update fail') });
    mockSupabaseClient.from.mockReturnValueOnce(chain);
    req = { body: { id: 'u2' } };

    await rejectUser(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'update fail' });
  });
});

describe('getRoleUsers()', () => {
  let res;
  beforeEach(() => {
    res = createRes();
    mockSupabaseClient.from.mockReset();
  });

  it('returns all user_roles on success', async () => {
    const roles = [{ user_id: 'u1', role: 'admin' }];
    const chain = createSelectChain({ data: roles, error: null });
    mockSupabaseClient.from.mockReturnValueOnce(chain);

    await getRoleUsers({}, res);
    expect(res.json).toHaveBeenCalledWith(roles);
  });

  it('returns 500 on DB error', async () => {
    const chain = createSelectChain({ data: null, error: new Error('fetch fail') });
    mockSupabaseClient.from.mockReturnValueOnce(chain);

    await getRoleUsers({}, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'fetch fail' });
  });
});

describe('getAuthUsers()', () => {
  let res;
  beforeEach(() => {
    res = createRes();
    mockSupabaseClient.from.mockReset();
  });

  it('returns all applications on success', async () => {
    const apps = [{ user_id: 'u2', is_accepted: true }];
    const chain = createSelectChain({ data: apps, error: null });
    mockSupabaseClient.from.mockReturnValueOnce(chain);

    await getAuthUsers({}, res);
    expect(res.json).toHaveBeenCalledWith(apps);
  });

  it('returns 500 on DB error', async () => {
    const chain = createSelectChain({ data: null, error: new Error('auth fetch fail') });
    mockSupabaseClient.from.mockReturnValueOnce(chain);

    await getAuthUsers({}, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'auth fetch fail' });
  });
});

describe('removeAdmin()', () => {
  let req, res;
  beforeEach(() => {
    res = createRes();
    mockSupabaseClient.from.mockReset();
  });

  it('revokes admin and returns 200', async () => {
    const updateChain = createUpdateChain({ error: null });
    const deleteChain = createDeleteChain({ error: null });
    mockSupabaseClient.from
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(deleteChain);

    req = { body: { id: 'u1' } };
    await removeAdmin(req, res);
    expect(res.sendStatus).toHaveBeenCalledWith(200);
  });

  it('returns 500 if applications update fails', async () => {
    const chain = createUpdateChain({ error: new Error('app update fail') });
    mockSupabaseClient.from.mockReturnValueOnce(chain);
    req = { body: { id: 'u2' } };

    await removeAdmin(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'app update fail' });
  });

  it('returns 500 if role deletion fails', async () => {
    const updateChain = createUpdateChain({ error: null });
    const deleteChain = createDeleteChain({ error: new Error('role delete fail') });
    mockSupabaseClient.from
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(deleteChain);

    req = { body: { id: 'u3' } };
    await removeAdmin(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'role delete fail' });
  });
});

describe('addAdmin()', () => {
  let req, res;
  beforeEach(() => {
    res = createRes();
    mockSupabaseClient.from.mockReset();
  });

  it('accepts application, creates role, and returns 200', async () => {
    const updateChain = createUpdateChain({ error: null });
    const insertChain = createInsertChain({ error: null });
    mockSupabaseClient.from
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(insertChain);

    req = { body: { id: 'u1' } };
    await addAdmin(req, res);
    expect(res.sendStatus).toHaveBeenCalledWith(200);
  });

  it('returns 500 if role insertion fails', async () => {
    const updateChain = createUpdateChain({ error: null });
    const insertChain = createInsertChain({ error: new Error('role insert fail') });
    mockSupabaseClient.from
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(insertChain);

    req = { body: { id: 'u3' } };
    await addAdmin(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'role insert fail' });
  });
});
