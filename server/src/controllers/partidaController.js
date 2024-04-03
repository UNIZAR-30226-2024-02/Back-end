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

    if (partida.jugadores.length >= partida.maxJugadores) {
      console.log('La partida está llena.')
      return false
    }

    if (partida.jugadores.includes(user)) {
      console.log('Ya estás en esta partida.')
      return false
    }

    if (usuarioUnir.invitaciones.includes(idPartida)) {
      partida.jugadores.push(user)
      await partida.save()
      return true
    }

    if (partida.password && partida.password != password) { // Si tiene contraseña, deben coincidir. Si le pasas una contraseña cuando es pública, no la comprueba.
      console.log('Contraseña incorrecta.')
      return false
    }

    console.log("HOLA")
    console.log(user)
    const jugador = new Jugador({ usuario: user })
    console.log(jugador)
    partida.jugadores.push(jugador)
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

// Dado el object id de una partida (id unico de la bdd) inicia esta.
async function iniciarPartida(partidaOID) {
  try {
      const partida = await Partida.findById(partidaOID);
      if (partida) {
          partida.fechaInicio = new Date();

          await inicializarEstado(partida);

          await partida.save();

          console.log("Partida iniciada correctamente:", partida);
      } else {
          console.error("Partida a iniciar no encontrada");
      }
  } catch (error) {
      console.error("Error al iniciar partida:", error);
      throw error;
  }
}

