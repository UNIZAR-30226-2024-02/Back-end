const Usuario = require("../models/Usuario")

async function crearUsuario(username, password, email) {
    console.log(username, password, email)
    // Comprobar si el usuario o el correo electrónico ya existen en la base de datos
    const existingUser = await Usuario.findOne({ $or: [{ idUsuario: username }, { correo: email }] });
    if (existingUser) {
        console.log('el usuario ya existe')
        throw new Error('El nombre de usuario o correo electrónico ya está en uso.')
    }
    // Crear un nuevo usuario y guardarlo en la base de datos
    const newUser = new Usuario({ idUsuario: username, pass: password, correo: email })
    await newUser.save()
}

module.exports = crearUsuario