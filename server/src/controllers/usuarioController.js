const Usuario = require('../models/Usuario');
const Skin = require('../models/Skin');
const { Partida } = require('../models/Partida');

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

async function login(idUsuario, password, correo) {
    // Comprobar si el usuario o el correo electrónico ya existen en la base de datos
    const existingUser = await Usuario.findOne({ $or: [{ idUsuario }, { correo }] })
    return { valid: existingUser && existingUser.password === password, idUsuario: existingUser && existingUser.idUsuario }
}

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

async function getUsuariosByRanking() {
    try {
        const usuarios = await Usuario.find().sort({ "elo": -1 }).select("idUsuario elo");
        return usuarios;
    } catch (error) {
        console.error("Error al obtener usuarios por ranking:", error);
        throw error;
    }
}

// obtiene las skins que tiene equipadas el usuario

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

// obtiene las skins en propiedad que tiene el usuario
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


// modifica la skin equipada del usuario
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
  
async function getMoney(idUsuario) {
    try {
        const usuario = await Usuario.findOne({ idUsuario });
        return usuario.puntos;
    } catch (error) {
        console.error('Error al obtener el dinero del usuario:', error.message);
        throw error;
    }
}

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
    obtenerTerreno
};
