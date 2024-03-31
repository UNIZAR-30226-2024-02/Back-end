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

// Invita al usuario a la partida
async function invite(user, idPartida) {
  try {
    partida = await Partida.findById(idPartida)
    if (!partida) {
      console.log('La partida no existe.')
      return false
    }

    // usuario existe? no es sí mismo?

    if (partida.jugadores.includes(user)) {
      console.log('Ya está en esta partida.')
      return false
    }

    if (user.invitaciones.includes(idPartida)) {
      console.log('Ya está invitado a esa partida.')
      return false
    }

    user.invitados.push(idPartida)
    await partida.save()

    return true
  } catch (error) {
    console.error("Error al unir a partida:", error)
    throw error;
  }
}

// Une el usuario a la partida
async function join(user, idPartida, password) {
  try {
    var usuarioUnir = await Usuario.findOne({ idUsuario: user })

    partida = await Partida.findById(idPartida)
    if (!partida) {
      console.log('La partida no existe.')

      // Eliminar la invitación si la partida no existe.
      var index = usuarioUnir.invitaciones.indexOf(idDestino)
      usuarioUnir.invitaciones.splice(index, 1)
      await usuarioUnir.save()

      return false
    }

    // COMPROBAR SI LA PARTIDA ESTÁ EMPEZADA?

    if (partida.jugadores.length >= 8) { // número mágico, falta la declaración de constantes
      console.log('La partida está llena.')
      return false
    }

    if (partida.jugadores.includes(user)) {
      console.log('Ya estás en esta partida.')
      return false
    }

    if (usuarioUnir.invitaciones.includes(idPartida)) {
      // Eliminar la invitación.
      var index = usuarioUnir.invitaciones.indexOf(idDestino)
      usuarioUnir.invitaciones.splice(index, 1)
      await usuarioUnir.save()

      partida.jugadores.push(user)
      await partida.save()
      return true
    }

    if (partida.password && partida.password != password) { // Si tiene contraseña, deben coincidir. Si le pasas una contraseña cuando es pública, no la comprueba.
      console.log('Contraseña incorrecta.')
      return false
    }

    partida.jugadores.push(user)
    await partida.save()

    return true
  } catch (error) {
    console.error("Error al unir a partida:", error)
    throw error;
  }
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

// Obtiene las partidas terminadas por usuario
async function getHistorico(user) {
  try {
    // Query arrays: https://www.mongodb.com/docs/manual/tutorial/query-array-of-documents/
    // Query operators: https://www.mongodb.com/docs/manual/reference/operator/query/
    const historico = await Partida.find({ terminada: true, "jugadores.usuario": { $eq: user } })

    return historico
  } catch (error) {
    console.error("Error al obtener partidas disponibles:", error)
    throw error
  }
}

module.exports = {
  crearPartida, 
  getPartidasDisponibles,
  getHistorico,
  invite,
  join
};