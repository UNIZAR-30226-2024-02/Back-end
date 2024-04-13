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

describe('GestionSkins', () => {
    it('debería funcionar listar skins en propiedad para usuario nuevo', async () => {
        const response = await request
            .get('/misSkins/enPropiedad')
            .set('Authorization', `${authTokenPerro}`) // Incluye el token de acceso en el encabezado
            .set('Accept', 'application/json');

            expect(response.status).toBe(201);
    });

    it('debería funcionar listar skins equipadas para usuario nuevo', async () => {
        const response = await request
            .get('/misSkins/equipadas')
            .set('Authorization', `${authTokenPerro}`) // Incluye el token de acceso en el encabezado
            .set('Accept', 'application/json');

            expect(response.status).toBe(201);
    });

    it('debería funcionar equipar una nueva skin que no venía por defecto pero que es propiedad del user', async () => {
        const user = await Usuario.findOne({idUsuario: "perro_sanxe"})
        user.puntos = 10000; // le doy dinero para que pueda comprar una skin de prueba
        await user.save()
        const peticionCompra = {idSkin : 'exampleSkin762'} // esto indirectamente prueba parte de la tienda  (compra de 1 skin que existe)
        const response1 = await request
            .post('/tienda/comprar')
            .send(peticionCompra)
            .set('Authorization', `${authTokenPerro}`)
            .set('Accept', 'application/json');
        expect(response1.status).toBe(200);

        const peticion = {skinAEquipar: 'exampleSkin762'}
        const response = await request
            .post('/misSkins/equipar')
            .send(peticion)
            .set('Authorization', `${authTokenPerro}`)
            .set('Accept', 'application/json');

            expect(response.status).toBe(201);
    });

    it('debería aparecer la nueva skin entre las equipadas y las en propiedad del usuario', async () => {

        const response = await request
          .get('/misSkins/equipadas')
          .set('Authorization', `${authTokenPerro}`)
          .set('Accept', 'application/json');
        
        expect(response.status).toBe(201);
        
        const equipadas = response.body;
        const contieneSkin = equipadas.avatar.idSkin === 'exampleSkin762'; // se que es de tipo avatar
        
        expect(contieneSkin).toBe(true);

        const response2 = await request
        .get('/misSkins/enPropiedad')
        .set('Authorization', `${authTokenPerro}`)
        .set('Accept', 'application/json');
      
      expect(response2.status).toBe(201);
      const enPropiedad = response2.body; 
      const existeSkinDeseada = enPropiedad.some(e => e.idSkin === 'exampleSkin762');

      expect(existeSkinDeseada).toBe(true);
    });

    it('debería fallar equipar una nueva skin que no tiene comprada el usuario', async () => {
        const peticion = {skinAEquipar: 'exampleSkin764875164852'}
        const response = await request
            .post('/misSkins/equipar')
            .send(peticion)
            .set('Authorization', `${authTokenPerro}`)
            .set('Accept', 'application/json');

            expect(response.status).toBe(400);
    });
});

describe('GET /obtenerAvatar/:id', () => {
  
    it('should return 400 if an error occurs', async () => {
  
      const response = await request
        .get('/misSkins/obtenerAvatar/123')
        .set('Authorization', `${authTokenPerro}`)
        .set('Accept', 'application/json');
  
      expect(response.status).toBe(400);
    });
  
    it('should return 201 and the avatar if successful', async () => {
  
      const response = await request
        .get('/misSkins/obtenerAvatar/perro_sanxe')
        .set('Authorization', `${authTokenPerro}`)
        .set('Accept', 'application/json');
  
      expect(response.status).toBe(201);
      const skin = response.body.idSkin;
      expect(skin).toEqual('exampleSkin762');
    });
  });