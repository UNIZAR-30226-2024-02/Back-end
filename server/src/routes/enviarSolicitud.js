const express = require('express')
const router = express.Router()
const { enviaSolicitud } = require('../controllers/usuarioController');
const obtenerUsuarioDesdeToken = require('../auth/auth');

router.post('/', async (req, res) => {
    try {
        const token = req.headers['authorization'];
        const user = obtenerUsuarioDesdeToken(token);

        if (!user)
            return res.status(401).json({ mensaje: 'Token no proporcionado o inválido' });

        const usuarioDestinoId = req.body.usuarioDestino; // nombre del usuario destino

        const solicitudEnviada = await enviaSolicitud(user.idUsuario, usuarioDestinoId);

        if (solicitudEnviada) {
            // ¿Notificar al usuario destino? 
            return res.status(200).json({ mensaje: 'Solicitud de amistad enviada correctamente' });
        } else {
            return res.status(400).json({ mensaje: 'Error al enviar la solicitud de amistad' });
        }
    } catch (error) {
        console.error('Error en la ruta /solicitudes:', error.message);
        return res.status(500).json({ mensaje: 'Fatal error' });
    }
});

module.exports = router
