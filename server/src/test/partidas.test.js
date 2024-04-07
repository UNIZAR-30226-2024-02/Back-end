const supertest = require('supertest');
const { app, startApp, close } = require('../app');
const Usuario = require('../models/Usuario'); 
const { Partida } = require('../models/Partida'); 
const Chat = require('../models/Chat')

const request = supertest(app);

let authTokenPerro;
let authTokenPig;
let nombrePartida;
let partidaPublica;
let partidaPrivada;

beforeAll(async () => {
    await startApp();
    nombrePartida = 'amnistia';
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


describe('Creación de partidas', () => {
    it('debería permitir crear una nueva partida pública', async () => {
        const existente = await Partida.findOne({nombre: nombrePartida});
        if(existente) await Partida.deleteMany({nombre: nombrePartida}); // Borro la partida si ya existe

        const partida = {
            nombre: nombrePartida,
            password: null,
            numJugadores: 4
        };
        const response = await request
            .post('/nuevaPartida')
            .send(partida)
            .set('Authorization', `${authTokenPerro}`) // Incluye el token de acceso en la cabecera
            .set('Accept', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Partida creada correctamente');
            expect(response.body).toHaveProperty('idPartida');
            partidaPublica = response.body.idPartida;
    });

    it('debería fallar crear una nueva partida ya existente', async () => {
        const partida = {
            nombre: nombrePartida,
            password: null,
            numJugadores: 4
        };

        const response = await request
            .post('/nuevaPartida')
            .send(partida)
            .set('Authorization', `${authTokenPerro}`) // Incluye el token de acceso en la cabecera
            .set('Accept', 'application/json');

            expect(response.status).toBe(400);
    });

    it('debería estar la nueva partida entre las listadas', async () => {
        const partida = {
            nombre: nombrePartida,
            password: null,
            numJugadores: 4
        };

        const response = await request
            .get('/partidas')
            .set('Authorization', `${authTokenPerro}`) // Incluye el token de acceso en la cabecera
            .set('Accept', 'application/json');

        expect(response.status).toBe(200);
        const partidas = response.body;
        const contienePartida = partidas.some(partidaEnLista => { // busco que esté la nueva partida en las listadas
            return partidaEnLista.nombre === partida.nombre;
        });

        expect(contienePartida).toBe(true);
    });

});

describe('Unir a partidas', () => {
    it('debería fallar unirse a una partida en la que estás', async () => {
        const credenciales = {
            idPartida: partidaPublica,
            password: null
        };
        const response = await request
            .put('/nuevaPartida/join')
            .send(credenciales)
            .set('Authorization', `${authTokenPerro}`) // Incluye el token de acceso en la cabecera
            .set('Accept', 'application/json')
        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('message', 'Error uniendo')
    })

    it('debería permitir unirse a una partida pública', async () => {
        const credenciales = {
            idPartida: partidaPublica,
            password: "debería funcionar incluso con password"
        };
        const response = await request
            .put('/nuevaPartida/join')
            .send(credenciales)
            .set('Authorization', `${authTokenPig}`) // Incluye el token de acceso en la cabecera
            .set('Accept', 'application/json')
        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('message', 'Unido correctamente')
    })

    // TODO: debería fallar unirse a una partida empezada?

    it('debería fallar unirse a una partida no existente', async () => {
        await Partida.deleteMany({nombre: nombrePartida})
        const credenciales = {
            idPartida: partidaPublica,
            password: null
        };
        const response = await request
            .put('/nuevaPartida/join')
            .send(credenciales)
            .set('Authorization', `${authTokenPerro}`) // Incluye el token de acceso en la cabecera
            .set('Accept', 'application/json')
        expect(response.status).toBe(400)
    })

    it('debería fallar unirse a una partida llena', async () => {
        const partida = {
            nombre: nombrePartida,
            password: null,
            numJugadores: 1
        };
        const created = await request
            .post('/nuevaPartida')
            .send(partida)
            .set('Authorization', `${authTokenPerro}`) // Incluye el token de acceso en la cabecera
            .set('Accept', 'application/json')

            expect(created.status).toBe(200)
            expect(created.body).toHaveProperty('message', 'Partida creada correctamente')
            expect(created.body).toHaveProperty('idPartida')

        const credenciales = {
            idPartida: created.body.idPartida,
            password: null
        };
        const joined = await request
            .put('/nuevaPartida/join')
            .send(credenciales)
            .set('Authorization', `${authTokenPig}`) // Incluye el token de acceso en la cabecera
            .set('Accept', 'application/json');
        expect(joined.status).toBe(400)
    })

    it('debería fallar unirse a una partida privada con contraseña incorrecta', async () => {
        await Partida.deleteMany({nombre: nombrePartida})
        const partida = {
            nombre: nombrePartida,
            password: "soy española y me gusta el jamón", // impresionante contraseña de copilot
            numJugadores: 2
        };
        const created = await request
            .post('/nuevaPartida')
            .send(partida)
            .set('Authorization', `${authTokenPerro}`) // Incluye el token de acceso en la cabecera
            .set('Accept', 'application/json');

            expect(created.status).toBe(200);
            expect(created.body).toHaveProperty('message', 'Partida creada correctamente');
            expect(created.body).toHaveProperty('idPartida');
            partidaPrivada = created.body.idPartida;

        const credenciales = {
            idPartida: created.body.idPartida,
            password: "soy catalán y me gusta el pan con tomate" // otra impresionante contraseña de copilot
        };
        const joined = await request
            .put('/nuevaPartida/join')
            .send(credenciales)
            .set('Authorization', `${authTokenPig}`) // Incluye el token de acceso en la cabecera
            .set('Accept', 'application/json');
        expect(joined.status).toBe(400)
    })

    it('debería fallar unirse a una partida privada sin contraseña', async () => {
        const credenciales = {
            idPartida: partidaPrivada,
            password: null
        };
        const joined = await request
            .put('/nuevaPartida/join')
            .send(credenciales)
            .set('Authorization', `${authTokenPig}`) // Incluye el token de acceso en la cabecera
            .set('Accept', 'application/json');
        expect(joined.status).toBe(400)
    })

    it('debería permitir unirse a una partida privada con la contraseña', async () => {
        const credenciales = {
            idPartida: partidaPrivada,
            password: "soy española y me gusta el jamón"
        };
        const joined = await request
            .put('/nuevaPartida/join')
            .send(credenciales)
            .set('Authorization', `${authTokenPig}`) // Incluye el token de acceso en la cabecera
            .set('Accept', 'application/json');
        expect(joined.status).toBe(200)
    })
})

describe('Invitaciones a partidas', () => {
    it('debería fallar invitar a una partida que no existe', async () => {
        const credenciales = {
            user: "pigdemon",
            idPartida: partidaPublica
        };
        const response = await request
            .put('/nuevaPartida/invite')
            .send(credenciales)
            .set('Authorization', `${authTokenPig}`) // Incluye el token de acceso en la cabecera
            .set('Accept', 'application/json');
        expect(response.status).toBe(400)
    })

    it('debería fallar invitar a un jugador de la partida', async () => {
        const credenciales = {
            user: "pigdemon",
            idPartida: partidaPrivada
        };
        const response = await request
            .put('/nuevaPartida/invite')
            .send(credenciales)
            .set('Authorization', `${authTokenPig}`) // Incluye el token de acceso en la cabecera
            .set('Accept', 'application/json');
        expect(response.status).toBe(400)
    })

    it('debería permitir invitar a un usuario', async () => {
        const usuario = await Usuario.findOne({ idUsuario: 'pigdemon' });
        if (usuario) {
            usuario.invitaciones = [];
            await usuario.save();
        }
        await Partida.deleteMany({nombre: nombrePartida})
        const partida = {
            nombre: nombrePartida,
            password: "soy española y me gusta el jamón", // impresionante contraseña de copilot
            numJugadores: 2
        };
        const created = await request
            .post('/nuevaPartida')
            .send(partida)
            .set('Authorization', `${authTokenPerro}`) // Incluye el token de acceso en la cabecera
            .set('Accept', 'application/json');

            expect(created.status).toBe(200);
            expect(created.body).toHaveProperty('message', 'Partida creada correctamente');
            expect(created.body).toHaveProperty('idPartida');
            partidaPrivada = created.body.idPartida;

        const credenciales = {
            user: "pigdemon",
            idPartida: partidaPrivada
        };
        const response = await request
            .put('/nuevaPartida/invite')
            .send(credenciales)
            .set('Authorization', `${authTokenPig}`) // Incluye el token de acceso en la cabecera
            .set('Accept', 'application/json');
        expect(response.status).toBe(200)
    })

    it('debería fallar invitar a un invitado', async () => {
        const credenciales = {
            user: "pigdemon",
            idPartida: partidaPrivada
        };
        const response = await request
            .put('/nuevaPartida/invite')
            .send(credenciales)
            .set('Authorization', `${authTokenPig}`) // Incluye el token de acceso en la cabecera
            .set('Accept', 'application/json');
        expect(response.status).toBe(400)
    })

    it('debería permitir unirse a una partida invitada sin contraseña', async () => {
        const credenciales = {
            idPartida: partidaPrivada,
            password: null
        };
        const response = await request
            .put('/nuevaPartida/join')
            .send(credenciales)
            .set('Authorization', `${authTokenPig}`) // Incluye el token de acceso en la cabecera
            .set('Accept', 'application/json')
        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('message', 'Unido correctamente')
    })

    it('debería permitir listar las partidas de un usuario', async () => {
        
        const response = await request
            .get('/partidas/invitaciones')
            .set('Authorization', `${authTokenPig}`) // Incluye el token de acceso en la cabecera
            .set('Accept', 'application/json');

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('Partidas')
        expect(response.body.Partidas).toHaveLength(1) // debería haber una partida en la lista pigdemon
    })
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