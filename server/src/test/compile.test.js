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

let authToken;
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
        authToken = response.body.token;
        console.log(authToken)
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

    it('debería permitir crear una nueva partida pública', async () => {
        const caracteres = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const longitud = 124; 
        let nombrePartida = 'partida_';

        for (let i = 0; i < longitud; i++) {
            const indiceAleatorio = Math.floor(Math.random() * caracteres.length);
            nombrePartida += caracteres[indiceAleatorio];
        }
        const partida = {
            privacidad: false,
            num: 4,
            nombre: nombrePartida,
            password: null
        };
        const response = await request
            .post('/nuevaPartida')
            .send(partida)
            .set('Authorization', `${authToken}`) // Incluye el token de acceso en el encabezado
            .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Partida inició correctamente');
    });

    it('debería permitir crear un chat', async () => {
        await Chat.deleteOne({ nombreChat: 'PruebaChatTests777' })
        const chat = {
            nombreChat: "PruebaChatTests777",
            usuarios: ['a', 'b']
        }
        const response = await request
            .post('/chats/crearChat')
            .send(chat)
            .set('Authorization', `${authToken}`) // Incluye el token de acceso en el encabezado
            .set('Accept', 'application/json');

            expect(response.status).toBe(201);
    });

    it('debería fallar crear un chat ya existente', async () => {
        const chat = {
            nombreChat: "PruebaChatTests777",
            usuarios: ['a', 'b']
        }
        const response = await request
            .post('/chats/crearChat')
            .send(chat)
            .set('Authorization', `${authToken}`) // Incluye el token de acceso en el encabezado
            .set('Accept', 'application/json');

            expect(response.status).toBe(500);
    });

    it('debería fallar crear un chat con un usuario inexistente', async () => {
        await Chat.deleteOne({ nombreChat: 'PruebaChatTests7778' })
        const chat = {
            nombreChat: "PruebaChatTests7778",
            usuarios: ['a', 'noExistoNiExistireEsteNombreEsMuyRaroParaUnUsuarioRealXD']
        }
        const response = await request
            .post('/chats/crearChat')
            .send(chat)
            .set('Authorization', `${authToken}`) // Incluye el token de acceso en el encabezado
            .set('Accept', 'application/json');

            expect(response.status).toBe(500);
    });

    it('debería permitir enviar un mensaje a un chat', async () => {
        const peticion = {
            nombreChat: "PruebaChatTests777",
            textoMensaje: 'Hola! Este juego me gusta mucho :3'
        }
        const response = await request
            .post('/chats/enviarMensaje')
            .send(peticion)
            .set('Authorization', `${authToken}`) // Incluye el token de acceso en el encabezado
            .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('mensaje', 'Mensaje enviado con éxito');
    });

    it('debería fallar enviar un mensaje a un chat en el que no esta el usuario', async () => {
        const peticion = {
            nombreChat: "PruebaChatTests1488",
            textoMensaje: 'Hola! Este juego me gusta mucho :3'
        }
        const response = await request
            .post('/chats/enviarMensaje')
            .send(peticion)
            .set('Authorization', `${authToken}`) // Incluye el token de acceso en el encabezado
            .set('Accept', 'application/json');

            expect(response.status).toBe(500);
    });

    it('debería permitir abandonar un chat', async () => {
        const peticion = {
            nombreChat: "PruebaChatTests777",
        }
        const response = await request
            .post('/chats/salirDeChat')
            .send(peticion)
            .set('Authorization', `${authToken}`) // Incluye el token de acceso en el encabezado
            .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('mensaje', 'Usuario salió del chat exitosamente');
    });

    it('debería fallar abandonar un chat en el que no estoy', async () => {
        const peticion = {
            nombreChat: "PruebaChatTests777",
        }
        const response = await request
            .post('/chats/salirDeChat')
            .send(peticion)
            .set('Authorization', `${authToken}`) // Incluye el token de acceso en el encabezado
            .set('Accept', 'application/json');

            expect(response.status).toBe(500);
    });
});


