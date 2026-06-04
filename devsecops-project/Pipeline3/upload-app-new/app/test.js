const request = require('supertest');
const { app, getFileCount } = require('./server');

describe('File Upload App Tests', () => {

  let uploadedFileName;

  test('GET /files should return 200 and array', async () => {
    const res = await request(app).get('/files');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /upload should upload a txt file', async () => {
    const res = await request(app)
      .post('/upload')
      .attach('file', Buffer.from('Hello'), 'test.txt');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'File uploaded successfully');

    const filesRes = await request(app).get('/files');
    uploadedFileName = filesRes.body.find(f => f.includes('test.txt'));
    expect(uploadedFileName).toBeDefined();
  });

  test('getFileCount should return correct number of files', () => {
    const count = getFileCount();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('DELETE /delete/:name should remove the uploaded file', async () => {
    if (!uploadedFileName) return;

    const res = await request(app)
      .delete(`/delete/${uploadedFileName}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'File deleted');
  });

});
