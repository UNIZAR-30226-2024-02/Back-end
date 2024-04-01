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

let authTokenPerro;
let authTokenPig;

describe('Registro de usuario y posterior login', () => {
    // Elimina el usuario existente si existe
    const perro = {
        idUsuario: 'perro_sanxe',
        password: 'soy_traidor_lovePigdemon',
        correo: 'perro@psoe.es'
    };
    const pig = {
        idUsuario: 'pigdemon',
        password: 'tengo_miedo_de_la_poli',
        correo: 'pig@demon.es',
    };

    beforeAll(async () => {
        await Usuario.deleteOne({ idUsuario: perro.idUsuario });
        await Usuario.deleteOne({ idUsuario: pig.idUsuario });
    });

    it('debería registrar un nuevo usuario', async () => {
        const responsePerro = await request
            .post('/register')
            .send(perro)
            .set('Accept', 'application/json');
        expect(responsePerro.status).toBe(201);
        expect(responsePerro.body).toHaveProperty('message', 'Usuario registrado exitosamente');
        const responsePig = await request
            .post('/register')
            .send(pig)
            .set('Accept', 'application/json');
        expect(responsePig.status).toBe(201);
        expect(responsePig.body).toHaveProperty('message', 'Usuario registrado exitosamente');
    });

    it('debería devolver un error si el usuario ya existe, por su id', async () => {
        // Intenta registrar el mismo usuario nuevamente (debería fallar)
        const response = await request
            .post('/register')
            .send(perro)
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
        authTokenPerro = response.body.token;
    });

    it('debería permitir a un usuario existente loggearse con su email', async () => {
        const usuarioExistente = {
            id: 'pig@demon.es',
            password: 'tengo_miedo_de_la_poli'
        };

        const response = await request
            .post('/login')
            .send(usuarioExistente)
            .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Login correcto');
        authTokenPig = response.body.token;
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