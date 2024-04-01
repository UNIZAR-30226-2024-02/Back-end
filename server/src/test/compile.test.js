const supertest = require('supertest');
const { app, startApp, close } = require('../app');
const Usuario = require('../models/Usuario'); 
const Partida = require('../models/Partida'); 
const Chat = require('../models/Chat')

const request = supertest(app);

beforeAll(async () => {
    await startApp();
});

afterAll((done) => {
  close().then(() => done());
});

describe('Prueba inicial', () => {
    it('debería responder correctamente en la ruta principal', async () => {
        const response = await request.get('/');
        expect(response.status).toBe(200);
        expect(response.text).toBe('Todo funciona bien');
    });
});
