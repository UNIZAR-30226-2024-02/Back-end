const supertest = require('supertest');
const { app, startApp, close } = require('../app');
const Usuario = require('../models/Usuario'); 
const { Partida } = require('../models/Partida');
const request = supertest(app);

let nombrePartida = 'Partidilla';



let id1 = 'tomas';
let pass1 = 'passTomas'
let mail1 = 'tomas@gmail.com'
let token1;

let id2 = 'juan';
let pass2 = 'passJuan'
let mail2 = 'juan@gmail.com'
let token2;

let id3 = 'martin'
let pass3 = 'passMartin'
let mail3 = 'martin@gmail.com'
let token3;

let partidaOID;

// Partida con 3 jugadores en el turno del jugador 3 fase 0
// El jugador 1 tiene todos los territorios menos 2 y todas las cartas
// Los jugadores son en orden son tomas, juan y martin
const filepath = './test/estados/partida1.json';
const leerJson = require('../test/estados/leerJson.js');

beforeAll(async () => {
    await startApp();

    let response

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

    rawPartida = await leerJson(filepath);
    console.log(rawPartida);
    partida = new Partida(rawPartida);
    await partida.save();
    partidaOID = partida._id;

},100000)


it('Calcular auxTropas y utilizar cartas', async () => {
    // Comprobar que estamos en la ultima fase del utlimo turno
    partida = await getEstadoPartida(partidaOID, token1);
    expect(partida.turno).toBe(2);
    expect(partida.fase).toBe(3);

    // CASO INCORRECTO: utilizar cartas fuera de turno
    datos = {
        idPartida: partidaOID,
        user: id1,
        carta1: partida.jugadores[0].cartas[1].territorio,
        carta2: partida.jugadores[0].cartas[2].territorio,
        carta3: partida.jugadores[0].cartas[3].territorio,
    }
    response = await request
        .put('/partida/utilizarCartas')
        .send(datos)
        .set('Authorization', `${token1}`)
        .set('Accept', 'application/json')
    expect(response.status).toBe(500);

    // Terminamos el turno del jugador 3
    datos = {
        idPartida: partidaOID,
        user: id3
    }
    response = await request
        .put('/partida/siguienteFase')
        .send(datos)
        .set('Authorization', `${token3}`)
        .set('Accept', 'application/json')
    expect(response.status).toBe(200)

    // Leer y hacer comprobaciones sobre el estado acutal
    partida = await getEstadoPartida(partidaOID, token1);
    console.log(partida.auxColocar);
    expect(partida.turno).toBe(0); // Turno del jugador 1
    expect(partida.fase).toBe(0); // Fase de colocar
    // Comprobamos el numero de refuerzos para todos los territorios menos peru y 
    // venezuela 3 + 10 + 5 + 5 + 3 + 7 + 2 = 35
    expect(partida.auxColocar).toBe(35); // Fase de colocar

    partida = await getEstadoPartida(partidaOID, token1);
    expect(partida.auxColocar).toBe(35);


    // CASO INCORRECTO: utilizar cartas que no se tienen
    datos = {
        idPartida: partidaOID,
        user: id1,
        carta1: 'VENEZUELA',
    }
    response = await request
        .put('/partida/utilizarCartas')
        .send(datos)
        .set('Authorization', `${token1}`)
        .set('Accept', 'application/json')
    expect(response.status).toBe(500);

    partida = await getEstadoPartida(partidaOID, token1);
    expect(partida.auxColocar).toBe(35);

    tropasEsperadas = partida.auxColocar + partida.jugadores[0].cartas[0].estrellas

    // CASO CORRECTO
    datos = {
        idPartida: partidaOID,
        user: id1,
        carta1: partida.jugadores[0].cartas[0].territorio,
    }
    response = await request
        .put('/partida/utilizarCartas')
        .send(datos)
        .set('Authorization', `${token1}`)
        .set('Accept', 'application/json')
    expect(response.status).toBe(200);


    partida = await getEstadoPartida(partidaOID, token1);

    expect(partida.auxColocar).toBe(tropasEsperadas);
    expect(partida.jugadores[0].cartas.length).toBe(41);
    expect(partida.descartes.length).toBe(1);


}, 10000)

