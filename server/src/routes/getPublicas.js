const express = require('express')
const router = express.Router()
const { getPartidasDisponibles } = require('../controllers/partidaController');
const obtenerUsuarioDesdeToken = require('../auth/auth');

router.get('/', async(req, res) => {
    const token = req.headers['authorization'];
    const user = obtenerUsuarioDesdeToken(token)
    if(!user)
      return res.status(401).json({ mensaje: 'Token no proporcionado o inválido' })
    
    try {
      const disp = await getPartidasDisponibles()
      res.status(201).json(disp)
  
    } catch (error) {
      console.log(error.message)
      res.status(400).json({ error: error.message })
    }
  })

module.exports = router
