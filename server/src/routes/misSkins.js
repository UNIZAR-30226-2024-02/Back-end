const express = require('express')
const router = express.Router()
const { getSkinsEquipadasByUsuario,
        getSkinsEnPropiedadByUsuario,
        setSkinEquipada, 
        obtenerAvatar
      } = require('../controllers/usuarioController');
const obtenerUsuarioDesdeToken = require('../auth/auth');

router.get('/equipadas', async(req, res) => {
  const token = req.headers['authorization'];
  const user = obtenerUsuarioDesdeToken(token)
  if(!user)
    return res.status(401).json({ mensaje: 'Token no proporcionado o inválido' })

  try {
      const skinsEquipadas = await getSkinsEquipadasByUsuario(user)
      res.status(201).json(skinsEquipadas)
  
    } catch (error) {
      console.log(error.message)
      res.status(400).json({ error: error.message })
    }
})

router.get('/enPropiedad', async(req, res) => {
    const token = req.headers['authorization'];
    const user = obtenerUsuarioDesdeToken(token)
    if(!user)
      return res.status(401).json({ mensaje: 'Token no proporcionado o inválido' })
  
    try {
        const skinsEnPropiedad = await getSkinsEnPropiedadByUsuario(user)
        res.status(201).json(skinsEnPropiedad)
    
      } catch (error) {
        console.log(error.message)
        res.status(400).json({ error: error.message })
      }
})

// req.body {skinAEquipar: idSkin}
router.post('/equipar', async(req, res) => {
  const token = req.headers['authorization'];
  const user = obtenerUsuarioDesdeToken(token)
  if(!user)
    return res.status(401).json({ mensaje: 'Token no proporcionado o inválido' })

  try {
      const {skinAEquipar} = req.body; 
      await setSkinEquipada(user, skinAEquipar)
      res.status(201).json({message: 'La skin se ha equipado con éxito'})
  
    } catch (error) {
      console.log(error.message)
      res.status(400).json({ error: error.message })
    }
})

router.get('/obtenerAvatar/:id', async(req, res) => {
  const token = req.headers['authorization'];
  const user = obtenerUsuarioDesdeToken(token)
  if(!user)
    return res.status(401).json({ mensaje: 'Token no proporcionado o inválido' })
  try {
    userId = req.params.id
    const avatar = await obtenerAvatar(userId)
    res.status(201).json(avatar)
  } catch (error) {
    console.log(error.message)
    res.status(400).json({ error: error.message })
  }
})

module.exports = router
