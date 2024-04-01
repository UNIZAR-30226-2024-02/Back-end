const supertest = require('supertest');
const { app, startApp, close } = require('../app');
const Usuario = require('../models/Usuario'); 
const Partida = require('../models/Partida'); 
const Chat = require('../models/Chat')

const request = supertest(app);

let authTokenPerro;
let authTokenPig;

beforeAll(async () => {
    await startApp();

    const perro = {
        id: 'perro_sanxe',
        password: 'soy_traidor_lovePigdemon'
    };

    const response = await request
        .post('/login')
        .send(perro)
        .set('Accept', 'application/json');

    authTokenPerro = response.body.token;

    const pig = {
        id: 'pig@demon.es',
        password: 'tengo_miedo_de_la_poli'
    };

    const response2 = await request
        .post('/login')
        .send(pig)
        .set('Accept', 'application/json');

    authTokenPig = response2.body.token;
});

afterAll((done) => {
  close().then(() => done());
});

describe('Chat', () => {
    it('debería permitir crear un chat', async () => {
        await Chat.deleteOne({ nombreChat: 'PruebaChatTests777' })
        const usuario = await Usuario.findOne({idUsuario: "a"}); 
        const usuario2 = await Usuario.findOne({idUsuario: "b"});
        const perro = await Usuario.findOne({idUsuario: "perro_sanxe"});

        // Set amigos de perro
        perro.amigos = ['a', 'b'];
        perro.chats = [];
        // Set chats to empty and save
        usuario.chats = [];
        usuario2.chats = [];
        await usuario.save();
        await usuario2.save();
        await perro.save();
        const chat = {
            _id: "caballo",
            nombreChat: "PruebaChatTests777",
            usuarios: ['a', 'b']
        }
        const response = await request
            .post('/chats/crearChat')
            .send(chat)
            .set('Authorization', `${authTokenPerro}`) // Incluye el token de acceso en el encabezado
            .set('Accept', 'application/json');

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message', 'OK');
    });

    it('debería fallar crear un chat ya existente', async () => {
        const chat = {
            nombreChat: "PruebaChatTests777",
            usuarios: ['a', 'b']
        }
        const response = await request
            .post('/chats/crearChat')
            .send(chat)
            .set('Authorization', `${authTokenPerro}`) // Incluye el token de acceso en el encabezado
            .set('Accept', 'application/json');

            expect(response.status).toBe(500);
    });
    /*
    it('debería fallar crear un chat con un usuario inexistente', async () => {
        await Chat.deleteOne({ nombreChat: 'PruebaChatTests7778' })
        const chat = {
            nombreChat: "PruebaChatTests7778",
            usuarios: ['a', 'noExistoNiExistireEsteNombreEsMuyRaroParaUnUsuarioRealXD']
        }
        const response = await request
            .post('/chats/crearChat')
            .send(chat)
            .set('Authorization', `${authTokenPerro}`) // Incluye el token de acceso en el encabezado
            .set('Accept', 'application/json');

            expect(response.status).toBe(500);
    });
    */
    it('debería permitir enviar un mensaje a un chat', async () => {
        const chat = await Chat.findOne({nombreChat: "PruebaChatTests777"});
        const peticion = {
            OID: chat._id,
            textoMensaje: 'Hola! Este juego me gusta mucho :3'
        }
        const response = await request
            .post('/chats/enviarMensaje')
            .send(peticion)
            .set('Authorization', `${authTokenPerro}`) // Incluye el token de acceso en el encabezado
            .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('mensaje', 'Mensaje enviado con éxito');
    });

    it('debería fallar enviar un mensaje a un chat en el que no esta el usuario', async () => {
        const peticion = {
            OID: "1234",
            textoMensaje: 'Hola! Este juego me gusta mucho :3'
        }
        const response = await request
            .post('/chats/enviarMensaje')
            .send(peticion)
            .set('Authorization', `${authTokenPerro}`) // Incluye el token de acceso en el encabezado
            .set('Accept', 'application/json');

            expect(response.status).toBe(500);
    });

    it('debería permitir abandonar un chat', async () => {
        const chat = await Chat.findOne({nombreChat: "PruebaChatTests777"});
        const peticion = {
            OID: chat._id,
        }
        const response = await request
            .post('/chats/salirDeChat')
            .send(peticion)
            .set('Authorization', `${authTokenPerro}`) // Incluye el token de acceso en el encabezado
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
            .set('Authorization', `${authTokenPerro}`) // Incluye el token de acceso en el encabezado
            .set('Accept', 'application/json');

            expect(response.status).toBe(500);
    });
    it('deberia permitir crear chat con un usuario no existente y un existente', async () => {
        await Chat.deleteOne({ nombreChat: 'PruebaChatTests7778' })
        const usuario = await Usuario.findOne({idUsuario: "a"});
        usuario.chats = [];
        await usuario.save();
        const noexistentes = ['noExistoNiExistire', 'noExistoNiExistireXD']
        const chat = {
            nombreChat: "PruebaChatTests7778",
            usuarios: ['noExistoNiExistire', 'noExistoNiExistireXD', 'a']
        }
        const response = await request
            .post('/chats/crearChat')
            .send(chat)
            .set('Authorization', `${authTokenPerro}`) // Incluye el token de acceso en el encabezado
            .set('Accept', 'application/json');

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message', 'No se ha añadido a ' + noexistentes.join(', ') + ' porque no son tus amigos/ no existen');
    });

});