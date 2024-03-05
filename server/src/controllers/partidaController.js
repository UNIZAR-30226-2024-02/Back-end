const {Partida, Jugador} = require('../models/Partida');
const Usuario = require('../models/Usuario');


// privacidad --> boolean 1 privada 0 pública
// user -> Usuario que crea la partida (su nombre)
// num -> Número mínimo/máximo de usuarios
// nombre -> nombre de la partida
// password -> contraseña de la partida, en caso de ser privada
async function crearPartida(privacidad, user, num, nombre, password) {
    console.log(privacidad, user, num, nombre, password)
    fechaInicio = new Date(); // se supone q esto coge la fecha actual
    const jugador = await Usuario.findOne({
        $or: [
          { idUsuario: user },
          { correo: user }
        ]
      });
    const jugadorEjemplo = new Jugador({
        usuario: {
          type: jugador._id, // Asegúrate de que sea un ObjectId válido
          ref: 'Usuario'
        },
        turno: 1
      });
    
    console.log(jugadorEjemplo)
    console.log("A")
    const jugadores = [jugadorEjemplo];
    const nuevaPartida = new Partida({ nombre: nombre, 
                                       iniciada: false, 
                                       terminada: false,
                                       fechaInicio: fechaInicio,
                                       fechaFin: null,
                                       publica: !privacidad,
                                       password: password, // si me llega null saldra null y ya
                                       jugadores: jugadores
                                       //resto null
                                       }); 

    // Si existe una partida con el mismo nombre y la misma password, que no haya terminado -> no podremos crearla (?)
    const partidaExistente = await Partida.findOne({ nombre: nombre, terminada: false });
    if(partidaExistente)
        return false
    await nuevaPartida.save()
    return true
}


// Devuelve las partidas públicas que no han empezado ni terminado
// (es decir, están en espera de jugadores)
async function getPartidasDisponibles() {
    try {
        const partidasDisponibles = await Partida.find({ iniciada: false, terminada: false, publica: true });

        return partidasDisponibles;
    } catch (error) {
        console.error("Error al obtener partidas disponibles:", error);
        throw error;
    }
}

module.exports = {
    crearPartida, 
    getPartidasDisponibles
};