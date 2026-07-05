import request from 'supertest';
import app from '../app.js';
import { describe, it, expect } from 'vitest';

describe('Risk API', () => {
  it('returns high severity for unpaid sample text', async () => {
    const response = await request(app)
      .post('/api/risk/detect')
      .send({ text: 'can you do a free sample?' })
      .expect(200);

    expect(response.body).toHaveProperty('redFlags');
    expect(Array.isArray(response.body.redFlags)).toBe(true);
    expect(response.body.redFlags.length).toBeGreaterThan(0);
    expect(response.body.redFlags.some(flag => flag.severity === 'high')).toBe(true);
  });

  it('returns 400 for missing text payload', async () => {
    const response = await request(app)
      .post('/api/risk/detect')
      .send({})
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });
});
