const supertest = require('supertest');
const { app, startApp, close } = require('../app');
const Usuario = require('../models/Usuario'); 


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

describe('Registro de usuario y posterior login', () => {
    // Elimina el usuario existente si existe
    beforeAll(async () => {
        const usuarioExistente = {
            idUsuario: 'perro_sanxe',
            password: 'soy_traidor_lovePigdemon',
            correo: 'perro@psoe.es',
        };

        await Usuario.deleteOne({ idUsuario: usuarioExistente.idUsuario });
    });

    it('debería registrar un nuevo usuario', async () => {
        const nuevoUsuario = {
            idUsuario: 'perro_sanxe',
            password: 'soy_traidor_lovePigdemon',
            correo: 'perro@psoe.es',
        };

        const response = await request
            .post('/register')
            .send(nuevoUsuario)
            .set('Accept', 'application/json');
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('message', 'Usuario registrado exitosamente');
    });

    it('debería devolver un error si el usuario ya existe, por su id', async () => {
        const usuarioExistente = {
            idUsuario: 'perro_sanxe',
            password: 'soy_traidor_lovePigdemon',
            correo: 'pigdemonaprision@psoe.es',
        };

        // Intenta registrar el mismo usuario nuevamente (debería fallar)
        const response = await request
            .post('/register')
            .send(usuarioExistente)
            .set('Accept', 'application/json');

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
    });

    it('debería devolver un error si el usuario ya existe, por su email', async () => {
        const usuarioExistente = {
            idUsuario: 'pusdemon',
            password: 'soy_traidor_lovePigdemon',
            correo: 'perro@psoe.es',
        };

        // Intenta registrar el mismo usuario nuevamente (debería fallar)
        const response = await request
            .post('/register')
            .send(usuarioExistente)
            .set('Accept', 'application/json');

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
    });

    it('debería permitir a un usuario existente loggearse con su username', async () => {
        const usuarioExistente = {
            id: 'perro_sanxe',
            password: 'soy_traidor_lovePigdemon'
        };

        const response = await request
            .post('/login')
            .send(usuarioExistente)
            .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Login correcto');
    });

    it('debería permitir a un usuario existente loggearse con su email', async () => {
        const usuarioExistente = {
            id: 'perro@psoe.es',
            password: 'soy_traidor_lovePigdemon'
        };

        const response = await request
            .post('/login')
            .send(usuarioExistente)
            .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Login correcto');
    });

    it('debería fallar login de usuario inexistente', async () => {
        const usuarioExistente = {
            id: 'noExistos@estedominio----esimposible.-...queexista',
            password: 'soy_traidor_lovePigdemon'
        };

        const response = await request
            .post('/login')
            .send(usuarioExistente)
            .set('Accept', 'application/json');

            expect(response.status).toBe(403);
            expect(response.body).toHaveProperty('error');
    });

    it('debería fallar login de usuario inexistente, 2', async () => {
        const usuarioExistente = {
            id: 'noExistosoYunUsuaRioRaroXdXDMePaso',
            password: 'soy_traidor_lovePigdemon'
        };

        const response = await request
            .post('/login')
            .send(usuarioExistente)
            .set('Accept', 'application/json');

            expect(response.status).toBe(403);
            expect(response.body).toHaveProperty('error');
    });
});


