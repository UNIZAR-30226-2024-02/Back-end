const {Partida, Jugador, Territorio, Carta, Continente} = require('../models/Partida');
const { findById } = require('../models/Skin');
const Usuario = require('../models/Usuario');
const Chat = require('../models/Chat');
const  {
  calcularRefuerzos,
  actualizarTropasTerritorio,
  numJugador,
  comprobarTurno,
  comprobarTerritorio,
  inicializarEstado,
  shuffle,
  territoriosFronterizos,
  resolverBatalla,
  encontrarPropietario,
  maniobraPosible,
  tenemosGanador,
  jugadorEliminado
} = require('../logicaAuxiliar/logicaPartida');


// FASES PARTIDA
const Colocar = 0; // Aqui se pueden utilizar cartas
const Atacar = 1;
const Maniobrar = 2;
const Fin = 3; // Para utilizar cartas, si tocaba robar aun no se roba

/**
 * Crea una nueva partida.
 * @param {string} user - El ID del usuario que crea la partida.
 * @param {string} nombre - El nombre de la partida.
 * @param {string} password - La contraseña de la partida.
 * @param {number} numJugadores - El número máximo de jugadores en la partida.
 * @returns {Promise<string>} El ID de la partida creada.
 * @throws {Error} Si ya existe una partida con el mismo nombre y contraseña, o si el número de jugadores no es válido.
 */
async function crearPartida(user, nombre, password, numJugadores) {
  // Si existe una partida con el mismo nombre y la misma password, que no haya terminado -> no podrem
  const partidaExistente = await Partida.findOne({ nombre: nombre, fechaFin: null });
  console.log(partidaExistente)
  if(partidaExistente)
    return null
  if(numJugadores < 2 || numJugadores > 6)
    return null
  // Crear chat de la partida
  const chat = new Chat({ nombreChat: nombre, mensajes: [], usuarios: [user]});
  await chat.save();
  console.log(chat)
  const jugador = new Jugador({ usuario: user });
  const nuevaPartida = new Partida({ nombre: nombre,
                                     fechaInicio: null,
                                     fechaFin: null,
                                     password: password, // si me llega null saldra null y ya.
                                     jugadores: [jugador],
                                     maxJugadores: numJugadores, 
                                     ganador: null,
                                     chat: chat
                                    });

  await nuevaPartida.save()
  return nuevaPartida._id
}

/**
 * Invita a un usuario a una partida.
 * @param {string} user - El ID del usuario a invitar.
 * @param {string} idPartida - El ID de la partida a la que invitar al usuario.
 * @returns {Promise<boolean>} Devuelve true si la invitación fue exitosa.
 * @throws {Error} Si la partida no existe, el usuario ya está en la partida, ya está invitado, o ocurre otro error.
 */
async function invite(user, idPartida) {
  try {
    partida = await Partida.findById(idPartida)
    if (!partida) {
      console.log('La partida no existe.')
      console.log(idPartida)
      return false
    }

    for (let jugador of partida.jugadores) {
      if (jugador.usuario === user) {
        console.log('Ya está en esta partida.')
        return false
      }
    }

    var usuarioInvitado = await Usuario.findOne({ idUsuario: user })

    if (usuarioInvitado.invitaciones.includes(idPartida)) {
      console.log('Ya está invitado a esa partida.')
      return false
    }

    usuarioInvitado.invitaciones.push(idPartida)
    await usuarioInvitado.save()

    return true
  } catch (error) {
    console.error("Error al invitar a partida:", error)
    throw error;
  }
}

/**
 * Une a un usuario a una partida.
 * @param {string} user - El ID del usuario a unir.
 * @param {string} idPartida - El ID de la partida a la que unir al usuario.
 * @param {string} password - La contraseña de la partida.
 * @returns {Promise<boolean>} Devuelve true si la unión fue exitosa.
 * @throws {Error} Si la partida no existe, ya ha comenzado, está llena, el usuario ya está en la partida, la contraseña es incorrecta, o ocurre otro error.
 */
