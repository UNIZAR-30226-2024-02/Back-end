const {Partida, Jugador, Territorio, Carta, Continente} = require('../models/Partida');
const { findById } = require('../models/Skin');
const Usuario = require('../models/Usuario');
const Chat = require('../models/Chat');

// FASES PARTIDA
const Colocar = 0; // Aqui se pueden utilizar cartas
const Atacar = 1;
const Maniobrar = 2;
const Fin = 3; // Para utilizar cartas, si tocaba robar aun no se roba

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

// Invita al usuario a la partida
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

// Une el usuario a la partida
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

// Devuelve las partidas públicas que no han empezado ni terminado
// (es decir, están en espera de jugadores)
async function getPartidasDisponibles() {
  try {
    const partidasDisponibles = await Partida.find({ fechaInicio: null, fechaFin: null, password: null });
    
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
    const historico = await Partida.find({ fechaFin: { $ne: null }, "jugadores.usuario": { $eq: user } })

    return historico
  } catch (error) {
    console.error("Error al obtener partidas disponibles:", error)
    throw error
  }
}

// Dado el object id de una partida (id unico de la bdd) inicia esta.
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

async function colocarTropas(partidaOID, usuarioID, nombreTerritorio, tropas) {
  try {
    // Comprobar que la partida existe y leerla
    partida = await Partida.findById(partidaOID)
    if (!partida) {
      throw new Error("La partida no existe");
      return false;
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


// Debugged, falta integrar en el front
async function atacarTerritorio(partidaOID, usuarioID, territorioAtacante, territorioDefensor, numTropas) {
  try {
    // Comprobar que la partida existe y leerla
    partida = await Partida.findById(partidaOID)
    if (!partida) {
      throw new Error("La partida no existe")
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
    user.elo += eloAtacante; user.dinero += dineroAtacante;
    await user.save()
    user = await Usuario.findOne({idUsuario: partida.jugadores[jugadorDefensor].usuario})
    user.elo += eloDefensor; user.dinero += dineroDefensor;
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

async function realizarManiobra(partidaOID, usuarioID, territorioOrigen, territorioDestino, numTropas) {
  // Comprobar que la partida existe y leerla
  partida = await Partida.findById(partidaOID)
  if (!partida) {
    console.error("La partida no existe")
    return false
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

// Funcion para cambiar de fase / pasar de turno
async function siguienteFase(partidaOID, usuarioID) {
  try {
    // Comprobar que la partida existe y leerla
    partida = await Partida.findById(partidaOID)
    if (!partida) {
      throw new Error("La partida no existe")
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

// Lo que se pasa es el pais correspondiente a la carta
async function utilizarCartas(partidaOID, usuarioID, carta1, carta2, carta3) {
  try{
    // Comprobar que la partida existe y leerla
    partida = await Partida.findById(partidaOID)
    if (!partida) {
      throw new Error("La partida no existe")
      return false
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
    if(carta1 == null || carta2 == null || carta2 == null){
      throw new Error("Las 3 cartas deben ser diferentes")
    }

    // Comprobar que las cartas no sean undefined
    if(carta1 == undefined || carta2 == undefined || carta2 == undefined){
      throw new Error("Las 3 cartas deben ser diferentes")
    }

    // Comprobar que las 3 cartas sean diferentes
    if(carta1 == carta2 || carta2 == carta3 || carta2 == carta3){
      throw new Error("Las 3 cartas deben ser diferentes")
    }

    // Comprobar que los territorios de las cartas pertenecen al jugador
    if(!await comprobarTerritorio(partida, jugador, carta1) || !await comprobarTerritorio(partida, jugador, carta2)
      || !await comprobarTerritorio(partida, jugador, carta3)){
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
    const cartasDescartar = [carta1, carta2, carta3];
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
      partida.descartes.push(...partida.jugadores[jugador].cartas.filter(carta => cartasDescartar.includes(carta.territorio)));


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

// Funcion para pasar el estado de la partida al front
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

// -------------------- FUNCIONES AUXILIARES ----------------------------------
async function calcularRefuerzos(partida, numJugador){
  numTerritorios = partida.jugadores[numJugador].territorios.length;
  console.log(numTerritorios)
  // "siempre recibes al menos 3 tropas" (https://www.hasbro.com/common/documents/dad2886d1c4311ddbd0b0800200c9a66/ADE84A6E50569047F504839559C5FEBF.pdf)
  let refuerzos = 3;

  // Refuerzos por numero de territorios
  console.log("Territorios", numTerritorios)
  if (numTerritorios >= 12 && numTerritorios <= 14) {
    refuerzos += 1;
  } else if (numTerritorios >= 15 && numTerritorios <= 17) {
    refuerzos += 2;
  } else if (numTerritorios >= 18 && numTerritorios <= 20) {
    refuerzos += 3;
  } else if (numTerritorios >= 21 && numTerritorios <= 23) {
    refuerzos += 4;
  } else if (numTerritorios >= 24 && numTerritorios <= 26) {
    refuerzos += 5;
  } else if (numTerritorios >= 27 && numTerritorios <= 29) {
    refuerzos += 6;
  } else if (numTerritorios >= 30 && numTerritorios <= 32) {
    refuerzos += 7;
  } else if (numTerritorios >= 33 && numTerritorios <= 35) {
    refuerzos += 8;
  } else if (numTerritorios >= 36 && numTerritorios <= 39) {
    refuerzos += 9;
  } else if (numTerritorios >= 40 && numTerritorios <= 42) {
    refuerzos += 10;
  } else {
    refuerzos += 0;
    console.log("Caball")
  }

  console.log('Refuerzos', refuerzos)

  // Refuerzos por continente const Mapa = [NA, SA, EU, AF, AS, OC];
  if (controlaContinente(partida.jugadores[numJugador], partida.mapa[0])) {
    refuerzos += 5;
  }

  if (controlaContinente(partida.jugadores[numJugador], partida.mapa[1])) {
    refuerzos += 2;
  }

  if (controlaContinente(partida.jugadores[numJugador], partida.mapa[2])) {
    refuerzos += 5;
  }

  if (controlaContinente(partida.jugadores[numJugador], partida.mapa[3])) {
    refuerzos += 3;
  }

  if (controlaContinente(partida.jugadores[numJugador], partida.mapa[4])) {
    refuerzos += 7;
  }

  if (controlaContinente(partida.jugadores[numJugador], partida.mapa[5])) {
    refuerzos += 2;
  }

  return refuerzos;
}

// Funcion auxiliar para comprobar si un jugador tiene un continente completo
function controlaContinente(jugador, continente) {
  // Obtener los territorios del continente
  const territoriosContinente = continente.territorios.map(territorio => territorio.nombre);

  // Verificar si el jugador tiene todos los territorios del continente
  for (const territorio of territoriosContinente) {
      if (!jugador.territorios.includes(territorio)) {
          return false;
      }
  }
  return true;
}

async function actualizarTropasTerritorio(partida, nombreTerritorio, delta) {
  for (const continente of partida.mapa) {
    territorioEncontrado = continente.territorios.find(territorio => territorio.nombre === nombreTerritorio);
    if (territorioEncontrado) {
        territorioEncontrado.tropas = Number(territorioEncontrado.tropas) + Number(delta);
        partida.auxColocar -= delta;
        return territorioEncontrado.tropas;
    }
  };

  return -1;
}

// Dado un id de usuario devuelve su numero de jugador o -1 si no esta
async function numJugador(partida, usuarioID){
  for( let i = 0; i < partida.jugadores.length; i++){
    if( partida.jugadores[i].usuario == usuarioID){
      return i;
    }
  }

  console.error("El usuario " + usuarioID + " no esta en la partida");
  return -1;
}

async function comprobarTurno(partida, numJugador){
  // Comprobar si la partida aun no ha empezado o si ha terminado
  console.log("Jugador: " + numJugador + " Turno: " + partida.turno)
  if (partida.fechaInicio == null || partida.fechaFin != null) {
    console.error("La partida no esta activa")
    return false;
  }
  // Comprobar si es el turno del jugador
  if (partida.turno == numJugador) {
    return true;
  } else {
    console.error("No es el turno del jugador " + numJugador);
    return false;
  }
}

async function comprobarTerritorio(partida, numJugador, nombreTerritorio){
  let jugador = partida.jugadores[numJugador]
  if(jugador.territorios.includes(nombreTerritorio)){
    return true
  }
  console.error("El territorio " + nombreTerritorio + " no pertenece al jugador " + numJugador)
  return false
}

async function inicializarEstado(partida) {
  // Barajeamos aleatoriamente el array de jugadores de la partida
  for (let i = partida.jugadores.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [partida.jugadores[i], partida.jugadores[j]] = [partida.jugadores[j], partida.jugadores[i]];
  }
  

  // Actualizamos el campo turno de cada jugador -> ?¿
  //for (let i = 0; i < partida.jugadores.length; i++) {
  //  partida.jugadores[i].turno = i + 1; 
  //}
  //console.log(partida.jugadores)

  // le metemos el color a los jugadores
  colores = ['verde', 'rojo', 'azul', 'amarillo', 'rosa', 'morado'];
  shuffle(colores);
  for(let jugador of partida.jugadores){
    if (colores.length > 0) {
      let color = this.colores.pop();
      if (color !== undefined) {
        jugador.color = color;
      } else {
        console.error('Unexpected error: No more colors available');
      }
    } else {
      console.error('No more colors available');
    }
  }


  // Inicializamos la lista de cartas disponibles de la partida
  partida.cartas = [
    // NA
    {territorio: "ALASKA", estrellas: 1},
    {territorio: "ALBERTA", estrellas: 2},
    {territorio: "AMERICA CENTRAL", estrellas: 1},
    {territorio: "ESTADOS UNIDOS ESTE", estrellas: 2},
    {territorio: "GROENLANDIA", estrellas: 1},
    {territorio: "TERRITORIOS DEL NOROESTE", estrellas: 2},
    {territorio: "ONTARIO", estrellas: 1},
    {territorio: "QUEBEC", estrellas: 2},
    {territorio: "ESTADOS UNIDOS OESTE", estrellas: 1},
    // SA
    {territorio: "ARGENTINA", estrellas: 1},
    {territorio: "BRASIL", estrellas: 2},
    {territorio: "PERU", estrellas: 1},
    {territorio: "VENEZUELA", estrellas: 2},
    // EU
    {territorio: "GRAN BRETANA", estrellas: 1},
    {territorio: "ISLANDIA", estrellas: 2},
    {territorio: "EUROPA NORTE", estrellas: 1},
    {territorio: "ESCANDINAVIA", estrellas: 1},
    {territorio: "EUROPA SUR", estrellas: 2},
    {territorio: "RUSIA", estrellas: 1},
    {territorio: "EUROPA OCCIDENTAL", estrellas: 1},
    // AF
    {territorio: "CONGO", estrellas: 1},
    {territorio: "AFRICA ORIENTAL", estrellas: 2},
    {territorio: "EGIPTO", estrellas: 1},
    {territorio: "MADAGASCAR", estrellas: 1},
    {territorio: "AFRICA NORTE", estrellas: 2},
    {territorio: "SUDAFRICA", estrellas: 1},
    // AS
    {territorio: "AFGANISTAN", estrellas: 1},
    {territorio: "CHINA", estrellas: 2},
    {territorio: "INDIA", estrellas: 1},
    {territorio: "IRKUTSK", estrellas: 2},
    {territorio: "JAPON", estrellas: 1},
    {territorio: "KAMCHATKA", estrellas: 2},
    {territorio: "ORIENTE MEDIO", estrellas: 1},
    {territorio: "MONGOLIA", estrellas: 2},
    {territorio: "SUDESTE ASIATICO", estrellas: 1},
    {territorio: "SIBERIA", estrellas: 2},
    {territorio: "URAL", estrellas: 1},
    {territorio: "YAKUTSK", estrellas: 2},
    // OC
    {territorio: "AUSTRALIA ORIENTAL", estrellas: 1},
    {territorio: "AUSTRALIA OCCIDENTAL", estrellas: 2},
    {territorio: "INDONESIA", estrellas: 1},
    {territorio: "NUEVA GUINEA", estrellas: 2}
  ];

  const Alaska = new Territorio({ nombre: "ALASKA", frontera: ["ALBERTA", "TERRITORIOS DEL NOROESTE", "KAMCHATKA"], tropas: 1 });
  const Alberta = new Territorio({ nombre: "ALBERTA", frontera: ["ALASKA", "ESTADOS UNIDOS OESTE", "ONTARIO", "TERRITORIOS DEL NOROESTE"], tropas: 2 });
  const AmericaCentral = new Territorio({ nombre: "AMERICA CENTRAL", frontera: ["ESTADOS UNIDOS ESTE", "ESTADOS UNIDOS OESTE", "VENEZUELA"], tropas: 1 });
  const EstadosUnidosEste = new Territorio({ nombre: "ESTADOS UNIDOS ESTE", frontera: ["AMERICA CENTRAL", "ESTADOS UNIDOS OESTE", "ONTARIO", "QUEBEC"], tropas: 2 });
  const Groenlandia = new Territorio({ nombre: "GROENLANDIA", frontera: ["TERRITORIOS DEL NOROESTE", "ONTARIO", "QUEBEC", "ISLANDIA"], tropas: 1 });
  const TerritoriosDelNoroeste = new Territorio({ nombre: "TERRITORIOS DEL NOROESTE", frontera: ["ALASKA", "ALBERTA", "ONTARIO", "GROENLANDIA"], tropas: 2 });
  const Ontario = new Territorio({ nombre: "ONTARIO", frontera: ["ALBERTA", "TERRITORIOS DEL NOROESTE", "QUEBEC", "GROENLANDIA", "ESTADOS UNIDOS OESTE", "ESTADOS UNIDOS ESTE"], tropas: 1 });
  const Quebec = new Territorio({ nombre: "QUEBEC", frontera: ["ONTARIO", "ESTADOS UNIDOS ESTE", "GROENLANDIA"], tropas: 2 });
  const EstadosUnidosOeste = new Territorio({ nombre: "ESTADOS UNIDOS OESTE", frontera: ["ALBERTA", "ESTADOS UNIDOS ESTE", "ONTARIO", "AMERICA CENTRAL"], tropas: 1 });
  const Argentina = new Territorio({ nombre: "ARGENTINA", frontera: ["PERU", "BRASIL"], tropas: 1 });
  const Brasil = new Territorio({ nombre: "BRASIL", frontera: ["ARGENTINA", "VENEZUELA", "PERU", "AFRICA NORTE"], tropas: 2 });
  const Peru = new Territorio({ nombre: "PERU", frontera: ["ARGENTINA", "VENEZUELA", "BRASIL"], tropas: 1 });
  const Venezuela = new Territorio({ nombre: "VENEZUELA", frontera: ["AMERICA CENTRAL", "PERU", "BRASIL"], tropas: 2 });
  const GranBretana = new Territorio({ nombre: "GRAN BRETANA", frontera: ["EUROPA OCCIDENTAL", "EUROPA NORTE", "ESCANDINAVIA", "ISLANDIA"], tropas: 1 });
  const Islandia = new Territorio({ nombre: "ISLANDIA", frontera: ["GRAN BRETANA", "GROENLANDIA", "ESCANDINAVIA"], tropas: 2 });
  const EuropaNorte = new Territorio({ nombre: "EUROPA NORTE", frontera: ["EUROPA SUR", "EUROPA OCCIDENTAL", "RUSIA", "GRAN BRETANA", "ESCANDINAVIA"], tropas: 1 });
  const Escandinavia = new Territorio({ nombre: "ESCANDINAVIA", frontera: ["RUSIA", "EUROPA NORTE", "GRAN BRETANA", "ISLANDIA"], tropas: 1 });
  const EuropaSur = new Territorio({ nombre: "EUROPA SUR", frontera: ["EUROPA OCCIDENTAL", "EUROPA NORTE", "RUSIA", "AFRICA NORTE", "EGIPTO", "ORIENTE MEDIO"], tropas: 2 });
  const Rusia = new Territorio({ nombre: "RUSIA", frontera: ["ESCANDINAVIA", "EUROPA NORTE", "EUROPA SUR", "URAL", "AFGANISTAN", "ORIENTE MEDIO"], tropas: 1 });
  const EuropaOccidental = new Territorio({ nombre: "EUROPA OCCIDENTAL", frontera: ["EUROPA NORTE", "EUROPA SUR", "AFRICA NORTE", "GRAN BRETANA"], tropas: 1 });
  const Congo = new Territorio({ nombre: "CONGO", frontera: ["AFRICA ORIENTAL", "SUDAFRICA", "AFRICA NORTE"], tropas: 1 });
  const AfricaOriental = new Territorio({ nombre: "AFRICA ORIENTAL", frontera: ["EGIPTO", "AFRICA NORTE", "CONGO", "SUDAFRICA", "MADAGASCAR"], tropas: 2 });
  const Egipto = new Territorio({ nombre: "EGIPTO", frontera: ["AFRICA NORTE", "AFRICA ORIENTAL", "EUROPA SUR", "ORIENTE MEDIO"], tropas: 1 });
  const Madagascar = new Territorio({ nombre: "MADAGASCAR", frontera: ["AFRICA ORIENTAL", "SUDAFRICA"], tropas: 1 });
  const AfricaNorte = new Territorio({ nombre: "AFRICA NORTE", frontera: ["EGIPTO", "BRASIL", "AFRICA ORIENTAL", "CONGO"], tropas: 2 });
  const Sudafrica = new Territorio({ nombre: "SUDAFRICA", frontera: ["MADAGASCAR", "CONGO", "AFRICA ORIENTAL"], tropas: 1 });
  const Afganistan = new Territorio({ nombre: "AFGANISTAN", frontera: ["RUSIA", "URAL", "INDIA", "ORIENTE MEDIO", "CHINA"], tropas: 1 });
  const China = new Territorio({ nombre: "CHINA", frontera: ["INDIA", "SUDESTE ASIATICO", "MONGOLIA", "SIBERIA", "URAL", "AFGANISTAN"], tropas: 2 });
  const India = new Territorio({ nombre: "INDIA", frontera: ["CHINA", "ORIENTE MEDIO", "AFGANISTAN", "SUDESTE ASIATICO"], tropas: 1 });
  const Irkutsk = new Territorio({ nombre: "IRKUTSK", frontera: ["YAKUTSK", "SIBERIA", "MONGOLIA", "KAMCHATKA"], tropas: 2 });
  const Japon = new Territorio({ nombre: "JAPON", frontera: ["KAMCHATKA", "MONGOLIA"], tropas: 1 });
  const Kamchatka = new Territorio({ nombre: "KAMCHATKA", frontera: ["ALASKA", "YAKUTSK", "IRKUTSK", "MONGOLIA", "JAPON"], tropas: 2 });
  const OrienteMedio = new Territorio({ nombre: "ORIENTE MEDIO", frontera: ["RUSIA", "AFGANISTAN", "INDIA", "EGIPTO", "EUROPA SUR"], tropas: 1 });
  const Mongolia = new Territorio({ nombre: "MONGOLIA", frontera: ["IRKUTSK", "CHINA", "JAPON", "SIBERIA", "KAMCHATKA"], tropas: 2 });
  const SudesteAsiatico = new Territorio({ nombre: "SUDESTE ASIATICO", frontera: ["CHINA", "INDIA", "INDONESIA"], tropas: 1 });
  const Siberia = new Territorio({ nombre: "SIBERIA", frontera: ["IRKUTSK", "YAKUTSK", "MONGOLIA", "CHINA", "URAL"], tropas: 2 });
  const Ural = new Territorio({ nombre: "URAL", frontera: ["SIBERIA", "RUSIA", "AFGANISTAN", "CHINA"], tropas: 1 });
  const Yakutsk = new Territorio({ nombre: "YAKUTSK", frontera: ["IRKUTSK", "KAMCHATKA", "SIBERIA"], tropas: 2 });
  const Indonesia = new Territorio({ nombre: "INDONESIA", frontera: ["SUDESTE ASIATICO", "NUEVA GUINEA", "AUSTRALIA OCCIDENTAL"], tropas: 1 });
  const NuevaGuinea = new Territorio({ nombre: "NUEVA GUINEA", frontera: ["AUSTRALIA OCCIDENTAL", "AUSTRALIA ORIENTAL", "INDONESIA"], tropas: 2 });
  const AustraliaOccidental = new Territorio({ nombre: "AUSTRALIA OCCIDENTAL", frontera: ["AUSTRALIA ORIENTAL", "INDONESIA", "NUEVA GUINEA"], tropas: 2 });
  const AustraliaOriental = new Territorio({ nombre: "AUSTRALIA ORIENTAL", frontera: ["AUSTRALIA OCCIDENTAL", "NUEVA GUINEA"], tropas: 1 });  

  const NATerritorios = [
    Alaska, Alberta, AmericaCentral, EstadosUnidosEste,
    Groenlandia, TerritoriosDelNoroeste, Ontario, Quebec, EstadosUnidosOeste
  ];

  const SATerritorios = [
    Argentina, Brasil, Peru, Venezuela
  ];

  const EUTerritorios = [
    GranBretana, Islandia, EuropaNorte, Escandinavia,
    EuropaSur, Rusia, EuropaOccidental
  ];

  const AFTerritorios = [
    Congo, AfricaOriental, Egipto, Madagascar,
    AfricaNorte, Sudafrica
  ];

  const ASTerritorios = [
    Afganistan, China, India, Irkutsk, Japon,
    Kamchatka, OrienteMedio, Mongolia, SudesteAsiatico,
    Siberia, Ural, Yakutsk
  ];

  const OCTerritorios = [
    Indonesia, NuevaGuinea, AustraliaOccidental, AustraliaOriental
  ];

  const NA = new Continente({
    territorios: NATerritorios,
    valor: 5
  });

  const SA = new Continente({
    territorios: SATerritorios,
    valor: 2
  });

  const EU = new Continente({
    territorios: EUTerritorios,
    valor: 5
  });

  const AF = new Continente({
    territorios: AFTerritorios,
    valor: 3
  });

  const AS = new Continente({
    territorios: ASTerritorios,
    valor: 7
  });

  const OC = new Continente({
    territorios: OCTerritorios,
    valor: 2
  });

  const Mapa = [NA, SA, EU, AF, AS, OC];

  partida.mapa = Mapa;

  // Barajear cartas
  partida.cartas = shuffle(partida.cartas);
  partida.jugadores.map(jugador => jugador.territorios = []);
  console.log(partida.jugadores.map(jugador => jugador.territorios))
  // Reapartir los territorios
  for (let i = 0; i < partida.cartas.length; i++) {
    partida.jugadores[i % partida.jugadores.length].territorios.push(partida.cartas[i].territorio);
  }


  // Volver a barajear
  partida.cartas = shuffle(partida.cartas);

}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function territoriosFronterizos(partida, territorio1, territorio2) {
  const territorios = partida.mapa.flatMap(continente => continente.territorios);
  // Busca el territorio1 en la partida
  const infoTerritorio1 = territorios.find(t => t.nombre === territorio1);
  if (!infoTerritorio1) {
      console.error('Territorio 1 no encontrado en la partida');
      return false;
  }
  
  // Busca el territorio2 en la partida
  const infoTerritorio2 = territorios.find(t => t.nombre === territorio2);
  
  if (!infoTerritorio2) {
      console.error('Territorio 2 no encontrado en la partida');
      return false;
  }
  
  // Verifica si territorio1 y territorio2 son fronterizos
  if (infoTerritorio1.frontera.includes(territorio2) || infoTerritorio2.frontera.includes(territorio1)) {
    console.log("hola")
    return true;
  } else {
    return false;
  }
}

// Función para resolver una batalla entre el atacante y el defensor
function resolverBatalla(dadosAtacante, dadosDefensor) {
  let tropasPerdidasAtacante = 0;
  let tropasPerdidasDefensor = 0;

  // Calcula el número de comparaciones basado en la cantidad mínima de dados lanzados
  const numComparaciones = Math.min(dadosAtacante.length, dadosDefensor.length);

  // Resuelve cada comparación de dados
  for (let i = 0; i < numComparaciones; i++) {
      if (dadosAtacante[i] > dadosDefensor[i]) {
          tropasPerdidasDefensor++;
      } else {
          tropasPerdidasAtacante++;
      }
  }

  return { tropasPerdidasAtacante, tropasPerdidasDefensor };
}

// Devuelve el numero de jugador al que pertenece un territorio
async function encontrarPropietario(partida, nombreTerritorio){ 
  for (let i = 0; i < partida.jugadores.length; i++) {
    const jugador = partida.jugadores[i];
    if (jugador.territorios.includes(nombreTerritorio)) {
        console.log(`El territorio ${nombreTerritorio} pertenece al jugador ${jugador.usuario}.`);
        console.log(`Índice del jugador en partida.jugadores: ${i}`);
        return i;
    }
  }
}

async function maniobraPosible(partida, numJugador, territorioOrigen, territorioDestino) {

  // Función que comprueba que un territorio es alcanzable desde el territorio de origen
  function isFriendlyReachable(mapa, origen, destino, jugador) {
    if (!jugador.territorios.includes(destino)) {
      console.log("El territorio destino no pertenece al jugador")
      return false
    }
    const territorios = mapa.flatMap(continent => continent.territorios)
    const territoriosExplorados = new Set()
    const territoriosPorExplorar = new Set()
    territoriosPorExplorar.add(origen)
    while (territoriosPorExplorar.size > 0) {
      const territorioActual = territoriosPorExplorar.values().next().value

      const vecinosValidos = territorioActual.frontera.filter(vecino =>                         // Los vecinos válidos son los vecinos del territorio actual
        vecino != territorioActual.nombre                                                       // sin el territorio actual
        && !Array.from(territoriosExplorados).some(territorio => territorio.nombre === vecino)  // que no han sido ya explorados
        && jugador.territorios.includes(vecino)                                                 // y pertenecen al jugador
      )

      territoriosPorExplorar.delete(territorioActual)
      territoriosExplorados.add(territorioActual)
      for (let nombre of vecinosValidos) {
        const territorio = territorios.find(territorio => territorio.nombre === nombre)
        if (territorio && territorio.nombre === destino) {
          console.log("Ruta encontrada desde el territorio origen hasta el territorio destino")
          return true
        } else if (territorio) {
          territoriosPorExplorar.add(territorio)
        }
      }
    }
    console.log("No se ha encontrado una ruta desde el territorio origen hasta el territorio destino")
    return false
  }

  const territorio = partida.mapa.flatMap(continent => continent.territorios).find(territorio => territorio.nombre === territorioOrigen)
  return isFriendlyReachable(partida.mapa, territorio, territorioDestino, partida.jugadores[numJugador])
}


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
// Ganamos si controlamos todos los territorios
async function tenemosGanador(partida){
  let abandonados = 0; let total = 0;
  for(let jugador of partida.jugadores){
    if(jugador.territorios.length == partida.mapa.flatMap(continent => continent.territorios).length){
      return jugador;
    } 
    if(jugador.abandonado) abandonados++;
    total++;
  }
  if(abandonados == total - 1){
    for(let jugador of partida.jugadores){
      if(!jugador.abandonado){
        return jugador;
      }
    }
  }

  return null;
}

// true <-> el jugador ha sido eliminado, es decir, ya no dispone de territorios
async function jugadorEliminado(partida, num){
  if(partida.jugadores[num].territorios.length == 0){
    return true;
  }
  return false;
}

// ----------------------------------------------------------------------------

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
  jugadoresEliminados
};