const express = require('express')
const router = express.Router()
const { crearPartida } = require('../controllers/partidaController');
const obtenerUsuarioDesdeToken = require('../auth/auth');

// petición post desde <url>/register desencadena esta acción
// los parámetros van en el body de la request
router.post('/', async (req, res) => {
  console.log('El crear partida tira')
  console.log(req.body)
  try {
      let {privacidad, num, nombre, password } = req.body
      
      const token = req.headers['authorization'];
      const user = obtenerUsuarioDesdeToken(token)
      if(!user)
        return res.status(401).json({ mensaje: 'Token no proporcionado o inválido' })
  
      if(!privacidad){ // if es publica
        password=null; // por si acaso xd
      }
    
      const succ = await crearPartida(privacidad, user, num, nombre, password)
      if (succ.valid) {
        res.status(200).json({ message: 'Partida inició correctamente' })
      } else {
        res.status(404).json({ message: 'Fatal error' })
      }
  } catch (error) {
      console.log(error.message)
      res.status(500).json({ error: error.message })
  }
});

module.exports = router