async function join(user, idPartida, password) {
  try {
    var usuarioUnir = await Usuario.findOne({ idUsuario: user })
    partida = await Partida.findOne({nombre: idPartida, fechaInicio: null});
    if(!partida)
      partida = await Partida.findById(idPartida)
    if (!partida) {
      console.log('La partida no existe.')

      // Eliminar la invitación si la partida no existe.
      var index = usuarioUnir.invitaciones.indexOf(user)
      usuarioUnir.invitaciones.splice(index, 1)
      await usuarioUnir.save()

      return false
    }

    if (partida.fechaInicio != null) {
      console.log('La partida ya ha sido empezada.')
      return false
    }

    if (partida.jugadores.length >= partida.maxJugadores) {
      console.log('La partida está llena.')
      return false
    }

    for (let jugador of partida.jugadores) {
      if (jugador.usuario === user) {
        console.log('Ya estás en esta partida.')
        return false
      }
    }

    if (usuarioUnir.invitaciones.includes(idPartida)) {
      const jugador = new Jugador({ usuario: user })
      partida.jugadores.push(jugador)
      await partida.save()
      usuarioUnir.invitaciones.pull(idPartida)
      await usuarioUnir.save()    
      return true
    }

    if (partida.password && partida.password != password) { // Si tiene contraseña, deben coincidir. Si le pasas una contraseña cuando es pública, no la comprueba.
      console.log('Contraseña incorrecta.')
      return false
    }

    const jugador = new Jugador({ usuario: user })
    partida.jugadores.push(jugador) // Push the ID of the Jugador document
    // lo unimos al chat
    const chat = await Chat.findById(partida.chat)
    chat.usuarios.push(user)
    await chat.save()
    partida.chat = chat
    await partida.save()
    console.log(chat)

    return true
  } catch (error) {
    console.error("Error al unir a partida:", error)
    throw error;
  }
}

/**
 * Permite a un usuario salir de una partida.
 * @param {string} usuarioID - El ID del usuario que sale de la partida.
 * @param {string} partidaOID - El ID de la partida de la que sale el usuario.
 * @throws {Error} Si la partida no existe, el usuario no está en la partida, o ocurre otro error.
 */
async function salirPartida(usuarioID, partidaOID) {
  try {
    const partida = await Partida.findById(partidaOID);
    
    if (partida) {
      // Verificar si el usuario está en la partida
      console.log(usuarioID)
      let index = -1;
      for(let i = 0; i < partida.jugadores.length; i++){
        if(partida.jugadores[i].usuario == usuarioID){
          index = i;
          break;
        }
      }
      if (index !== -1) {
        // Si la partida no ha comenzado (fechaInicio es null), quitar al usuario de la partida
        if (partida.fechaInicio === null) {
          partida.jugadores.splice(index, 1);
          if(partida.jugadores.length == 0){
            const chatOID = partida.chat;
            await Chat.deleteOne({ _id: chatOID });
            partida.chat = {_id: chatOID, nombreChat: 'eliminado', mensajes: [], usuarios: []};
            await partida.save();
            await Partida.deleteOne({ _id: partidaOID });

          } else {
            await partida.save();
          }
          console.log("Usuario sacado de la partida", partida);
        } else {
          // Si la partida ha comenzado, marcar al usuario como abandonado
          const jugador = partida.jugadores[index];
          if(!jugador.abandonado){
            jugador.abandonado = true;
            // si es su turno, pasar al siguiente jugador
            if(partida.turno == index){
              partida.turno = (partida.turno + 1) % partida.jugadores.length;
              while(partida.jugadores[partida.turno].abandonado){
                partida.turno = (partida.turno + 1) % partida.jugadores.length;
              }
            }
            await partida.save();
            let cnt = 0;
            for(let player of partida.jugadores){
              if(!player.abandonado){
                break;
              } else {
                cnt++;
              }
            }
            if(cnt == partida.jugadores.length){
              partida.fechaFin = new Date();
              const chatOID = partida.chat;
              await Chat.deleteOne({ _id: chatOID });
              partida.chat = {_id: chatOID, nombreChat: 'eliminado', mensajes: [], usuarios: []};
              await partida.save();
            } let posibleGanador = await tenemosGanador(partida);
            if(posibleGanador){ // cuando reciba esto, el estado de la partida se actualizará
              // pero no avisaré al front end, simplemente guardaré en la base de datos
              // aquí es donde entra el socket -> el front end, a la vez, enviará un evento
              // que cogerán los sockets --> se enviará un mensaje a todos los jugadores, 
              // que será recibido mientras se actualiza el estado de la base de datos. 
              partida.fechaFin = new Date(); const chatOID = partida.chat;
              await Chat.deleteOne({ _id: chatOID }); partida.chat = {_id: chatOID, nombreChat: 'eliminado', mensajes: [], usuarios: []};
              partida.ganador = posibleGanador.usuario;
              await partida.save(); 
            }
            console.log("Usuario marcado como abandonado en la partida", partida);
          }
          else 
            throw new Error("El usuario ya ha abandonado la partida")
        }
      } else {
        throw new Error("El usuario no está en la partida");
      }
    } else {
      throw new Error("Partida no encontrada");
    }
  } catch (error) {
    console.error("Error al sacar al usuario de la partida", error);
    throw error;
  }
}

