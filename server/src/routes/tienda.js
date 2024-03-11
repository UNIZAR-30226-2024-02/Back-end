const express = require('express')
const router = express.Router()
const { obtenerTodo, comprarSkin } = require('../controllers/tiendaController');
const obtenerUsuarioDesdeToken = require('../auth/auth');

router.post('/', async(req, res) => {
  const token = req.headers['authorization'];
  const user = obtenerUsuarioDesdeToken(token)
  if(!user)
    return res.status(401).json({ mensaje: 'Token no proporcionado o inválido' })

  try {
    const opciones = { // opciones por defecto si no se especifica filtrado -> mismo formato del req.body
        sortBy: 'precio',  
        precioMin: 0,      
        precioMax: 100000000,
        tipo: undefined
    };

    for (const key in opciones) { 
      if (req.body[key] !== undefined) { // si el jugador la especifica, 
          opciones[key] = req.body[key]; // se actualiza, si no -> permance el default
      }
    }
    console.log('buscando skins!')
    const skins = await obtenerTodo(opciones);
    res.json(skins);
  } catch (error) {
      res.status(500).json({ mensaje: 'Error al obtener skins de la tienda' });
  }
})

router.post('/comprar', async(req, res) => {
  const token = req.headers['authorization'];
  const user = obtenerUsuarioDesdeToken(token)
  if(!user)
    return res.status(401).json({ mensaje: 'Token no proporcionado o inválido' })

  try {
    const { idSkin } = req.body; // el usuario solo nos pasa la id de la skin que desea adquirir
    const resul = await comprarSkin(idSkin, user);
    console.log("hola")
    if(resul)
      res.status(200).json({ mensaje: 'Skin adquirida correctamente!' });
    else 
      res.status(400).json({ mensaje: 'No tienes suficiente dinero!' });
  } catch (error) {
      res.status(500).json({ mensaje: 'Error al obtener skins de la tienda' });
  }
})


module.exports = router