const express = require('express')
const router = express.Router()
const { crearPartida } = require('../controllers/partidaController');
const jwt = require('jsonwebtoken');

// petición post desde <url>/register desencadena esta acción
// los parámetros van en el body de la request
router.post('/', async (req, res) => {
  console.log('El crear partida tira')
  console.log(req.body)
  try {
        const {privacidad, user, num, nombre, password } = req.body
        //*** */ Estaría bien meter esto a una función ya que lo utilizarmeos mucho ***/
        const token = req.headers['authorization']; // CREO que se almacena aquí 
        if (!token) {
            return res.status(401).json({ mensaje: 'Token no proporcionado' }); // front redirects to login
        }
        jwt.verify(token, SECRET_KEY, (error, usuario) => {
            if (error) {
            return res.status(403).json({ mensaje: 'Token no válido' }); // front redirects to login, el usuario no debe saber la causa
            }
        });
    
      if(privacidad){
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