/**
 * Obtiene las partidas públicas que no han empezado ni terminado (es decir, están en espera de jugadores).
 * @returns {Promise<Array>} La lista de partidas disponibles.
 * @throws {Error} Si ocurre un error al obtener las partidas disponibles.
 */
async function getPartidasDisponibles() {
  try {
    const partidasDisponibles = await Partida.find({ fechaInicio: null, fechaFin: null, password: null });
    
    return partidasDisponibles;
  } catch (error) {
    console.error("Error al obtener partidas disponibles:", error);
    throw error;
  }
}

/**
 * Obtiene las partidas terminadas por usuario.
 * @param {string} user - El ID del usuario.
 * @returns {Promise<Array>} La lista de partidas terminadas por el usuario.
 * @throws {Error} Si ocurre un error al obtener las partidas terminadas.
 */
async function getHistorico(user) {
  try {
    // Query arrays: https://www.mongodb.com/docs/manual/tutorial/query-array-of-documents/
    // Query operators: https://www.mongodb.com/docs/manual/reference/operator/query/
    const historico = await Partida.find({ fechaFin: { $ne: null }, "jugadores.usuario": { $eq: user } })

    return historico
  } catch (error) {
    console.error("Error al obtener partidas disponibles:", error)
    throw error
  }
}

/**
 * Inicia una partida dado el object id de una partida (id único de la bdd).
 *
 * @param {string} partidaOID - El ID de la partida.
 * @param {string} usuarioID - El ID del usuario.
 * @returns {Promise<boolean>} Retorna true si la partida se inicia correctamente, false en caso contrario.
 * @throws {Error} Si la partida no existe o el número de jugadores es insuficiente.
 */
async function iniciarPartida(partidaOID, usuarioID) {
  try {
    const partida = await Partida.findById(partidaOID);
    if (!partida) {
      throw new MediaError("La partida no existe");

    }

    // Comprobar si el usuario esta en la partida
    jugador = numJugador(partida, usuarioID);
    if(jugador == - 1){
      return false;
    }

    if(partida.jugadores.length < 2){
      throw new Error("Numero de jugadores insuficiente");
    }

    partida.fechaInicio = new Date();

    await inicializarEstado(partida);
    partida.auxColocar = await calcularRefuerzos(partida, 0);
    await partida.save();
    console.log("Partida iniciada correctamente:", partida);
    return true;
    //console.log("Partida iniciada correctamente:", partida);
  } catch (error) {
    console.log(error.message)
    throw error;
  }
}

/**
 * Coloca tropas en un territorio durante una partida.
 *
 * @param {string} partidaOID - El ID de la partida.
 * @param {string} usuarioID - El ID del usuario.
 * @param {string} nombreTerritorio - El nombre del territorio.
 * @param {number} tropas - El número de tropas a colocar.
 * @returns {Promise<boolean>} Retorna true si las tropas se colocan correctamente, false en caso contrario.
 * @throws {Error} Si la partida no existe, está pausada, el usuario no está en la partida, no es su turno, no está en la fase de colocación de tropas, el territorio no le pertenece o no tiene suficientes refuerzos por colocar.
 */
