const express = require('express')
const router = express.Router()
const login = require('../queries/login');

// petición post desde <url>/register desencadena esta acción
// los parámetros van en el body de la request
router.post('/', async (req, res) => {
  console.log('El login tira')
  console.log(req.body)
  try {
      const { id, password } = req.body
      if (id.includes("@")){
        email = id
        username = null
      } else{
        email = null
        username = id
      }
      const succ = await login(username, password, email)
      if (succ) {
        res.status(200).json({ message: 'Login correcto' })
      } else {
        res.status(403).json({ message: 'Credenciales incorrectas' })
      }
  } catch (error) {
      console.log(error.message)
      res.status(400).json({ error: error.message })
  }
});

module.exports = router
