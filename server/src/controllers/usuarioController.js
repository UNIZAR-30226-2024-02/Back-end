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

async function enviarSolicitud(idUsuario, idDestino) {
    try {
        // Verificar que el usuario de destino existe
        const usuarioDestino = await Usuario.findOne({ idUsuario: idDestino })
        if (!usuarioDestino) {
            console.log('Usuario no encontrado.')
            return false // No existe -> no podemos añadirlo a la lista de amigos :(
        }

        // Buscar al usuario de origen por idUsuario
        const usuarioOrigen = await Usuario.findOne({ idUsuario })

        // Verificar que no es sí mismo (soledad)
        if (idUsuario === idDestino) {
            console.log('No puedes estar en tu lista de amigos.')
            return false
        }

        // ¿Verificar que no está bloqueado?

        // Verificar que no esté en la lista de amigos
        if (usuarioOrigen.amigos.includes(idDestino)) {
            console.log('Ya está en tu lista de amigos.')
            return false
        }

        // Verificar que no exista una solicitud de usuarioDestino
        if (usuarioOrigen.solicitudes.includes(idDestino)) {
            // por alguna razón, hay que hacerlo a mano...
            var index = usuarioOrigen.solicitudes.indexOf(idDestino)
            usuarioOrigen.solicitudes.splice(index, 1)

            usuarioOrigen.amigos.push(idDestino)
            console.log(usuarioOrigen)
            usuarioDestino.amigos.push(idUsuario)
            console.log(usuarioDestino)
            await usuarioOrigen.save()
            await usuarioDestino.save()
            return true
        }

        // Verificar que no exista ya una solicitud
        if (usuarioDestino.solicitudes.includes(usuarioOrigen.idUsuario)) {
            console.log('Ya has enviado una solicitud previa a este usuario.')
            return false
        }

        // Añadir la solicitud al usuario destino
        usuarioDestino.solicitudes.push(idUsuario)
        await usuarioDestino.save()

        // Notificar al usuario destino si está conectado

        console.log(`Solicitud enviada de ${idUsuario} a ${usuarioDestino.idUsuario}`)
        return true // Añadido, ya tienes una solicitud de amistad pendiente, ahora solo falta que te acepten :(
    } catch (error) {
        console.error('Error al enviar la solicitud:', error.message)
        return false
    }
}

async function getUsuariosByRanking() {
    return await Usuario.find().sort({ "elo": -1 })
}

module.exports = {
    crearUsuario,
    login,
    getUsuariosByRanking,
    enviarSolicitud
};