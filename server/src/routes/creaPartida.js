const express = require('express')
const router = express.Router()
const { crearPartida, join, invite } = require('../controllers/partidaController');
const obtenerUsuarioDesdeToken = require('../auth/auth');

// petición post desde <url>/register desencadena esta acción
// los parámetros van en el body de la request
router.post('/', async (req, res) => {
  console.log('El crear partida tira')
  console.log(req.body)
  try {
      let { nombre, password, numJugadores } = req.body
      const token = req.headers['authorization'];
      const user = obtenerUsuarioDesdeToken(token)
      if(!user)
        return res.status(401).json({ mensaje: 'Token no proporcionado o inválido' })

      const succ = await crearPartida(user, nombre, password, numJugadores)
      if (succ) {
        res.status(200).json({ message: 'Partida creada correctamente', idPartida: succ })
      } else {
        res.status(400).json({ message: '¡Ya existe una partida con estas credenciales!' })
      }
  } catch (error) {
      console.log(error.message)
      res.status(500).json({ error: error.message })
  }
});

router.put('/invite', async (req, res) => {
  console.log(req.body)
  try {
    let { user, idPartida } = req.body
    const token = req.headers['authorization'];
    const sender = obtenerUsuarioDesdeToken(token)
    if(!sender)
      return res.status(401).json({ mensaje: 'Token no proporcionado o inválido' })

    const succ = await invite(user, idPartida)
    if (succ) {
      res.status(200).json({ message: 'Invitado correctamente' })
    } else {
      res.status(400).json({ message: 'Error invitando' })
    }
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: error.message })
  }
});

router.put('/join', async (req, res) => {
  console.log(req.body)
  try {
    let { idPartida, password } = req.body
    const token = req.headers['authorization'];
    const user = obtenerUsuarioDesdeToken(token)
    if(!user)
      return res.status(401).json({ mensaje: 'Token no proporcionado o inválido' })

    const succ = await join(user, idPartida, password)
    if (succ) {
      res.status(200).json({ message: 'Unido correctamente' })
    } else {
      res.status(400).json({ message: 'Error uniendo' })
    }
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: error.message })
  }
});

module.exports = router
