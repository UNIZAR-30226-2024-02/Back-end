const express = require('express')
const router = express.Router()
const { crearAmistad, cancelarAmistad, getFriends, getSolicitudes } = require('../controllers/usuarioController');
const obtenerUsuarioDesdeToken = require('../auth/auth');

router.post('/', async (req, res) => {
    try {
        const token = req.headers['authorization']
        const user = obtenerUsuarioDesdeToken(token)

        if (!user)
            return res.status(401).json({ message: 'Token no proporcionado o inválido' })

        const result = await crearAmistad(user, req.body.idDestino);

        if (result) {
            // ¿Notificar al usuario destino? 
            return res.status(200).json({ message: 'Creación de amistad correcta' })
        } else {
            return res.status(400).json({ message: 'Error al crear amistad' })
        }
    } catch (error) {
        console.error('Error en la ruta /amistad:', error.message)
        return res.status(500).json({ message: 'Fatal error' })
    }
});

router.delete('/:idDestino', async (req, res) => {
    try {
        const token = req.headers['authorization']
        const user = obtenerUsuarioDesdeToken(token)

        if (!user)
            return res.status(401).json({ message: 'Token no proporcionado o inválido' })

        const result = await cancelarAmistad(user, req.params.idDestino);

        if (result) {
            // ¿Notificar al usuario destino? 
            return res.status(200).json({ message: 'Cancelación de amistad correcta' })
        } else {
            return res.status(400).json({ message: 'Error al cancelar amistad' })
        }
    } catch (error) {
        console.error('Error en la ruta /amistad:', error.message)
        return res.status(500).json({ message: 'Fatal error' })
    }
});

router.get('/listarAmigos', async (req, res) => {
    try {
        const token = req.headers['authorization']
        const user = obtenerUsuarioDesdeToken(token)

        if (!user)
            return res.status(401).json({ message: 'Token no proporcionado o inválido' })

        const friends = await getFriends(user);
        return res.status(200).json({ message: 'Lista de amigos', friends })
    } catch (error) {
        console.error('Error en la ruta /amistad:', error.message)
        return res.status(500).json({ message: 'Fatal error' })
    }
});

router.get('/listarSolicitudes', async (req, res) => {
    try {
        const token = req.headers['authorization']
        const user = obtenerUsuarioDesdeToken(token)

        if (!user)
            return res.status(401).json({ message: 'Token no proporcionado o inválido' })

        const solicitudes = await getSolicitudes(user);
        return res.status(200).json({ message: 'Solicitudes', solicitudes })
    } catch (error) {
        console.error('Error en la ruta /amistad:', error.message)
        return res.status(500).json({ message: 'Fatal error' })
    }
});

module.exports = router
