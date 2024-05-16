const express = require('express')
const router = express.Router()
const { login } = require('../controllers/usuarioController');
const jwt = require('jsonwebtoken');

// petición post desde <url>/register desencadena esta acción
// los parámetros van en el body de la request
router.post('/', async (req, res) => {
  console.log('El login tira')
  console.log(req.body)
  try {
      const { id, password } = req.body
      if (id.includes("@")){
        idUsuario = null
        correo = id
      } else{
        idUsuario = id
        correo = null
      }
      const succ = await login(idUsuario, password, correo)
      if (succ.valid) {
        const token = jwt.sign({ idUsuario: succ.idUsuario }, 'claveSecreta', { expiresIn: '1h' });
        console.log(succ)
        res.status(200).json({ message: 'Login correcto', token, idUsuario: succ.idUsuario})
      } else {
        res.status(403).json({ error: 'Credenciales incorrectas' })
      }
  } catch (error) {
      console.log(error.message)
      res.status(400).json({ error: error.message })
  }
});

module.exports = router
