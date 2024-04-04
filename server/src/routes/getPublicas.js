const express = require('express')
const router = express.Router()
const { getPartidasDisponibles, getHistorico } = require('../controllers/partidaController');
const obtenerUsuarioDesdeToken = require('../auth/auth');
const { getInvitaciones } = require('../controllers/usuarioController');

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

router.get('/invitaciones', async(req, res) => {
  const token = req.headers['authorization'];
  const user = obtenerUsuarioDesdeToken(token)
  if(!user)
    return res.status(401).json({ mensaje: 'Token no proporcionado o inválido' })
  try{
    const invitaciones = await getInvitaciones(user)
    res.status(200).json({'Partidas': invitaciones})
  } catch (error) {
    console.log(error.message)
    res.status(400).json({ error: error.message })
  }
})

module.exports = router
