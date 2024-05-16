const express = require('express')
const router = express.Router()
const { crearUsuario } = require('../controllers/usuarioController');
const jwt = require('jsonwebtoken');

// petición post desde <url>/register desencadena esta acción
// los parámetros van en el body de la request
router.post('/', async(req, res) => {
  console.log('El registro tira')
  console.log(req.body)
  try {
      let { idUsuario, password, correo } = req.body
      await crearUsuario(idUsuario, password, correo)
      idUsuario = idUsuario.toLowerCase()
      const token = jwt.sign({ idUsuario: idUsuario }, 'claveSecreta', { expiresIn: '1h' });
      res.status(201).json({ message: 'Usuario registrado exitosamente', token,  idUsuario: idUsuario})
  } catch (error) {
      console.log(error.message)
      res.status(400).json({ error: error.message })
  }
})

module.exports = router
