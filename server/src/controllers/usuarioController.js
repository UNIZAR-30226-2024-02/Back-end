const Usuario = require('../models/Usuario');

async function crearUsuario(idUsuario, password, correo) {
    console.log(idUsuario, password, correo)
    // Comprobar si el usuario o el correo electrónico ya existen en la base de datos
    const existingUser = await Usuario.findOne({ $or: [{ idUsuario }, { correo }] })
    if (existingUser) {
        console.log('el usuario ya existe')
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

        // Si existe una solicitud de idDestino, se cancela
        if (usuarioOrigen.solicitudes.includes(idDestino)) {
            var index = usuarioOrigen.solicitudes.indexOf(idDestino)
            usuarioOrigen.solicitudes.splice(index, 1)
            console.log(usuarioOrigen)
            await usuarioOrigen.save()
            console.log('Solicitud de amistad cancelada.')
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


module.exports = {
    crearUsuario,
    login,
    getUsuariosByRanking,
    crearAmistad,
    cancelarAmistad
};