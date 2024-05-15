const {Partida, Jugador, Territorio, Carta, Continente} = require('../models/Partida');
const {Usuario} = require('../models/Usuario');
const {Chat} = require('../models/Chat');
const { findById } = require('../models/Skin');



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

  module.exports = {
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
  };