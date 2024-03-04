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
    getUsuariosByRanking
};