const Usuario = require('../models/Usuario');
const Skin = require('../models/Skin');
const { Partida } = require('../models/Partida');

/**
 * Esta función asíncrona crea un nuevo usuario.
 * @async
 * @function
 * @param {string} idUsuario - El ID del usuario.
 * @param {string} password - La contraseña del usuario.
 * @param {string} correo - El correo electrónico del usuario.
 * @throws {Error} Cuando el nombre de usuario o el correo electrónico ya están en uso.
 * @returns {Promise<void>} Devuelve una promesa que se resuelve cuando el nuevo usuario se guarda.
 */
async function crearUsuario(idUsuario, password, correo) {
    // Comprobar si el usuario o el correo electrónico ya existen en la base de datos
    const existingUser = await Usuario.findOne({ $or: [{ idUsuario }, { correo }] })
    if (existingUser) {
        //console.log('el usuario ya existe')
        throw new Error('El nombre de usuario o correo electrónico ya está en uso.')
    }
    // Crear un nuevo usuario y guardarlo en la base de datos
    const newUser = new Usuario({ idUsuario, password, correo })
    await newUser.save()
}

/**
 * Esta función asíncrona inicia sesión con un usuario existente.
 * @async
 * @function
 * @param {string} idUsuario - El ID del usuario.
 * @param {string} password - La contraseña del usuario.
 * @param {string} correo - El correo electrónico del usuario.
 * @returns {Promise<Object>} Devuelve una promesa que se resuelve con un objeto que contiene la validez del inicio de sesión y el ID del usuario.
 */
async function login(idUsuario, password, correo) {
    // Comprobar si el usuario o el correo electrónico ya existen en la base de datos
    const existingUser = await Usuario.findOne({ $or: [{ idUsuario }, { correo }] })
    return { valid: existingUser && existingUser.password === password, idUsuario: existingUser && existingUser.idUsuario }
}


/**
 * Esta función asíncrona crea una amistad entre dos usuarios.
 * @async
 * @function
 * @param {string} idUsuario - El ID del usuario que inicia la solicitud de amistad.
 * @param {string} idDestino - El ID del usuario al que se le envía la solicitud de amistad.
 * @returns {Promise<boolean>} Devuelve una promesa que se resuelve con un booleano que indica si la solicitud de amistad se creó con éxito.
 * @throws {Error} Cuando ocurre un error al crear la amistad.
 */
async function crearAmistad(idUsuario, idDestino) {
    try {

        // Verificar que no es sí mismo (soledad)
        if (idUsuario === idDestino) {
            console.log('No puedes estar en tu lista de amigos.')
            return false
        }

        // Verificar que el usuario de destino existe
        const usuarioDestino = await Usuario.findOne({ idUsuario: idDestino })
        console.log(idDestino)
        if (!usuarioDestino) {
            console.log('Usuario no encontrado.')
            return false
        }

        // ¿Verificar que no está bloqueado?

        // Verificar que no esté en la lista de amigos
        if (usuarioDestino.amigos.includes(idUsuario)) {
            console.log('Ya está en tu lista de amigos.')
            return false
        }

        // Verificar que no exista ya una solicitud
        if (usuarioDestino.solicitudes.includes(idUsuario)) {
            console.log('Ya has enviado una solicitud previa a este usuario.')
            return false
        }

        // Buscar al usuario de origen por idUsuario
        const usuarioOrigen = await Usuario.findOne({ idUsuario })

        // Si existe una solicitud de idDestino, pasa de solicitud a amigos para ambos
        if (usuarioOrigen.solicitudes.includes(idDestino)) {
            var index = usuarioOrigen.solicitudes.indexOf(idDestino)
            usuarioOrigen.solicitudes.splice(index, 1)

            usuarioOrigen.amigos.push(idDestino)
            console.log(usuarioOrigen)
            usuarioDestino.amigos.push(idUsuario)
            console.log(usuarioDestino)
            await usuarioOrigen.save()
            await usuarioDestino.save()
            console.log(`Tenías solicitud de ${idDestino} y ahora está en tu lista de amigos.`)
            // Notificar al usuario destino si está conectado
            return true
        }

        // Añadir la solicitud al usuario destino
        usuarioDestino.solicitudes.push(idUsuario)
        await usuarioDestino.save()

        // Notificar al usuario destino si está conectado

        console.log(`Solicitud enviada de ${idUsuario} a ${idDestino}`)
        return true
    } catch (error) {
        console.error('Error al crear la amistad:', error.message)
        return false
    }
}

