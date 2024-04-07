const express = require('express')
const router = express.Router()
const { getPartidasDisponibles, getHistorico } = require('../controllers/partidaController');
const obtenerUsuarioDesdeToken = require('../auth/auth');

router.get('/', async(req, res) => {
  const token = req.headers['authorization'];
  const user = obtenerUsuarioDesdeToken(token)
  if(!user)
    return res.status(401).json({ mensaje: 'Token no proporcionado o inválido' })
  
  try {
    const disp = await getPartidasDisponibles()
    res.status(200).json(disp)

  } catch (error) {
    console.log(error.message)
    res.status(400).json({ error: error.message })
  }
})

router.get('/historico', async(req, res) => {
  const token = req.headers['authorization'];
  const user = obtenerUsuarioDesdeToken(token)
  if(!user)
    return res.status(401).json({ mensaje: 'Token no proporcionado o inválido' })
  
  try {
    const historico = await getHistorico(user)
    if (historico.length != 0)
      res.status(200).json(historico)
    else
      res.status(204).json(historico)

  } catch (error) {
    console.log(error.message)
    res.status(400).json({ error: error.message })
  }
})

module.exports = router
