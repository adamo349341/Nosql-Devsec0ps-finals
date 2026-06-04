const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');

beforeAll(async () => {
  const maxWait = 10000;
  const start = Date.now();
  while (mongoose.connection.readyState !== 1) {
    if (Date.now() - start > maxWait) throw new Error('MongoDB connection timeout');
    await new Promise(r => setTimeout(r, 200));
  }
}, 15000);

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('GET /health', () => {
  test('should return 200 and status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('connected');
  });
});

describe('Tasks API', () => {
  test('GET /api/tasks - should return empty array', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  test('POST /api/tasks - should create a task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Test task', description: 'Test desc', priority: 'high' });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.title).toBe('Test task');
    expect(res.body.data.status).toBe('todo');
  });

  test('POST /api/tasks - should fail without title', async () => {
    const res = await request(app).post('/api/tasks').send({ description: 'No title' });
    expect(res.statusCode).toBe(400);
  });

  test('PUT /api/tasks/:id - should update a task', async () => {
    const create = await request(app).post('/api/tasks').send({ title: 'Update me' });
    const id = create.body.data._id;
    const res = await request(app).put('/api/tasks/' + id).send({ status: 'done' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('done');
  });

  test('DELETE /api/tasks/:id - should delete a task', async () => {
    const create = await request(app).post('/api/tasks').send({ title: 'Delete me' });
    const id = create.body.data._id;
    const res = await request(app).delete('/api/tasks/' + id);
    expect(res.statusCode).toBe(200);
  });

  test('GET /api/tasks/:id - should return 404 for unknown id', async () => {
    const res = await request(app).get('/api/tasks/64f0000000000000000000ff');
    expect(res.statusCode).toBe(404);
  });
});