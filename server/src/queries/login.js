const Usuario = require("../models/Usuario")

async function login(username, password, email) {
    // Comprobar si el usuario o el correo electrónico ya existen en la base de datos
    const existingUser = await Usuario.findOne({ $or: [{ idUsuario: username }, { correo: email }] });
    return existingUser && existingUser.pass === password;
}

module.exports = login
