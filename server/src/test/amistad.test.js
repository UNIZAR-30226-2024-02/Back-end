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

describe('Sistema de amistad', () => {
    it('debería fallar la amistad con sí mismo', async () => {
        const amorVerdadero = {
            idDestino: "perro_sanxe"
        };
        {
            const response = await request
                .post('/amistad')
                .send(amorVerdadero)
                .set('Authorization', `${authTokenPerro}`) // Incluye el token de acceso en la cabecera
                .set('Accept', 'application/json');
    
                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('message', 'Error al crear amistad');
        }
        {
            const response = await request
                .delete('/amistad/perro_sanxe')
                .set('Authorization', `${authTokenPerro}`) // Incluye el token de acceso en la cabecera
                .set('Accept', 'application/json');
    
                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('message', 'Error al cancelar amistad');
        }
    });

    it('debería fallar la amistad imaginaria', async () => {
        const amorImposible = {
            idDestino: "Abascal"
        };
        {
            const response = await request
                .post('/amistad')
                .send(amorImposible)
                .set('Authorization', `${authTokenPerro}`) // Incluye el token de acceso en la cabecera
                .set('Accept', 'application/json');

                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('message', 'Error al crear amistad');
        }
        {
            const response = await request
                .delete('/amistad/Abascal')
                .set('Authorization', `${authTokenPerro}`) // Incluye el token de acceso en la cabecera
                .set('Accept', 'application/json');
    
                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('message', 'Error al cancelar amistad');
        }
    });

    it('debería permitir enviar solicitud de amistad', async () => {
        const amorVerdadero = {
            idDestino: "pigdemon"
        };
        const response = await request
            .post('/amistad')
            .send(amorVerdadero)
            .set('Authorization', `${authTokenPerro}`) // Incluye el token de acceso en la cabecera
            .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Creación de amistad correcta');
    });

    it('debería fallar repetir solicitud de amistad', async () => {
        const amorVerdadero = {
            idDestino: "pigdemon"
        };
        const response = await request
            .post('/amistad')
            .send(amorVerdadero)
            .set('Authorization', `${authTokenPerro}`) // Incluye el token de acceso en la cabecera
            .set('Accept', 'application/json');

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message', 'Error al crear amistad');
    });

    it('debería permitir cancelar solicitud de amistad', async () => {
        const response = await request
            .delete('/amistad/pigdemon')
            .set('Authorization', `${authTokenPerro}`) // Incluye el token de acceso en la cabecera
            .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Cancelación de amistad correcta');
    });

    it('debería permitir rechazar solicitud de amistad', async () => {
        { // enviar solicitud
            const amorVerdadero = {
                idDestino: "pigdemon"
            };
            const response = await request
                .post('/amistad')
                .send(amorVerdadero)
                .set('Authorization', `${authTokenPerro}`) // Incluye el token de acceso en la cabecera
                .set('Accept', 'application/json');
    
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('message', 'Creación de amistad correcta');
        }
        const response = await request
            .delete('/amistad/perro_sanxe')
            .set('Authorization', `${authTokenPig}`) // Incluye el token de acceso en la cabecera
            .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Cancelación de amistad correcta');
    });

    it('debería permitir crear amistad', async () => {
        { // enviar solicitud
            const amorVerdadero = {
                idDestino: "pigdemon"
            };
            const response = await request
                .post('/amistad')
                .send(amorVerdadero)
                .set('Authorization', `${authTokenPerro}`) // Incluye el token de acceso en la cabecera
                .set('Accept', 'application/json');
    
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('message', 'Creación de amistad correcta');
        }
        // aceptar solicitud
        const amorVerdadero = {
            idDestino: "perro_sanxe"
        };
        const response = await request
            .post('/amistad')
            .send(amorVerdadero)
            .set('Authorization', `${authTokenPig}`) // Incluye el token de acceso en la cabecera
            .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Creación de amistad correcta');
    });

    it('debería fallar enviar solicitud a amistad', async () => {
        const amorVerdadero = {
            idDestino: "pigdemon"
        };
        const response = await request
            .post('/amistad')
            .send(amorVerdadero)
            .set('Authorization', `${authTokenPerro}`) // Incluye el token de acceso en la cabecera
            .set('Accept', 'application/json');

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message', 'Error al crear amistad');
    });

    it('debería permitir borrar amistad', async () => {
        const response = await request
            .delete('/amistad/perro_sanxe')
            .set('Authorization', `${authTokenPig}`) // Incluye el token de acceso en la cabecera
            .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Cancelación de amistad correcta');
    });

    it('debería fallar cancelar amistad inexistente', async () => {
        const response = await request
            .delete('/amistad/perro_sanxe')
            .set('Authorization', `${authTokenPig}`) // Incluye el token de acceso en la cabecera
            .set('Accept', 'application/json');

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message', 'Error al cancelar amistad');
    });
});

