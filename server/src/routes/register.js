const express = require('express')
const router = express.Router()
const { crearUsuario } = require('../controllers/usuarioController');

// petición post desde <url>/register desencadena esta acción
// los parámetros van en el body de la request
router.post('/', async(req, res) => {
  console.log('El registro tira')
  console.log(req.body)
  try {
      const { idUsuario, password, correo } = req.body
      await crearUsuario(idUsuario, password, correo)
      console.log('Usuario registrado exitosamente')
      res.status(201).json({ message: 'Usuario registrado exitosamente' })
  } catch (error) {
      console.log(error.message)
      res.status(400).json({ error: error.message })
  }
})

module.exports = router