/**
 * Esta función asíncrona cancela una amistad entre dos usuarios.
 * @async
 * @function
 * @param {string} idUsuario - El ID del usuario que inicia la cancelación de la amistad.
 * @param {string} idDestino - El ID del usuario con el que se cancela la amistad.
 * @returns {Promise<boolean>} Devuelve una promesa que se resuelve con un booleano que indica si la amistad se canceló con éxito.
 * @throws {Error} Cuando ocurre un error al cancelar la amistad.
 */
async function cancelarAmistad(idUsuario, idDestino) {
    try {

        // Verificar que no es sí mismo
        if (idUsuario === idDestino) {
            console.log('No puedes autocancelarte.')
            return false
        }

        // Verificar que el usuario de destino existe
        const usuarioDestino = await Usuario.findOne({ idUsuario: idDestino })
        console.log(idDestino)
        if (!usuarioDestino) {
            console.log('Usuario no encontrado.')
            return false
        }

        // ¿Verificar que no está bloqueado?

        // Si enviaste una solicitud, se cancela
        if (usuarioDestino.solicitudes.includes(idUsuario)) {
            var index = usuarioDestino.solicitudes.indexOf(idUsuario)
            usuarioDestino.solicitudes.splice(index, 1)
            console.log(usuarioDestino)
            await usuarioDestino.save()
            console.log('Solicitud de amistad cancelada.')
            // Notificar al usuario destino si está conectado
            return true
        }

        // Buscar al usuario de origen por idUsuario
        const usuarioOrigen = await Usuario.findOne({ idUsuario })

        // Si existe una solicitud de idDestino, se rechaza
        if (usuarioOrigen.solicitudes.includes(idDestino)) {
            var index = usuarioOrigen.solicitudes.indexOf(idDestino)
            usuarioOrigen.solicitudes.splice(index, 1)
            console.log(usuarioOrigen)
            await usuarioOrigen.save()
            console.log('Solicitud de amistad rechazada.')
            // Notificar al usuario destino si está conectado
            return true
        }

        // Si está en la lista de amigos, se borran mutuamente
        if (usuarioDestino.amigos.includes(idUsuario)) {
            var index = usuarioOrigen.amigos.indexOf(idDestino)
            usuarioOrigen.amigos.splice(index, 1)
            console.log(usuarioOrigen)

            var index = usuarioDestino.amigos.indexOf(idUsuario)
            usuarioDestino.amigos.splice(index, 1)
            console.log(usuarioDestino)

            await usuarioOrigen.save()
            await usuarioDestino.save()
            console.log(`${usuarioDestino.idUsuario} ya no está en tu lista de amigos.`)
            // Notificar al usuario destino si está conectado
            return true
        }

        console.log(`No existe ninguna relación entre ${idUsuario} y ${idDestino}`)
        return false
    } catch (error) {
        console.error('Error al cancelar la amistad:', error.message)
        return false
    }
}

/**
 * Esta función asíncrona obtiene los usuarios ordenados por su ranking.
 * @async
 * @function
 * @returns {Promise<Array>} Devuelve una promesa que se resuelve con un array de usuarios ordenados por su ranking.
 * @throws {Error} Cuando ocurre un error al obtener los usuarios.
 */
async function getUsuariosByRanking() {
    try {
        const usuarios = await Usuario.find().sort({ "elo": -1 }).select("idUsuario elo");
        return usuarios;
    } catch (error) {
        console.error("Error al obtener usuarios por ranking:", error);
        throw error;
    }
}


/**
 * Esta función asíncrona obtiene las skins equipadas por un usuario.
 * @async
 * @function
 * @param {string} idUsuario - El ID del usuario.
 * @returns {Promise<Object>} Devuelve una promesa que se resuelve con un objeto que contiene las skins equipadas por el usuario.
 * @throws {Error} Cuando ocurre un error al obtener las skins equipadas o si el usuario no se encuentra.
 */
async function getSkinsEquipadasByUsuario(idUsuario) {
    try {
        const usuario = await Usuario.findOne({ idUsuario });
      
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }
        const terreno = await Skin.findOne({ idSkin: new RegExp(usuario.terreno.type, 'i') });
        const setFichas = await Skin.findOne({ idSkin: new RegExp(usuario.setFichas.type, 'i') });
        const avatar = await Skin.findOne({ idSkin: new RegExp(usuario.avatar.type, 'i') });
        
  
        return { terreno, setFichas, avatar };
    } catch (error) {
        console.error('Error al obtener skins equipadas:', error.message);
        throw error;
    }
}

