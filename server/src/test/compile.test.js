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
describe('Prueba inicial', () => {
    it('debería responder correctamente en la ruta principal', async () => {
        const response = await request.get('/');
        expect(response.status).toBe(200);
        expect(response.text).toBe('Todo funciona bien');
    });
});

describe('Registro de usuario y posterior login', () => {
    // Elimina el usuario existente si existe
    const perro = {
        idUsuario: 'perro_sanxe',
        password: 'soy_traidor_lovePigdemon',
        correo: 'perro@psoe.es',
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
        console.log(authTokenPerro)
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
        console.log(authTokenPig)
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

describe('Tienda', () => {
    
});

describe('Chat', () => {
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