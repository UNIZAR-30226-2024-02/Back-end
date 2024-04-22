const supertest = require('supertest');
const { app, startApp, close } = require('../app');
const Usuario = require('../models/Usuario'); 
const { Partida } = require('../models/Partida'); 
const Chat = require('../models/Chat')

const request = supertest(app);

let nombrePartida = 'Partidilla';

let id1 = 'Juan';
let pass1 = 'passJuan'
let mail1 = 'juan@gmail.com'
let token1;

let id2 = 'Tomas';
let pass2 = 'passTomas'
let mail2 = 'tomas@gmail.com'
let token2;

let id3 = 'Martin'
let pass3 = 'passMartin'
let mail3 = 'tomas@gmail.com'
let token3;

beforeAll(async () => {
    await startApp();

    // --- Borrar los usuarios si ya existen ---
    await Usuario.deleteOne({ idUsuario: id1 });
    await Usuario.deleteOne({ idUsuario: id2 });
    await Usuario.deleteOne({ idUsuario: id3 });

    // --- Registro usuario 1 ---
    user1 = {
        idUsuario: id1,
        password: pass1,
        correo: mail1
    }
    await request
        .post('/register')
        .send(user1)
        .set('Accept', 'application/json');

    // --- Registro usuario 2 ---
    user2 = {
        idUsuario: id2,
        password: pass2,
        correo: mail2
    }
    await request
        .post('/register')
        .send(user2)
        .set('Accept', 'application/json');

    // --- Registro usuario 3 ---
    user1 = {
        idUsuario: id3,
        password: pass3,
        correo: mail3
    }
    await request
        .post('/register')
        .send(user3)
        .set('Accept', 'application/json');


    // ---  Inicio sesion Usuario 1 ---
    user1 = {
        id: id1,
        password: pass1
    };

    response = await request
    .post('/login')
    .send(user1)
    .set('Accept', 'application/json');

    token1 = response.body.token;

    // ---  Inicio sesion Usuario 2 ---
    user2 = {
        id: id2,
        password: pass2
    };

    response = await request
    .post('/login')
    .send(user2)
    .set('Accept', 'application/json');

    token2 = response.body.token;

    // ---  Inicio sesion Usuario 3 ---
    user3 = {
        id: id3,
        password: pass3
    };

    response = await request
    .post('/login')
    .send(user3)
    .set('Accept', 'application/json');

    token3 = response.body.token;

    // --- Creacion de partida ---
    // Si ya existe la partida se borra
    if(await Partida.findOne({nombre: nombrePartida})){
        await Partida.deleteMany({nombre: nombrePartida});
    }

    const partida = {
        nombre: nombrePartida,
        password: null,
        maxJugadores: 3
    };

    response = await request
        .post('/nuevaPartida')
        .send(partida)
        .set('Authorization', `${authtoken1}`)
        .set('Accept', 'application/json');

    partidaOID = response.body.idPartida;

    // --- Unir a los otros 2 jugadores a la partida ---
    credenciales = {
        idPartida: partidaOID,
        password: null
    }

    response = await request
        .put('/nuevaPartida/join')
        .send(credenciales)
        .set('Authorization', `${authtoken2}`)
        .set('Accept', 'application/json')

    response = await request
        .put('/nuevaPartida/join')
        .send(credenciales)
        .set('Authorization', `${authtoken3}`)
        .set('Accept', 'application/json')
})



it('deberia iniciar la partida e inicializar el estado', async () => {
    credenciales = {
        idPartida: partidaOID,
        user: user1
    }

    const response = await request
        .put('/partida/iniciarPartida')
        .send(credenciales)
        .set('Authorization', `${token1}`)
        .set('Accept', 'application/json')
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('message', 'Partida iniciada')
})



afterAll((done) => {
    close().then(() => done());
});

