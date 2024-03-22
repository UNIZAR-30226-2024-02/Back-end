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

async function iniciarPartida(nombrePartida, password) {
    try {
        const partida = await Partida.findOne({ nombre: nombrePartida, password: password });
        if (!partida) {
            throw new Error('La partida no existe.');
        }
        if (partida.iniciada) {
            throw new Error('La partida ya ha sido iniciada.');
        }
        if (partida.terminada) {
            throw new Error('La partida ya ha terminado.');
        }
        if (partida.jugadores.length < 2) {
            throw new Error('La partida necesita al menos 2 jugadores para comenzar.');
        }
        if (partida.jugadores.length > 5) {
            throw new Error('La partida no puede tener más de 5 jugadores.');
        }
        partida.iniciada = true;
        await partida.save();
        // Inicializar la partida
        return true;
      } catch (error) {
        console.error('Error al iniciar la partida:', error);
        throw error;
      }
}

module.exports = {
    crearPartida, 
    getPartidasDisponibles,
    iniciarPartida
};