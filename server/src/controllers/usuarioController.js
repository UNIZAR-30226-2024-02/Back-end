const Usuario = require('../models/Usuario');

async function crearUsuario(idUsuario, password, correo) {
    console.log(idUsuario, password, correo)
    // Comprobar si el usuario o el correo electrónico ya existen en la base de datos
    const existingUser = await Usuario.findOne({ $or: [{ idUsuario }, { correo }] });
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
    const existingUser = await Usuario.findOne({ $or: [{ idUsuario }, { correo }] });
    return { valid: existingUser && existingUser.password === password, idUsuario: existingUser && existingUser.idUsuario };
}

// user1 -> identificador o email del usuario 1 
// user2 -> identificador del usuario 2
async function enviaSolicitud(user1, user2) {
    try {
        // Buscar al usuario de origen por idUsuario o correo
        const usuarioOrigen = await Usuario.findOne({
            $or: [
                { idUsuario: user1 },
                { correo: user1 },
            ],
        });

        // Verificar si el usuario de destino existe
        const usuarioDestino = await Usuario.findOne({ idUsuario: user2 });

        if (!usuarioDestino) {
            console.log('Usuario destino no encontrado.');
            return false; // No existe -> no podemos añadirlo como amigo :(
        }

        // Verificar si ya existe una solicitud previa
        if (usuarioDestino.solicitudes.includes(usuarioOrigen.idUsuario)) {
            console.log('Ya has enviado una solicitud previa a este usuario.');
            return false;
        }

        // Añadir la solicitud de amistad al usuario destino
        usuarioDestino.solicitudes.push(usuarioOrigen.idUsuario);
        await usuarioDestino.save();

        // ¿Notificar al usuario destino? 

        console.log(`Solicitud de amistad enviada de ${usuarioOrigen.idUsuario} a ${usuarioDestino.idUsuario}`);
        return true; // Añadido, ya tienes una solicitud de amistad pendiente, ahora solo falta que te acepten :(
    } catch (error) {
        console.error('Error al enviar la solicitud de amistad:', error.message);
        return false;
    }
}



async function getUsuariosByRanking() {
    return await Usuario.find().sort({ "elo": -1 });
}

module.exports = {
    crearUsuario,
    login,
    getUsuariosByRanking,
    enviaSolicitud
};