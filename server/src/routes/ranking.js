const express = require('express')
const router = express.Router()
const { getUsuariosByRanking } = require('../controllers/usuarioController');

router.get('/', async(req, res) => {
    try {
      const ranking = await getUsuariosByRanking()
      res.status(201).json(ranking)
  
    } catch (error) {
      console.log(error.message)
      res.status(400).json({ error: error.message })
    }
  })

module.exports = router