async function colocarTropas(partidaOID, usuarioID, nombreTerritorio, tropas) {
  try {
    // Comprobar que la partida existe y leerla
    partida = await Partida.findById(partidaOID)
    if (!partida) {
      throw new Error("La partida no existe");
      return false;
    }

    if(partida.paused){
      throw new Error("La partida esta pausada");
    }

    // Comprobar si el usuario esta en la partida y obtener numero de jugador
    jugador = await numJugador(partida, usuarioID);
    if(jugador == - 1){
      throw new Error("El jugador no está presente en la partida");
    }

    // Comprobar que es el turno del jugador
    if(!await comprobarTurno(partida, jugador)){
      throw new Error("No es tu turno");
    }

    // Comprobar que la partida se encuentra en la fase de colocacion de tropas
    if(partida.fase != Colocar){
      throw new Error("El jugador no se encuentra en la fase de colocación de tropas");
      return false;
    }

    // Comprobar que el territorio pertenece al jugador
    if(!await comprobarTerritorio(partida, jugador, nombreTerritorio)){
      throw new Error("El territorio no te pertenece");
    }

    // Comprobamos la variable auxiliar auxColocar para saber cuantas
    // tropas le quedan por colocar al jugador
    if(partida.auxColocar < tropas){
      throw new Error("No te quedan suficientes refuerzos por colocar");
      return false;
    }

    // Actualizamos el numero de tropas del territorios
    await actualizarTropasTerritorio(partida, nombreTerritorio, tropas);
    await partida.save();

    return true;
  } catch (error) {
    throw new Error(error.message);
    return false;
  }
}


/**
 * Ataca un territorio durante una partida.
 *
 * @param {string} partidaOID - El ID de la partida.
 * @param {string} usuarioID - El ID del usuario.
 * @param {string} territorioAtacante - El nombre del territorio atacante.
 * @param {string} territorioDefensor - El nombre del territorio defensor.
 * @param {number} numTropas - El número de tropas que atacan.
 * @returns {Promise<Object>} Retorna un objeto con los resultados del ataque.
 * @throws {Error} Si la partida no existe, está pausada, el usuario no está en la partida, no es su turno, no está en la fase de atacar, el territorio atacante no le pertenece, no tiene suficientes tropas para atacar, el número de tropas atacantes es inválido, el territorio defensor le pertenece o los territorios no son fronterizos.
 */
