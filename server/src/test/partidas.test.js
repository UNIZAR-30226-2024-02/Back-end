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


let nombrePartida = 'partida_';
describe('Creación de partidas', () => {
    it('debería permitir crear una nueva partida pública', async () => {
        const caracteres = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const longitud = 256; 

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
            .set('Authorization', `${authTokenPerro}`) // Incluye el token de acceso en la cabecera
            .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Partida inició correctamente');
    });

    it('debería fallar crear una nueva partida ya existente', async () => {
        const partida = {
            privacidad: false,
            num: 4,
            nombre: nombrePartida,
            password: null
        };

        const response = await request
            .post('/nuevaPartida')
            .send(partida)
            .set('Authorization', `${authTokenPerro}`) // Incluye el token de acceso en la cabecera
            .set('Accept', 'application/json');

            expect(response.status).toBe(404);
    });

    it('debería estar la nueva partida entre las listadas', async () => {
        const partida = {
            privacidad: false,
            num: 4,
            nombre: nombrePartida,
            password: null
        };

        const response = await request
            .get('/partidas')
            .set('Authorization', `${authTokenPerro}`) // Incluye el token de acceso en la cabecera
            .set('Accept', 'application/json');

        expect(response.status).toBe(201);
        const partidas = response.body;
        const contienePartida = partidas.some(partidaEnLista => { // busco que esté la nueva partida en las listadas
            return partidaEnLista.nombre === partida.nombre;
        });

        expect(contienePartida).toBe(true);
    });
});

// Se expandirá cuando se implemente el módulo de unirse a partida
// PARA QUE ESTOS TESTS FUNCIONEN, PERRO SANXE TIENE QUE TENER AL MENOS UNA PARTIDA Y PIGDEMON NINGUNA
// Este test por deifinición, tal y como está, no sirve para nada, un test que no verifica las precodinciones no tiene sentido
// Si se desea obtener el histórico de partidas de un usuario, primero debes crear un usuario ' a pelo ' que tenga
// unas partidas determinadas en unas serias, y luego en el test verificarlo. No tiene sentido coger un usuario cualquiera
// y confiar en que no habrá cambiado desde la última vez que se ejecutó el test. Lo comento, porque no tiene sentido. 
// No es un test automático, es un test manual. Dependes de que vaya alguien a la base de datos y cambie las partidas
// de pigdemon y perro sanxe, lo cual no es el objetivo de los tests automáticos. Mira como se han hecho el resto de tests. 
// Una buena aproximación para este test sería la siguiente: 
// 1. If sanchez tiene al menos una partida -> do nothing ; else -> añadir una partida a sanchez (se puede hacer a pelo, no necesitas
// la lógica de unirse a una partida). 
// 2. If pigdemon tiene al menos una partida -> pigdemon.partidas = []. Y ya te aseguras de que funciona siempre, y no dependes
// de la otra funcionalidad como decías, ya que para algo es un test unitario. 
/*describe('Históricos', () => {
    it('debería obtener el histórico de un usuario', async () => {
        const response = await request
            .get('/partidas/historico')
            .set('Authorization', `${authTokenPerro}`) // Incluye el token de acceso en la cabecera
            .set('Accept', 'application/json');

            expect(response.status).toBe(200);
    });

    it('debería distinguir correctamente el histórico de un usuario', async () => {
        const response = await request
            .get('/partidas/historico')
            .set('Authorization', `${authTokenPig}`) // Incluye el token de acceso en la cabecera
            .set('Accept', 'application/json');

            expect(response.status).toBe(204);
    });
});*/