const express = require('express');
const router = express.Router();
const Usuario = require('../models/Usuario');

// petición post desde <url>/register desencadena esta acción
// los parámetros van en el body de la request
router.post('/', async (req, res) => {
    console.log('El registro tira');
    console.log(req.body);
    try {
    const { username, password, email } = req.body;
    // comprobar si existe consultando en la bdd si existe uno con su username o email
    const existingUser = await Usuario.findOne({ $or: [{ idUsuario: username }, { Correo: email }] });
    console.log(existingUser);
    if (existingUser) { // y si existe fatal error y no lo añadimos
        console.log('el usuario ya existe');
        return res.status(400).json({ error: 'El nombre de usuario o correo electrónico ya está en uso.' });
    } 
    const newUser = new Usuario({ idUsuario: username, Pass: password, Correo: email }); // lo añadimos
    await newUser.save(); // y se guarda en la bdd
    res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
