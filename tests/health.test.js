const request = require('supertest');
const app = require('../server');

describe('Health Check API', () => {
  it('should return 200 OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'OK');
  });
});