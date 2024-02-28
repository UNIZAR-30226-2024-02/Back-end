// app.test.js
const supertest = require('supertest');
const { app, startApp, close } = require('../app');

const request = supertest(app);

beforeAll(async () => {
    await startApp();
});

afterAll(async () => {
   
});

describe('Prueba inicial', () => {
    it('debería responder correctamente en la ruta principal', async () => {
        const response = await request.get('/');
        expect(response.status).toBe(200);
        expect(response.text).toBe('Todo funciona bien');
    });
});