async function atacarTerritorio(partidaOID, usuarioID, territorioAtacante, territorioDefensor, numTropas) {
  try {
    // Comprobar que la partida existe y leerla
    partida = await Partida.findById(partidaOID)
    if (!partida) {
      throw new Error("La partida no existe")
    }

    if(partida.paused){
      throw new Error("La partida esta pausada");
    }

    // Comprobar si el usuario esta en la partida y obtener numero de jugador
    jugador = await numJugador(partida, usuarioID)
    if (jugador == -1) {
      throw new Error("El jugador no está en la partida")
    }

    // Comprobar que es el turno del jugador
    if (!await comprobarTurno(partida, jugador)) {
      throw new Error("No es tu turno")
    }

    // Comprobar que la partida se encuentra en la fase de atacar
    if (partida.fase != Atacar) {
      throw new Error("El jugador no se encuentra en la fase de atacar")
    }

    // Comprobar que el territorio atacante pertenece al jugador
    if (!await comprobarTerritorio(partida, jugador, territorioAtacante)) {
      throw new Error("El territorio atacante no pertenece al jugador")
    }
    
    // Comprobar que en el territorio atacante hay suficientes tropas para el ataque (y dejar una)
    tropasTerritorioAtacante = await actualizarTropasTerritorio(partida,territorioAtacante, 0)
    if ((tropasTerritorioAtacante - 1) < numTropas) {
      throw new Error("No hay tropas suficientes en el territorio para realizar el ataque")
    }

    // Comprobamos que el numero de tropas con el que desea atacar es correcto
    if (numTropas > 3 || numTropas < 1) {
      throw new Error("Numero invalido de tropas atacantes: " + numTropas)
    }
    
    // Comprobar que el territorio defensor no pertenece al jugador
    if(await comprobarTerritorio(partida, jugador, territorioDefensor)){
      throw new Error("El territorio defensor pertenece al jugador")
    }
    
    // Comprobar que el territorio atacante es fronterizo con el defensor.
    if(!territoriosFronterizos(partida,territorioAtacante, territorioDefensor)){
      throw new Error("Los territorios no son fronterizos")
    }
    
    // Calculamos los dados del atacante
    dadosAtacante = []
    for (let i = 0; i < numTropas; i++) {
      dadosAtacante.push(Math.floor(Math.random() * 6) + 1)
    }


    // Calculamos el numero de dados del defensor y los tiramos
    tropasTerritorioDefensor = await actualizarTropasTerritorio(partida,territorioDefensor, 0)
    numDadosDefensor = Math.min(2, tropasTerritorioDefensor)
    dadosDefensor = []
    for (let i = 0; i < numDadosDefensor; i++) {
      dadosDefensor.push(Math.floor(Math.random() * 6) + 1)
    }

    dadosAtacante.sort((a, b) => b - a);
    dadosDefensor.sort((a, b) => b - a);

    resultadoBatalla = await resolverBatalla(dadosAtacante, dadosDefensor)
    defensoresRestantes = await actualizarTropasTerritorio(partida, territorioDefensor, -resultadoBatalla.tropasPerdidasDefensor)
    dineroAtacante = 0; dineroDefensor = 0; 
    eloAtacante = 0; eloDefensor = 0; let jugadorDefensor = await encontrarPropietario(partida, territorioDefensor) 
    if (defensoresRestantes === 0) {   // El defensor pierde el territorio // ES ====
      // Quitar el territorio al jugador que lo tenia
      eloAtacante += 5; eloDefensor -= 5; 
      dineroAtacante += 5;
      //jugadorDefensor = await encontrarPropietario(partida, territorioDefensor)
      partida.jugadores[jugadorDefensor].territorios = partida.jugadores[jugadorDefensor].territorios.filter(territorio => territorio !== territorioDefensor)
      // Dar el territorio al jugador atacante
      partida.jugadores[jugador].territorios.push(territorioDefensor)
      // Poner en el territorio defensor numTropas - resultadoBatalla.tropsPerdidasAtacante
      await actualizarTropasTerritorio(partida, territorioDefensor, numTropas - resultadoBatalla.tropasPerdidasAtacante)
      // Quitar del territorio atacante las tropas utilizadas para el ataque
      await actualizarTropasTerritorio(partida, territorioAtacante, -numTropas)
      // Flag de robar carta
      partida.auxRobar = true
      // si el jugador queda eliminado, lo marcamos como abandonado
      if(await jugadorEliminado(partida, jugadorDefensor)){
        partida.jugadores[jugadorDefensor].abandonado = true
        partida.jugadores[jugador].cartas.concat(partida.jugadores[jugadorDefensor].cartas)
        partida.jugadores[jugadorDefensor].cartas = []
      }
    } else { 
      // Quitar del territorio atacante las tropas perdidas en la batalla 
      await actualizarTropasTerritorio(partida, territorioAtacante, -(resultadoBatalla.tropasPerdidasAtacante))
    }
    partida.auxColocar = 0
    eloAtacante += resultadoBatalla.tropasPerdidasDefensor; eloDefensor -= resultadoBatalla.tropasPerdidasDefensor;
    eloDefensor += resultadoBatalla.tropasPerdidasAtacante; eloAtacante -= resultadoBatalla.tropasPerdidasAtacante;
    dineroAtacante += resultadoBatalla.tropasPerdidasDefensor; 
    dineroDefensor += resultadoBatalla.tropasPerdidasAtacante;
    // Si tenemos un ganador, actualizamos la partida
    let ganador = await tenemosGanador(partida)
    if(ganador){
      partida.fechaFin = new Date()
      partida.ganador = ganador.usuario
      const chatOID = partida.chat;
      await Chat.deleteOne({ _id: chatOID });
      partida.chat = {_id: chatOID, nombreChat: 'eliminado', mensajes: [], usuarios: []};
      eloAtacante += 200; 
      dineroAtacante += 200;
      console.log("Gana el jugador " + ganador)
    }
    await partida.save()
    let user = await Usuario.findOne({idUsuario: usuarioID})
    user.elo += eloAtacante; user.puntos += dineroAtacante;
    await user.save()
    user = await Usuario.findOne({idUsuario: partida.jugadores[jugadorDefensor].usuario})
    user.elo += eloDefensor; user.puntos += dineroDefensor;
    await user.save()
    return {dadosAtacante: dadosAtacante, 
            dadosDefensor: dadosDefensor, 
            resultadoBatalla: resultadoBatalla, 
            conquistado: defensoresRestantes === 0,
            eloAtacante: eloAtacante,
            eloDefensor: eloDefensor,
            dineroAtacante: dineroAtacante,
            dineroDefensor: dineroDefensor}
  } catch (error) {
    throw new Error(error.message)
  }
}

