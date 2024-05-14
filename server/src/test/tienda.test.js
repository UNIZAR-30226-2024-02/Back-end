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

describe('Tienda', () => {
    it('should list skins sorted by precio, filtered by precioMin, precioMax, and tipo avatar', async () => {
        const response = await request
            .post('/tienda')
            .set('Authorization', `${authTokenPerro}`)
            .send({
                sortBy: 'precio',
                precioMin: 10,
                precioMax: 1000,
                tipo: 'avatar'
            });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        response.body.forEach(skin => {
            expect(skin.precio).toBeGreaterThanOrEqual(10);
            expect(skin.precio).toBeLessThanOrEqual(1000);
            expect(skin.tipo).toBe('Avatar');
        });

        // check if the skins are sorted by precio
        for (let i = 0; i < response.body.length - 1; i++) {
            expect(response.body[i].precio).toBeLessThanOrEqual(response.body[i + 1].precio);
        }
    });
    it('should list skins sorted by precio, filtered by precioMin, precioMax, and tipo SetFichas', async () => {
        const response = await request
            .post('/tienda')
            .set('Authorization', `${authTokenPerro}`)
            .send({
                sortBy: 'precio',
                precioMin: 10,
                precioMax: 1000,
                tipo: 'SetFichas'
            });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        response.body.forEach(skin => {
            expect(skin.precio).toBeGreaterThanOrEqual(10);
            expect(skin.precio).toBeLessThanOrEqual(1000);
            expect(skin.tipo).toBe('SetFichas');
        });

        // check if the skins are sorted by precio
        for (let i = 0; i < response.body.length - 1; i++) {
            expect(response.body[i].precio).toBeLessThanOrEqual(response.body[i + 1].precio);
        }
    });

    it('should list skins sorted by precio, filtered by precioMin, precioMax, and tipo Terreno', async () => {
        const response = await request
            .post('/tienda')
            .set('Authorization', `${authTokenPerro}`)
            .send({
                sortBy: 'precio',
                precioMin: 10,
                precioMax: 1000,
                tipo: 'Terreno'
            });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        response.body.forEach(skin => {
            expect(skin.precio).toBeGreaterThanOrEqual(10);
            expect(skin.precio).toBeLessThanOrEqual(1000);
            expect(skin.tipo).toBe('Terreno');
        });

        // check if the skins are sorted by precio
        for (let i = 0; i < response.body.length - 1; i++) {
            expect(response.body[i].precio).toBeLessThanOrEqual(response.body[i + 1].precio);
        }
    });

    it('should allow a user to buy a skin and equip it', async () => {
        const user = await Usuario.findOne({ idUsuario: "perro_sanxe" });
        const response = await request
            .post('/tienda/comprar')
            .send({ idSkin: "Soldado WW2" })
            .set('Authorization', `${authTokenPerro}`)
            .set('Accept', 'application/json');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('mensaje', 'Skin adquirida correctamente!');

        // check if the user's points have been decremented by the price of the skin.
        const updatedUser = await Usuario.findOne({ idUsuario: "perro_sanxe" });
        expect(updatedUser.puntos).toBe(user.puntos - 10); // 10 is skins price

        // check if the skin is equipped
        expect(updatedUser.skins).toContain("Soldado WW2");
    });

    it('should return an error when trying to buy a non-existent skin', async () => {
        const response = await request
            .post('/tienda/comprar')
            .send({ idSkin: "nonExistentSkin" })
            .set('Authorization', `${authTokenPerro}`)
            .set('Accept', 'application/json');

        expect(response.status).toBe(400);
    });

    it('should return an error when trying to buy a skin the user already has', async () => {
        const response = await request
            .post('/tienda/comprar')
            .send({ idSkin: "exampleSkin787878" })
            .set('Authorization', `${authTokenPerro}`)
            .set('Accept', 'application/json');

        expect(response.status).toBe(400);
    });

    it('should return an error when trying to buy a skin that is more expensive than the user\'s points', async () => {
        const response = await request
            .post('/tienda/comprar')
            .send({ idSkin: "exampleSkin787878" })
            .set('Authorization', `${authTokenPig}`)
            .set('Accept', 'application/json');

        expect(response.status).toBe(400);
    });

    it('should return the user money when the token is valid', async () => {

        const res = await request
            .get('/tienda/dineroUser')
            .set('Authorization', `${authTokenPig}`)
            .set('Accept', 'application/json');

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({ dinero: 0 });
    });

});