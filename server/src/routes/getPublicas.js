const express = require('express')
const router = express.Router()
const { getPartidasDisponibles, iniciarPartida } = require('../controllers/partidaController');

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


  router.post('/iniciarpartida', async (req, res) => {
    try {
      const token = req.headers['authorization'];
      const user = obtenerUsuarioDesdeToken(token)
      if (!user) return res.status(401).json({ mensaje: 'Token no proporcionado o inválido' })
  
      //CAMBIARIA AQUI A PASAR EL ID DE PARTIDA, PERO NO EXISTE
      let nombre = req.body.nombrePartida;
      let password = req.body.password;
      
      const partidas = await iniciarPartida(nombre, password);
      if (!partidas) {
        return res.status(404).json({ message: 'La partida no existe o ya ha sido iniciada' });
      }
      res.status(200).json({ message: 'Partida iniciada correctamente'});
    } catch (error) {
      console.error("Error al iniciar partida:", error);
      res.status(500).json({ error: error.message });
    }
  });
module.exports = router