/**
 * Esta función asíncrona obtiene las skins en propiedad de un usuario.
 * @async
 * @function
 * @param {string} idUsuario - El ID del usuario.
 * @returns {Promise<Array>} Devuelve una promesa que se resuelve con un array que contiene las skins en propiedad del usuario.
 * @throws {Error} Cuando ocurre un error al obtener las skins en propiedad o si el usuario no se encuentra.
 */
async function getSkinsEnPropiedadByUsuario(idUsuario) {
    try {
        const usuario = await Usuario.findOne({ idUsuario });

        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }

        const idSkins = usuario.skins;
        let skinsEncontradas = [];

        for (const idskin of idSkins) {
            try {
                const tipoRegex = new RegExp(idskin, 'i');
                const skin = await Skin.findOne({ idSkin: tipoRegex });
                skinsEncontradas.push(skin);
            } catch (error) {
                console.error('Error al obtener la skin:', error.message);
            }
        }

        return skinsEncontradas;
    } catch (error) {
        console.error('Error al obtener skins equipadas:', error.message);
        throw error;
    }
}


/**
 * Esta función asíncrona modifica la skin equipada del usuario.
 * @async
 * @function
 * @param {string} idUsuario - El ID del usuario.
 * @param {string} idSkin - El ID de la skin.
 * @throws {Error} Cuando el usuario no se encuentra, no tiene la skin especificada, la skin no se encuentra en la base de datos, o el tipo de skin no es reconocido.
 */
async function setSkinEquipada(idUsuario, idSkin) {
    try {
      const usuario = await Usuario.findOne({ idUsuario });
    
      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }

      const tieneSkin = usuario.skins.includes(idSkin); // tiene la skin
  
      if (!tieneSkin) {
        throw new Error('El usuario no tiene la skin especificada');
      }
      const tipoRegex = new RegExp(idSkin, 'i');
      const skin = await Skin.findOne({ idSkin: tipoRegex });
  
      if (!skin) { // esto no debería suceder nunca a menos que haya hackeado la abse de datos
        throw new Error('Skin no encontrada en la base de datos');
      }
  
      const tipoSkin = skin.tipo;
      // TODO: Mirar bien el type missmatching y qué pasa si un usuario carece del campo avatar (quizá al registgrarse deba incializarses)
      switch (tipoSkin) {
        case 'Avatar': // hacerlo case insensitive?? 
          usuario.avatar = {type: skin.idSkin};
          break;
        case 'SetFichas':
          usuario.setFichas = {type: skin.idSkin};
          console.log(usuario.setFichas)
          break;
        case 'Terreno':
          usuario.terreno = {type: skin.idSkin};
          break;
        default:
          throw new Error('Tipo de skin no reconocido');
      }
      await usuario.save();
  
      console.log(`Skin equipada con éxito para el usuario ${idUsuario}.`);
    } catch (error) {
      console.error('Error al establecer la skin equipada:', error.message);
      throw error;
    }
}
  
/**
 * Esta función asíncrona obtiene los puntos (dinero) de un usuario.
 * @async
 * @function
 * @param {string} idUsuario - El ID del usuario.
 * @returns {Promise<number>} Devuelve una promesa que se resuelve con los puntos del usuario.
 * @throws {Error} Cuando ocurre un error al obtener los puntos del usuario.
 */
async function getMoney(idUsuario) {
    try {
        const usuario = await Usuario.findOne({ idUsuario });
        return usuario.puntos;
    } catch (error) {
        console.error('Error al obtener el dinero del usuario:', error.message);
        throw error;
    }
}

/**
 * Esta función asíncrona obtiene los amigos de un usuario.
 * @async
 * @function
 * @param {string} idUsuario - El ID del usuario.
 * @returns {Promise<Array>} Devuelve una promesa que se resuelve con un array que contiene los amigos del usuario.
 * @throws {Error} Cuando ocurre un error al obtener los amigos del usuario.
 */
async function getFriends(idUsuario) {
    try {
        const usuario = await Usuario.findOne({ idUsuario });
        return usuario.amigos;
    }
    catch (error) {
        console.error('Error al obtener la lista de amigos:', error.message);
        throw error;
    }
}

/**
 * Esta función asíncrona obtiene las solicitudes de un usuario.
 * @async
 * @function
 * @param {string} idUsuario - El ID del usuario.
 * @returns {Promise<Array>} Devuelve una promesa que se resuelve con un array que contiene las solicitudes del usuario.
 * @throws {Error} Cuando ocurre un error al obtener las solicitudes del usuario.
 */