/**
 * Realiza una maniobra durante una partida.
 *
 * @param {string} partidaOID - El ID de la partida.
 * @param {string} usuarioID - El ID del usuario.
 * @param {string} territorioOrigen - El nombre del territorio origen.
 * @param {string} territorioDestino - El nombre del territorio destino.
 * @param {number} numTropas - El número de tropas a mover.
 * @returns {Promise<boolean>} Retorna true si la maniobra se realiza correctamente, false en caso contrario.
 * @throws {Error} Si la partida no existe, está pausada, el usuario no está en la partida, no es su turno, no está en la fase de maniobrar, los territorios no le pertenecen, no hay ruta posible entre los territorios o el número de tropas es insuficiente.
 */
async function realizarManiobra(partidaOID, usuarioID, territorioOrigen, territorioDestino, numTropas) {
  // Comprobar que la partida existe y leerla
  partida = await Partida.findById(partidaOID)
  if (!partida) {
    console.error("La partida no existe")
    return false
  }

  if(partida.paused){
    throw new Error("La partida esta pausada");
  }

  // Buscar al jugador en la partida
  jugador = await numJugador(partida, usuarioID)
  if (jugador == -1) {
    return false
  }

  // Comprobar que sea el turno del jugador
  if (!comprobarTurno(partida, jugador)) {
    return false
  }

  // Comprobar que la partida se encuentra en la fase de maniobrar
  if (partida.fase != Maniobrar) {
    console.error("El jugador no se encuentra en la fase de maniobrar")
    return false
  }

  // Comprobar que el territorio origen pertenece al jugador
  if (!await comprobarTerritorio(partida, jugador, territorioOrigen)) {
    console.error("El territorio origen no pertenece al jugador")
    return false
  }

  // Comprobar que el territorio destino pertenece al jugador
  if (!await comprobarTerritorio(partida, jugador, territorioDestino)) {
    console.error("El territorio destino no pertenece al jugador")
    return false
  }

  // Comprobar si se puede llegar de un territorio a otro pasando solo por territorios del jugador
  if (!await maniobraPosible(partida, jugador, territorioOrigen, territorioDestino)) {
    console.error("No hay ruta posible hasta el territorio destino desde el territorio origen")
    return false
  }

  // Calculamos el nº de tropas en el territorio origen.
  tropasTerritorioOrigen = await actualizarTropasTerritorio(partida, territorioOrigen, 0)
  if (numTropas > (tropasTerritorioOrigen - 1)) {
    console.error("Nº de tropas insuficientes en el territorio origen")
    return false
  }

  // Quitamos/Añadimos las tropas
  await actualizarTropasTerritorio(partida, territorioOrigen, -numTropas)
  await actualizarTropasTerritorio(partida, territorioDestino, numTropas)
  await partida.save()

  return true
}

/**
 * Cambia de fase o pasa de turno durante una partida.
 *
 * @param {string} partidaOID - El ID de la partida.
 * @param {string} usuarioID - El ID del usuario.
 * @returns {Promise<Object>} Retorna un objeto con la nueva fase, el nuevo turno, los refuerzos y si se puede robar una carta.
 * @throws {Error} Si la partida no existe, está pausada, el usuario no está en la partida, no es su turno, no se han terminado de colocar las tropas o ocurre otro error.
 */
