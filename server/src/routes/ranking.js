const express = require('express')
const router = express.Router()
const { getUsuariosByRanking } = require('../controllers/usuarioController');
const obtenerUsuarioDesdeToken = require('../auth/auth');

router.get('/', async(req, res) => {
  const token = req.headers['authorization'];
  const user = obtenerUsuarioDesdeToken(token)
  if(!user)
    return res.status(401).json({ mensaje: 'Token no proporcionado o inválido' })

  try {
      const ranking = await getUsuariosByRanking()
      res.status(201).json(ranking)
  
    } catch (error) {
      console.log(error.message)
      res.status(400).json({ error: error.message })
    }
  })

module.exports = router