afterAll((done) => {
    close().then(() => done());
});



// --- Funciones auxiliares para los tests ---
async function getEstadoPartida(partidaOID, token) {
    datos = {
        idPartida: partidaOID,
    }

    response = await request
        .put('/partida/getPartida')
        .send(datos)
        .set('Authorization', `${token}`)
        .set('Accept', 'application/json')
    expect(response.status).toBe(200)

    return response.body.partida;
}


// Para buscar un territorio en el mapa dado su nombre
async function buscarTerritorio(partida, nombreTerritorio) {
    // Recorrer cada continente
    for (let continente of partida.mapa) {
        // Busca el territorio por su nombre en los territorios del continente actual
        const territorioEncontrado = continente.territorios.find(territorio => territorio.nombre === nombreTerritorio);

        // Si se encuentra el territorio devolverlo
        if (territorioEncontrado) {
            return territorioEncontrado;
        }
    }

    // Si no se encuentra el territorio devolver null
    return null;
}

async function getTropasTerritorio(partida, nombreTerritorio) {
    let territorio = await buscarTerritorio(partida, nombreTerritorio);
    console.log("Territorio devuelto por buscar")
    console.log(territorio)
    if(territorio){
        return territorio.tropas;
    } else {
        return -1;
    }
}

// Para comprobar si un territorio pertenece al jugador
async function perteneceTerritorio(partida, numJugador, nombreTerritorio) { 
    let jugador = partida.jugadores[numJugador];
    if(jugador.territorios.includes(nombreTerritorio)){
        return true;
    }
    return false
};

// Para buscar los territorios fronterizos al jugador pero que no le pertenecen
async function territoriosFronterizosNoPropios(partida, numJugador) {
    const territoriosFronterizosNoPropios = [];

    // Obtener los territorios pertenecientes al jugador
    const territoriosJugador = partida.jugadores[numJugador].territorios;

    // Recorrer los territorios del jugador
    for (let territorioNombre of territoriosJugador) {
        // Buscar el territorio por su nombre
        const territorio = await buscarTerritorio(partida, territorioNombre);

        if (territorio) {
            // Recorrer las fronteras del territorio
            for (let fronteraNombre of territorio.frontera) {
                // Verificar si la frontera pertenece al jugador pero no le pertenece
                if (await perteneceTerritorio(partida, numJugador, fronteraNombre) && !territoriosJugador.includes(fronteraNombre)) {
                    territoriosFronterizosNoPropios.push(fronteraNombre);
                }
            }
        }
    }

    return territoriosFronterizosNoPropios;
}



async function territoriosAtacanteDefensor(partida, numJugador) {
    const paresTerritorios = [];

    // Obtener los territorios pertenecientes al jugador
    const territoriosJugador = partida.jugadores[numJugador].territorios;
    //console.log("Los territorios del jugador son estos")
    //console.log(territoriosJugador)
    // Recorrer los territorios del jugador
    for (let territorioNombre of territoriosJugador) {
        // Buscar el territorio por su nombre
        const territorio = await buscarTerritorio(partida, territorioNombre);
        //console.log("Territorio encontrado es esto")
        //console.log(territorio)
        if (territorio) {
            // Recorrer las fronteras del territorio
            for (let fronteraNombre of territorio.frontera) {
                //console.log("Nombre territorio fronterizo este")
                //console.log(fronteraNombre)
                // Verificar si la frontera pertenece al jugador pero no le pertenece
                const pertenece = await perteneceTerritorio(partida, numJugador, fronteraNombre);
                //console.log("Pertenece")
                //console.log(pertenece)
                const tropas = territorio.tropas;
                console.log("Tropas")
                console.log(tropas)
                if (!pertenece && tropas > 1) {
                    paresTerritorios.push([territorioNombre, fronteraNombre]);
                }
            }
        }
    }

    return paresTerritorios;
}