async function siguienteFase(partidaOID, usuarioID) {
  try {
    // Comprobar que la partida existe y leerla
    partida = await Partida.findById(partidaOID)
    if (!partida) {
      throw new Error("La partida no existe")
    }

    if(partida.paused){
      throw new Error("La partida esta pausada");
    }

    // Buscar al jugador en la partida
    jugador = await numJugador(partida, usuarioID);
    if(jugador == - 1){
      throw new Error("El jugador no está presente en la partida")
    }

    // Comprobar que sea el turno del jugador
    if(! await comprobarTurno(partida, jugador)){
      throw new Error("No es tu turno")
    }

    // Si es fase de colocacion y quedar tropas por colocar no se puede pasar de fase
    if((partida.fase == Colocar || partida.fase == Fin) && partida.auxColocar != 0){
      throw new Error("No se han terminado de colocar las tropas")
    }

    // Pasar a la siguiente fase. Si era la ultima fase pasar de turno
    partida.fase = (partida.fase + 1) % (Fin + 1);
    if(partida.fase === Colocar){
      // habrá que pasar al siguiente jugador que NO haya abandonado
      console.log(partida.jugadores.length)
      partida.turno = (partida.turno + 1) % partida.jugadores.length;
      siguienteJugador = (jugador + 1) % partida.jugadores.length;
      while(partida.jugadores[partida.turno].abandonado){
        partida.turno = (partida.turno + 1) % partida.jugadores.length;
        siguienteJugador = (jugador + 1) % partida.jugadores.length;
      }


      // Inicializamos la variable de refuerzos del siguiente jugador
      partida.auxColocar = await calcularRefuerzos(partida, siguienteJugador);
      console.log("auxcolocar", partida.auxColocar)

      // Si el mazo de cartas esta vacio y en la pila de descartes hay alguna carta
      // Barajeamos la pila de descartes en el mazo
      if(partida.cartas.length == 0 && partida.descartes.length > 0){
        partida.cartas = partida.descartes;
        partida.descartes = [];
        partida.cartas = shuffle(partida.cartas);
      }
      
      
      // Si el flag de robar esta activo y se puede robar una carta se roba
      if(partida.cartas.length >= 1 && partida.auxRobar == true){
        cartaRobada = partida.cartas.pop();
        partida.jugadores[jugador].cartas.push(cartaRobada);
        partida.auxRobar = false;
      }
    }
    let refuerzos = partida.auxColocar; 
    let robar = partida.auxRobar;
    await partida.save();
    return {fase: partida.fase, turno: partida.turno, refuerzos: refuerzos, robar: robar};
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Utiliza una carta durante una partida.
 *
 * @param {string} partidaOID - El ID de la partida.
 * @param {string} usuarioID - El ID del usuario.
 * @param {string} carta1 - El nombre del territorio correspondiente a la carta.
 * @returns {Promise<Object>} Retorna un objeto con el número de tropas que se añaden al jugador.
 * @throws {Error} Si la partida no existe, está pausada, el usuario no está en la partida, no es su turno, las cartas son null o undefined, los territorios de las cartas no pertenecen al jugador, no se pueden utilizar cartas en la fase actual o el jugador no dispone de las cartas que quiere utilizar.
 */
async function utilizarCartas(partidaOID, usuarioID, carta1) {
  try{
    // Comprobar que la partida existe y leerla
    partida = await Partida.findById(partidaOID)
    if (!partida) {
      throw new Error("La partida no existe")
      return false
    }

    if(partida.paused){
      throw new Error("La partida esta pausada");
    }

    // Buscar al jugador en la partida
    jugador = await numJugador(partida, usuarioID);
    if(jugador == - 1){
      throw new Error("El jugador no está en la partida")
    }

    // Comprobar que sea el turno del jugador
    if(!await comprobarTurno(partida, jugador)){
      throw new Error("No es tu turno")
    }

    // Comprobar que las cartas no sean null
    if(carta1 == null){
      throw new Error("Las 3 cartas deben ser diferentes")
    }

    // Comprobar que las cartas no sean undefined
    if(carta1 == undefined){
      throw new Error("Las 3 cartas deben ser diferentes")
    }

    // Comprobar que los territorios de las cartas pertenecen al jugador
    if(!await comprobarTerritorio(partida, jugador, carta1)){
      throw new Error("El territorio de alguna de las cartas no pertenece al jugador");
      return false;
    }

    // Solo se pueden utlilizar cartas en la fase de colocacion o en la fase final de la partida
    if(partida.fase != Colocar && partida.fase != Fin){
      throw new Error("No se pueden utilizar cartas en esta fase");
      return false;
    }
    
    const cartasJugador = partida.jugadores[jugador].cartas.map(carta => carta.territorio);

    // Verificar si el jugador tiene las tres cartas
    const cartasDescartar = [carta1];
    const todasLasCartasEncontradas = cartasDescartar.every(carta => cartasJugador.includes(carta));
    
    if (todasLasCartasEncontradas) {
      // Obtener las cartas que se deben descartar
      const cartasDescartadas = partida.jugadores[jugador].cartas.filter(carta => cartasDescartar.includes(carta.territorio));
    
      // Calcular el valor de tropas que suman las tres cartas
      const sumaEstrellas = cartasDescartadas.reduce((total, carta) => total + carta.estrellas, 0);
    
      partida.auxColocar = partida.auxColocar + sumaEstrellas;

      // Cartas que se queda el jugador despues
      nuevasCartasJugador = partida.jugadores[jugador].cartas.filter(carta => !cartasDescartar.includes(carta.territorio));

      // Actualizar las cartas del jugador
      partida.jugadores[jugador].cartas = nuevasCartasJugador;

      // Agregar las cartas al array de descartes de la partida
      partida.descartes.push(cartasDescartadas[0]);


      await partida.save();
      console.log("Cartas utilizadas");

      return {tropas: partida.auxColocar};
    } else {
        throw new Error("El jugador no dispone de las cartas que quiere utilizar")
        return false; // Indica que el jugador no tiene las tres cartas
    }
  } catch (error) {
    console.error("Error al utilizar cartas:", error);
    throw error;
  }
}

/**
 * Pasa el estado de la partida al front.
 * @param {string} partidaOID - El ID de la partida.
 * @param {string} UsuarioID - El ID del usuario.
 * @returns {Promise<Object>} La partida con la información del estado.
 * @throws {Error} Si la partida no existe o el usuario no está en la partida.
 */
async function getPartida(partidaOID, UsuarioID){
  // Comprobar que la partida existe y leerla
  partida = await Partida.findById(partidaOID)
  if (!partida) {
    console.error("La partida no existe")
    return
  }
  console.log(UsuarioID)
  // Buscar al jugador en la partida
  jugador = numJugador(partida, UsuarioID);
  if (jugador == - 1) {
    return
  }

  for (let i = 0; i < partida.jugadores.length; i++) {
    // Eliminar el campo cartas de el resto de jugadores
    if (i != jugador) {
      delete partida.jugadores[i].cartas;
    }
  }

  delete partida.descartes;
  delete partida.cartas;

  return partida;
}

/**
 * Pausa o reanuda una partida.
 * @param {string} user - El ID del usuario.
 * @param {string} idPartida - El ID de la partida.
 * @returns {Promise<boolean>} Devuelve true si la operación fue exitosa.
 * @throws {Error} Si la partida no existe, el usuario no está en la partida, o ocurre otro error.
 */
async function pausarPartida(user, idPartida){
  try{
    let partida = await Partida.findById(idPartida)
    if(!partida){
      throw new Error("La partida no existe")
    }
    jugador = await numJugador(partida, user);
    if(jugador == - 1){
      throw new Error("El jugador no está en la partida")
    }
    if(partida.paused){
      partida.paused = false;
      console.log("reanudada")
    } else {
      partida.paused = true;
      console.log("pausada")
    }
    await partida.save();
    return true;
  } catch (error) {
    throw new Error(error.message)
  }
}

// -------------------- FUNCIONES AUXILIARES ----------------------------------

async function existeGanador(idPartida){
  try{
    let partida = await Partida.findById(idPartida);
    if(!partida){
      throw new Error("Partida no encontrada");
    }
    return await tenemosGanador(partida);
  } catch (error) {
    throw error;
  }
}

async function getInfo(partidaID) {
  try {
    let partida = await Partida.findOne({nombre: partidaID, fechaInicio: null});
    if(!partida)
    try {
      partida = await Partida.findById(partidaID)
    } catch (error) {
      throw new Error("Partida no encontrada");
    }
    return partida;
  }
  catch (error) {
    throw error;
  }
}

// dado el usuario, si está en alguna partida devuelve el id de la misma
async function estoyEnPartida(idUsuario){
  try{
    // Obtengo todas las que hayan comenzado y no hayan terminado
    const partidas = await Partida.find({ fechaInicio: { $ne: null }, fechaFin: { $eq: null } });
    for(let partida of partidas){
      for(let jugador of partida.jugadores){
        if(jugador.usuario == idUsuario && !jugador.abandonado){
          return partida._id;
        }
      }
    }
    return null;
  } catch (error) {
    throw error;
  }
}

async function jugadoresEliminados(partidaID){
  try {
    let partida = await Partida.findById(partidaID);
    if(!partida){
      throw new Error("Partida no encontrada");
    }
    let eliminados = [];
    for(let i = 0; i < partida.jugadores.length; i++){
      if(partida.jugadores[i].abandonado){
        eliminados.push(partida.jugadores[i].usuario);
      }
    }
    return eliminados;
  } catch (error) {
    throw error;
  }
    
}

module.exports = {
  crearPartida, 
  getPartidasDisponibles,
  getHistorico,
  invite,
  join,
  salirPartida,
  iniciarPartida,
  siguienteFase,
  colocarTropas,
  atacarTerritorio,
  realizarManiobra,
  utilizarCartas,
  getPartida,
  getInfo,
  estoyEnPartida,
  existeGanador, 
  jugadoresEliminados,
  pausarPartida
};