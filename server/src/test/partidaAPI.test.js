const supertest = require('supertest');
const { app, startApp, close } = require('../app');
const Usuario = require('../models/Usuario'); 
const { Partida } = require('../models/Partida'); 
const Chat = require('../models/Chat')

const request = supertest(app);

let nombrePartida = 'Partidilla';

let id1 = 'juan';
let pass1 = 'passJuan'
let mail1 = 'juan@gmail.com'
let token1;

let id2 = 'tomas';
let pass2 = 'passTomas'
let mail2 = 'tomas@gmail.com'
let token2;

let id3 = 'martin'
let pass3 = 'passMartin'
let mail3 = 'martin@gmail.com'
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

    response = await request
        .post('/register')
        .send(user1)
        .set('Accept', 'application/json');
    console.log(response)
    expect(response.status).toBe(201);
    // --- Registro usuario 2 ---
    user2 = {
        idUsuario: id2,
        password: pass2,
        correo: mail2
    }

    response = await request
        .post('/register')
        .send(user2)
        .set('Accept', 'application/json');
    expect(response.status).toBe(201);

    // --- Registro usuario 3 ---
    user3 = {
        idUsuario: id3,
        password: pass3,
        correo: mail3
    }

    response = await request
        .post('/register')
        .send(user3)
        .set('Accept', 'application/json');
        console.log(response.error)
    expect(response.status).toBe(201);


    // ---  Inicio sesion Usuario 1 ---
    user1 = {
        id: id1,
        password: pass1
    };

    response = await request
        .post('/login')
        .send(user1)
        .set('Accept', 'application/json');
    expect(response.status).toBe(200);

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
        expect(response.status).toBe(200);

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
        expect(response.status).toBe(200);

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
        .set('Authorization', `${token1}`)
        .set('Accept', 'application/json');
        expect(response.status).toBe(200)

    partidaOID = response.body.idPartida;

    // --- Unir a los otros 2 jugadores a la partida ---
    credenciales = {
        idPartida: partidaOID,
        password: null
    }

    response = await request
        .put('/nuevaPartida/join')
        .send(credenciales)
        .set('Authorization', `${token2}`)
        .set('Accept', 'application/json')
    expect(response.status).toBe(200)

    response = await request
        .put('/nuevaPartida/join')
        .send(credenciales)
        .set('Authorization', `${token3}`)
        .set('Accept', 'application/json')
    expect(response.status).toBe(200)
})



it('Inicializar Estado', async () => {
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


it('Primera Ronda', async () => {
    // Leer el estado de la partida
    credenciales = {
        idPartida: partidaOID
    }

    response = await request
        .put('/partida/getPartida')
        .send(credenciales)
        .set('Authorization', `${token1}`)
        .set('Accept', 'application/json')
    expect(response.status).toBe(200)

    partida = response.body.partida;

    // EMPIEZA EL JUGADOR 1
    // Para saber quien es el jugador 1
    if(partida.jugadores[0].usuario == "juan"){
        tokenJ1 = token1;
    } else if(partida.jugadores[0].usuario == "tomas") {
        tokenJ1 = token2;
    } else if(partida.jugadores[0].usuario == "martin") {
        tokenJ1 = token3;
    }

    // colocar refuerzos, todos los refuerzos en el primer territorio
    // Primero leer las tropas que tiene ese territorio
    for (const continente of partida.mapa) {
        const territorioEncontrado = continente.territorios.find(territorio => territorio.nombre === partida.jugadores[0].territorios[0]);
        if (territorioEncontrado) {
            oldTropas = territorioEncontrado.tropas;
            break;
        }
    }

    oldAuxColocar = partida.auxColocar;

    datos = {
        idPartida: partidaOID,
        territorio: partida.jugadores[0].territorios[0],
        numTropas: partida.auxColocar
    }
    response = await request
        .put('/partida/colocarTropas')
        .send(datos)
        .set('Authorization', `${tokenJ1}`)
        .set('Accept', 'application/json')
    expect(response.status).toBe(200)

    // Leer otra vez el estado de la partida
    credenciales = {
        idPartida: partidaOID,
        user: id1
    }

    response = await request
        .put('/partida/getPartida')
        .send(credenciales)
        .set('Authorization', `${tokenJ1}`)
        .set('Accept', 'application/json')
    expect(response.status).toBe(200)

    partida = response.body.partida;

    // Leer el numero nuevo de tropas
    for (const continente of partida.mapa) {
        const territorioEncontrado = continente.territorios.find(territorio => territorio.nombre === partida.jugadores[0].territorios[0]);
        if (territorioEncontrado) {
            newTropas = territorioEncontrado.tropas;
            break;
        }
    }

    // Comprobar que auxColocar es 0
    expect(partida.auxColocar).toBe(0)
    
    // Comprobar que se han colocado las tropas
    expect(newTropas).toBe(oldTropas + oldAuxColocar)

    


})

afterAll((done) => {
    close().then(() => done());
});