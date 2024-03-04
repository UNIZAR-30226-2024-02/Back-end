const express = require('express')
const router = express.Router()
const { obtenerTodo } = require('../controllers/tiendaController');
const obtenerUsuarioDesdeToken = require('../auth/auth');

router.get('/', async(req, res) => {
  const token = req.headers['authorization'];
  const user = obtenerUsuarioDesdeToken(token)
  if(!user)
    return res.status(401).json({ mensaje: 'Token no proporcionado o inválido' })

  try {
    //TODO (es placeholder para probar)
    const opciones = { // esto realmente nos lo pasará el front, podemos tener un default para la primera vez o si no especifica nada
        sortBy: 'precio',  
        precioMin: 10,      
        precioMax: 50     
    };

    const skins = await obtenerTodo(opciones);
    res.json(skins);
  } catch (error) {
      res.status(500).json({ mensaje: 'Error al obtener skins de la tienda' });
  }

})

router.get('/skins', async(req, res) => {
    const token = req.headers['authorization'];
    const user = obtenerUsuarioDesdeToken(token)
    if(!user)
        return res.status(401).json({ mensaje: 'Token no proporcionado o inválido' })

})

router.get('/avatares', async(req, res) => {
    const token = req.headers['authorization'];
    const user = obtenerUsuarioDesdeToken(token)
    if(!user)
        return res.status(401).json({ mensaje: 'Token no proporcionado o inválido' })
    
})

router.get('/terrenos', async(req, res) => {
    const token = req.headers['authorization'];
    const user = obtenerUsuarioDesdeToken(token)
    if(!user)
        return res.status(401).json({ mensaje: 'Token no proporcionado o inválido' })
})

module.exports = router