async function getSolicitudes(idUsuario) {
    try {
        const usuario = await Usuario.findOne({ idUsuario });
        return usuario.solicitudes;
    }
    catch (error) {
        console.error('Error al obtener la lista de amigos:', error.message);
        throw error;
    }
}

/**
 * Esta función asíncrona obtiene las invitaciones de un usuario.
 * @async
 * @function
 * @param {string} idUsuario - El ID del usuario.
 * @returns {Promise<Array>} Devuelve una promesa que se resuelve con un array que contiene las invitaciones del usuario.
 * @throws {Error} Cuando ocurre un error al obtener las invitaciones del usuario.
 */
async function getInvitaciones(idUsuario) { 
    try {
        const usuario = await Usuario.findOne({ idUsuario });
        const invitaciones = usuario.invitaciones;
        console.log(invitaciones)

        const partidas = await Promise.all(invitaciones.map(async (invitacion) => {
            console.log(invitacion)
            return await Partida.findById(invitacion)
        }));

        return partidas;
    }
    catch (error) {
        console.error('Error al obtener la lista de amigos:', error.message);
        throw error;
    }
}

/**
 * Esta función asíncrona obtiene el avatar de un usuario.
 * @async
 * @function
 * @param {string} idUsuario - El ID del usuario.
 * @returns {Promise<Object>} Devuelve una promesa que se resuelve con el avatar del usuario.
 * @throws {Error} Cuando ocurre un error al obtener el avatar del usuario.
 */
async function obtenerAvatar(idUsuario){
    try {
        const usuario = await Usuario.findOne({ idUsuario });
        console.log(usuario.avatar.type)
        const avatar = await Skin.findOne({ idSkin: new RegExp(usuario.avatar.type, 'i') });
        console.log(avatar)
        return avatar;
    } catch (error) {
        console.error('Error al obtener el avatar del usuario:', error.message);
        throw error;
    }
}

/**
 * Esta función asíncrona obtiene el terreno de un usuario.
 * @async
 * @function
 * @param {string} idUsuario - El ID del usuario.
 * @returns {Promise<Object>} Devuelve una promesa que se resuelve con el terreno del usuario.
 * @throws {Error} Cuando ocurre un error al obtener el terreno del usuario.
 */
async function obtenerTerreno(idUsuario){
    try {
        const usuario = await Usuario.findOne({ idUsuario });
        console.log(usuario.terreno.type)
        const terreno = await Skin.findOne({ idSkin: new RegExp(usuario.terreno.type, 'i') });
        console.log(terreno)
        return terreno;
    } catch (error) {
        console.error('Error al obtener el terreno del usuario:', error.message);
        throw error;
    }
}

/**
 * Esta función asíncrona obtiene el perfil de un usuario.
 * @async
 * @function
 * @param {string} idUsuario - El ID del usuario.
 * @returns {Promise<Object>} Devuelve una promesa que se resuelve con el perfil del usuario.
 * @throws {Error} Cuando ocurre un error al obtener el perfil del usuario.
 */
async function getPerfil(idUsuario) {
    try {
        const usuario = await Usuario.findOne({ idUsuario }).select("idUsuario avatar puntos elo")
        const avatar = await Skin.findOne({ idSkin: new RegExp(usuario.avatar.type, 'i') })
        return { nombre: usuario.idUsuario, avatar, puntos: usuario.puntos, elo: usuario.elo }
    } catch (error) {
        console.error("Error al obtener usuarios por ranking:", error);
        throw error;
    }
}

/**
 * Esta función asíncrona obtiene el set de fichas de un usuario.
 * @async
 * @function
 * @param {string} idUsuario - El ID del usuario.
 * @returns {Promise<Object>} Devuelve una promesa que se resuelve con el set de fichas del usuario.
 * @throws {Error} Cuando ocurre un error al obtener el set de fichas del usuario.
 */
async function obtenerSetFichas(idUsuario){
    try {
        const usuario = await Usuario.findOne({ idUsuario });
        const fichas = await Skin.findOne({ idSkin: new RegExp(usuario.setFichas.type, 'i') });
        console.log('Fichas', fichas)
        return fichas;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    crearUsuario,
    login,
    getUsuariosByRanking,
    crearAmistad,
    cancelarAmistad,
    getSkinsEquipadasByUsuario,
    getSkinsEnPropiedadByUsuario,
    setSkinEquipada,
    getMoney,
    getFriends,
    getSolicitudes,
    getInvitaciones,
    obtenerAvatar,
    obtenerTerreno,
    getPerfil,
    obtenerSetFichas
};
