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

    // Iniciar Partida
    credenciales = {
        idPartida: partidaOID,
        user: user1
    }

    response = await request
        .put('/partida/iniciarPartida')
        .send(credenciales)
        .set('Authorization', `${token1}`)
        .set('Accept', 'application/json')
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('message', 'Partida iniciada')
})


it('Colocar tropas y pasar de fase', async () => {
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
    partida = await getEstadoPartida(partidaOID, tokenJ1);

    // Comprobar que auxColocar es 0
    expect(partida.auxColocar).toBe(0)

    // Leer el numero nuevo de tropas
    for (const continente of partida.mapa) {
        const territorioEncontrado = continente.territorios.find(territorio => territorio.nombre === partida.jugadores[0].territorios[0]);
        if (territorioEncontrado) {
            newTropas = territorioEncontrado.tropas;
            break;
        }
    }


    
    // Comprobar que se han colocado las tropas
    expect(newTropas).toBe(oldTropas + oldAuxColocar)


    // Pasar a fase de ataque
    datos = {
        idPartida: partidaOID,
        user: id1
    }
    response = await request
        .put('/partida/siguienteFase')
        .send(datos)
        .set('Authorization', `${tokenJ1}`)
        .set('Accept', 'application/json')
    expect(response.status).toBe(200)

    paresAtacanteDefensor = await territoriosAtacanteDefensor(partida, 0);
    expect(paresAtacanteDefensor.length).not.toBe(undefined)
    let [atacante, defensor] = paresAtacanteDefensor[0]

    console.log("Territorios jugador")
    console.log(partida.jugadores[0].territorios)
    console.log("Territorios atacante y defensor")
    console.log(atacante)
    console.log(defensor)

    // Atacar
    datos = {
        idPartida: partidaOID,
        territorioAtacante: atacante,
        territorioDefensor: defensor,
        numTropas: 1
    }
    response = await request
        .put('/partida/atacarTerritorio')
        .send(datos)
        .set('Authorization', `${tokenJ1}`)
        .set('Accept', 'application/json')
    console.log(response.error)
    expect(response.status).toBe(200)


    // pasar a maniobrar
    response = await request
        .put('/partida/siguienteFase')
        .send(datos)
        .set('Authorization', `${tokenJ1}`)
        .set('Accept', 'application/json')
    console.log(response.error)
    expect(response.status).toBe(200)

    // pasar a Fin
    response = await request
        .put('/partida/siguienteFase')
        .send(datos)
        .set('Authorization', `${tokenJ1}`)
        .set('Accept', 'application/json')
    expect(response.status).toBe(200)

    // Fin de turno
    response = await request
        .put('/partida/siguienteFase')
        .send(datos)
        .set('Authorization', `${tokenJ1}`)
        .set('Accept', 'application/json')
    expect(response.status).toBe(200)
    
    // Leer estado de la partida
    response = await request
        .put('/partida/getPartida')
        .send(datos)
        .set('Authorization', `${tokenJ1}`)
        .set('Accept', 'application/json')
    expect(response.status).toBe(200)

    partida = response.body.partida;

    //Turno del siguiente jugador
    expect(partida.turno).toBe(1);

    // Deberia dar error
    //response = await request
    //    .put('/partida/siguienteFase')
    //    .send(datos)
    //    .set('Authorization', `${tokenJ1}`)
    //    .set('Accept', 'application/json')
    //expect(response.status).toBe(500)
})

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