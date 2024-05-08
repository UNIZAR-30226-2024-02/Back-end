const express = require('express')
const router = express.Router()
const {   crearPartida, 
  getPartidasDisponibles,
  getHistorico,
  invite,
  join,
  salirPartida,
  iniciarPartida,
  siguienteFase,
  colocarTropas,
  atacarTerritorio,
  realizarManiobra,
  utilizarCartas,
  getPartida,
  estoyEnPartida } = require('../controllers/partidaController');
const obtenerUsuarioDesdeToken = require('../auth/auth');

// Debugged
router.put('/getPartida', async (req, res) => {
  console.log(req.body)
  try {
    let idPartida = req.body.idPartida
    const token = req.headers['authorization'];
    const sender = obtenerUsuarioDesdeToken(token)
    if(!sender)
      return res.status(401).json({ mensaje: 'Token no proporcionado o inválido' })

    partida = await getPartida(idPartida, sender)
    if (partida) {
      res.status(200).json({ partida })
    } else {
      res.status(400).json({ message: 'Error al encontrar partida' })
    }
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: error.message })
  }
});

// Debugged
router.put('/iniciarPartida', async (req, res) => {
  console.log(req.body)
  try {
    let { idPartida } = req.body
    const token = req.headers['authorization'];
    const user = obtenerUsuarioDesdeToken(token)
    if(!user)
      return res.status(401).json({ mensaje: 'Token no proporcionado o inválido' })

    const succ = await iniciarPartida(idPartida, user)
    if (succ) {
      res.status(200).json({ message: 'Partida iniciada' })
    }
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: error.message })
  }
});

// Debugged
router.put('/siguienteFase', async (req, res) => {
  console.log(req.body)
  try {
    let { idPartida } = req.body
    const token = req.headers['authorization'];
    const user = obtenerUsuarioDesdeToken(token)
    if(!user)
      return res.status(401).json({ mensaje: 'Token no proporcionado o inválido' })

    const succ = await siguienteFase(idPartida, user)
    console.log(succ)
    if (succ) {
      console.log(succ)
      res.status(200).json({ message: 'Cambio de fase con exito', fase: succ.fase, turno: succ.turno})
    }
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: error.message })
  }
});

// Debugged
router.put('/colocarTropas', async (req, res) => {
  console.log(req.body)
  try {
    let { idPartida, territorio, numTropas } = req.body
    const token = req.headers['authorization'];
    const user = obtenerUsuarioDesdeToken(token)
    if(!user)
      return res.status(401).json({ mensaje: 'Token no proporcionado o inválido' })

    const succ = await colocarTropas(idPartida, user, territorio, numTropas);
    if (succ) {
      res.status(200).json({ message: 'Tropas colocadas' })
    }
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: error.message })
  }
});

router.put('/atacarTerritorio', async (req, res) => {
  console.log(req.body)
  try {
    let { idPartida, territorioAtacante, territorioDefensor, numTropas } = req.body
    const token = req.headers['authorization'];
    const user = obtenerUsuarioDesdeToken(token)
    if(!user)
      return res.status(401).json({ mensaje: 'Token no proporcionado o inválido' })

    const succ = await atacarTerritorio(idPartida, user, territorioAtacante, territorioDefensor, numTropas);
    if (succ) {
      res.status(200).json({ message: 'Ataque realizado', 
                            dadosAtacante: succ.dadosAtacante, 
                            dadosDefensor: succ.dadosDefensor, 
                            resultadoBatalla: succ.resultadoBatalla, 
                            conquistado: succ.conquistado , 
                            eloAtacante: succ.eloAtacante,
                            eloDefensor: succ.eloDefensor, 
                            dineroAtacante: succ.dineroAtacante,
                            dineroDefensor: succ.dineroDefensor
                          })
    }
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: error.message })
  }
});

router.put('/realizarManiobra', async (req, res) => {
  console.log(req.body)
  try {
    let { idPartida, territorioOrigen, territorioDestino, numTropas } = req.body
    const token = req.headers['authorization'];
    const user = obtenerUsuarioDesdeToken(token)
    if(!user)
      return res.status(401).json({ mensaje: 'Token no proporcionado o inválido' })

    const succ = await realizarManiobra(idPartida, user, territorioOrigen, territorioDestino, numTropas);
    if (succ) {
      res.status(200).json({ message: 'Maniobra realizada' })
    } else {
      res.status(400).json({ message: 'Error al realizar maniobra' })
    }
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: error.message })
  }
});

router.put('/utilizarCartas', async (req, res) => {
  console.log(req.body)
  try {
    let { idPartida, carta1, carta2, carta3 } = req.body
    const token = req.headers['authorization'];
    const user = obtenerUsuarioDesdeToken(token)
    if(!user)
      return res.status(401).json({ mensaje: 'Token no proporcionado o inválido' })

    const succ = await utilizarCartas(idPartida, user, carta1, carta2, carta3);
    if (succ) {
      res.status(200).json({ message: 'Cartas utilizadas', tropas: succ.tropas })
    }
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: error.message })
  }
});

router.put('/salirPartida', async (req, res) => {
  try{
    let { idPartida } = req.body
    const token = req.headers['authorization'];
    const user = obtenerUsuarioDesdeToken(token)
    if(!user)
      return res.status(401).json({ mensaje: 'Token no proporcionado o inválido' })

    await salirPartida(user, idPartida)
    res.status(200).json({ message: 'Salida de partida exitosa' })
  }
  catch (error) {
    res.status(500).json({ error: error.message })
  }
});

router.get('/estoyEnPartida', async (req, res) => {
  try {
    const token = req.headers['authorization'];
    const user = obtenerUsuarioDesdeToken(token)
    if(!user)
    return res.status(401).json({ mensaje: 'Token no proporcionado o inválido' })
    const partida = await estoyEnPartida(user)
    if(partida)
      res.status(200).json({ partida })
    else
      res.status(201).json({ message: 'El usuario no está en ninguna partida' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
});

module.exports = router