async function inicializarEstado(partida) {
  // Barajeamos aleatoriamente el array de jugadores de la partida
  for (let i = partida.jugadores.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [partida.jugadores[i], partida.jugadores[j]] = [partida.jugadores[j], partida.jugadores[i]];
  }

  // Actualizamos el campo turno de cada jugador
  for (let i = 0; i < partida.jugadores.length; i++) {
    partida.jugadores[i].turno = i + 1; 
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

  const Alaska = new Territorio({ nombre: "ALASKA", frontera: ["ALBERTA", "TERRITORIOS DEL NOROESTE", "KAMCHATKA"]});
  const Alberta = new Territorio({ nombre: "ALBERTA", frontera: ["ALASKA", "ESTADOS UNIDOS OESTE" , "ONTARIO", "TERRITORIOS DEL NOROESTE"]});
  const AmericaCentral = new Territorio({ nombre: "AMERICA CENTRAL", frontera: ["ESTADOS UNIDOS ESTE", "ESTADOS UNIDOS OESTE", "VENEZUELA"]});
  const EstadosUnidosEste = new Territorio({ nombre: "ESTADOS UNIDOS ESTE", frontera: ["ALBERTA", "AMERICA CENTRAL", "ESTADOS UNIDOS OESTE", "ONTARIO"]});
  const Groenlandia = new Territorio({ nombre: "GROENLANDIA", frontera: ["TERRITORIOS DEL NOROESTE", "ONTARIO", "QUEBEC", "ISLANDIA"]});
  const TerritoriosDelNoroeste = new Territorio({ nombre: "TERRITORIOS DEL NOROESTE", frontera: ["ALASKA", "ALBERTA", "ONTARIO", "GROENLANDIA"]});
  const Ontario = new Territorio({ nombre: "ONTARIO", frontera: ["TERRITORIOS DEL NOROESTE", "ALASKA", "QUEBEC", "GROENLANDIA", "ESTADOS UNIDOS OESTE", "ESTADOS UNIDOS ESTE"]});
  const Quebec = new Territorio({ nombre: "QUEBEC", frontera: ["ONTARIO", "ESTADOS UNIDOS ESTE", "GROENLANDIA"]});
  const EstadosUnidosOeste = new Territorio({ nombre: "ESTADOS UNIDOS OESTE", frontera: ["ESTADOS UNIDOS ESTE", "ONTARIO", "QUEBEC", "AMERICA CENTRAL"]});
  const Argentina = new Territorio({ nombre: "ARGENTINA", frontera: ["PERU", "BRASIL"]});
  const Brasil = new Territorio({ nombre: "BRASIL", frontera: ["ARGENTINA", "VENEZUELA", "PERU", "AFRICA NORTE"]});
  const Peru = new Territorio({ nombre: "PERU", frontera: ["ARGENTINA", "VENEZUELA", "BRASIL"]});
  const Venezuela = new Territorio({ nombre: "VENEZUELA ", frontera: ["AMERICA CENTRAL", "PERU", "BRASIL"]});
  const GranBretana = new Territorio({ nombre: "GRAN BRETANA", frontera: ["EUROPA OCCIDENTAL", "EUROPA NORTE", "ESCANDINAVIA", "ISLANDIA"]});
  const Islandia = new Territorio({ nombre: "ISLANDIA", frontera: ["GRAN BRETANA", "GROENLANDIA", "ESCANDINAVIA"]});
  const EuropaNorte = new Territorio({ nombre: "EUROPA NORTE", frontera: ["EUROPA SUR", "EUROPA OCCIDENTAL", "RUSIA", "GRAN BRETANA", "ESCANDINAVIA"]});
  const Escandinavia = new Territorio({ nombre: "ESCANDINAVIA", frontera: ["RUSIA", "EUROPA NORTE", "GRAN BRETANA", "ISLANDIA"]});
  const EuropaSur = new Territorio({ nombre: "EUROPA SUR", frontera: ["EUROPA OCCIDENTAL", "EUROPA NORTE", "RUSIA", "AFRICA NORTE", "EGIPTO"]});
  const Rusia = new Territorio({ nombre: "RUSIA", frontera: ["ESCANDINAVIA", "EUROPA NORTE", "EUROPA SUR", "URAL", "AFGANISTAN", "ORIENTE MEDIO"]});
  const EuropaOccidental = new Territorio({ nombre: "EUROPA OCCIDENTAL", frontera: ["EUROPA NORTE", "EUROPA SUR", "AFRICA NORTE", "GRAN BRETANA"]});
  const Congo = new Territorio({ nombre: "CONGO", frontera: ["AFRICA ORIENTAL", "SUDAFRICA", "AFRICA NORTE"]});
  const AfricaOriental = new Territorio({ nombre: "AFRICA ORIENTAL", frontera: ["EGIPTO", "AFRICA NORTE", "CONGO", "SUDAFRICA", "MADAGASCAR"]});
  const Egipto = new Territorio({ nombre: "EGIPTO", frontera: ["AFRICA NORTE", "AFRICA ORIENTAL", "EUROPA SUR"]});
  const Madagascar = new Territorio({ nombre: "MADAGASCAR", frontera: ["AFRICA ORIENTAL", "SUDAFRICA"]});
  const AfricaNorte = new Territorio({ nombre: "AFRICA NORTE", frontera: ["EGIPTO", "BRASIL", "AFRICA ORIENTAL", "CONGO"]});
  const Sudafrica = new Territorio({ nombre: "SUDAFRICA", frontera: ["MADAGASCAR", "CONGO", "AFRICA ORIENTAL"]});
  const Afganistan = new Territorio({ nombre: "AFGANISTAN", frontera: ["RUSIA", "URAL", "INDIA", "ORIENTE MEDIO", "CHINA"]});
  const China = new Territorio({ nombre: "CHINA", frontera: ["INDIA", "SUDESTE ASIATIOCO", "MONGOLIA", "SIBERIA", "URAL", "AFGANISTAN"]});
  const India = new Territorio({ nombre: "INDIA", frontera: ["CHINA", "ORIENTE MEDIO", "AFGANISTAN", "SUDESTE ASIATICO"]});
  const Irkutsk = new Territorio({ nombre: "IRKUTSK", frontera: ["YAKUTSK", "SIBERIA", "MONGOLIA", "KAMCHATKA"]});
  const Japon = new Territorio({ nombre: "JAPON", frontera: ["KAMCHATKA", "MONGOLIA"]});
  const Kamchatka = new Territorio({ nombre: "KAMCHATKA", frontera: ["ALASKA", "YAKUTSK", "IRKUTSK", "MONGOLIA"]});
  const OrienteMedio = new Territorio({ nombre: "ORIENTE MEDIO", frontera: ["RUSIA", "AFGANISTAN", "INDIA", "EGIPTO"]});
  const Mongolia = new Territorio({ nombre: "MONGOLIA", frontera: ["IRKUTSK", "CHINA", "JAPON", "SIBERIA"]});
  const SudesteAsiatico = new Territorio({ nombre: "SUDESTE ASIATICO", frontera: ["CHINA", "INDIA", "INDONESIA"]});
  const Siberia = new Territorio({ nombre: "SIBERIA", frontera: ["IRKUTSK", "YAKUTSK", "MONGOLIA", "CHINA", "URAL"]});
  const Ural = new Territorio({ nombre: "URAL", frontera: ["SIBERIA", "RUSIA", "AFGANISTAN"]});
  const Yakutsk = new Territorio({ nombre: "YAKUTSK", frontera: ["IRKUTSK", "KAMCHATKA", "SIBERIA"]});
  const Indonesia = new Territorio({ nombre: "INDONESIA", frontera: ["SUDESTE ASIATICO", "NUEVA GUINEA", "AUSTRALIA OCCIDENTAL"]});
  const NuevaGuinea = new Territorio({ nombre: "NUEVA GUINEA", frontera: ["AUSTRALIA OCCIDENTAL", "AUSTRALIA ORIENTAL", "INDONESIA"]});
  const AustraliaOccidental = new Territorio({ nombre: "AUSTRALIA OCCIDENTAL", frontera: ["AUSTRALIA ORIENTAL", "INDONESIA", "NUEVA GUINEA"]});
  const AustraliaOriental = new Territorio({ nombre: "AUSTRALIA ORIENTAL", frontera: ["AUSTRALIA OCCIDENTAL", "NUEVA GUINEA"]});

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

  // Create continents
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

}


async function salirPartida(usuarioID, partidaOID) {
  try {
    const partida = await Partida.findById(partidaOID);
    
    if (partida) {
      // Verificar si el usuario está en la partida
      const index = partida.jugadores.indexOf(usuarioID);
      if (index !== -1) {
        // Si la partida no ha comenzado (fechaInicio es null), quitar al usuario de la partida
        if (partida.fechaInicio === null) {
          partida.jugadores.splice(index, 1);
          await partida.save();
          console.log("Usuario sacado de la partida", partida);
        } else {
          // Si la partida ha comenzado, marcar al usuario como abandonado
          const jugador = partida.jugadores[index];
          jugador.abandonado = true;
          await partida.save();
          console.log("Usuario marcado como abandonado en la partida", partida);
        }
      } else {
        console.error("El usuario no está en la partida");
      }
    } else {
      console.error("Partida no encontrada");
    }
  } catch (error) {
    console.error("Error al sacar al usuario de la partida", error);
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
  iniciarPartida
};