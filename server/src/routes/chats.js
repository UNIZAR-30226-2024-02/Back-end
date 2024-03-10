const express = require('express');
const router = express.Router();
const {
  crearChat,
  salirDeChat,
  enviarMensaje
} = require('../controllers/chatController'); 
const obtenerUsuarioDesdeToken = require('../auth/auth')

// Las rutas colgarán de /chat (i.e: /chat/crearChat)

// En el request necesitamos {nombreChat , [usuarios]}
// donde [usuarios] es un array de N idUsuario 
router.post('/crearChat', async (req, res) => {
    const token = req.headers['authorization']
        const user = obtenerUsuarioDesdeToken(token)

        if (!user)
            return res.status(401).json({ mensaje: 'Token no proporcionado o inválido' })  

    const { nombreChat, usuarios } = req.body;

    try {
        const nuevoChat = await crearChat(nombreChat, user, usuarios);
        res.status(201).json({ chat: nuevoChat });
    } catch (error) {
        console.error('Error al crear el chat:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Se necesita {nombreChat}, el usuario de infiere del token de acceso
router.post('/salirDeChat', async (req, res) => {
    const token = req.headers['authorization']
        const user = obtenerUsuarioDesdeToken(token)

        if (!user)
            return res.status(401).json({ mensaje: 'Token no proporcionado o inválido' })  

    const { nombreChat } = req.body;

    try {
        await salirDeChat(nombreChat, user);
        res.status(200).json({ mensaje: 'Usuario salió del chat exitosamente' });
    } catch (error) {
        console.error('Error al salir del chat:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Ruta para que un usuario envíe un mensaje al chat
// se necesita {nombrechat, texto} --> usuario viene del access token
router.post('/enviarMensaje', async (req, res) => {
    const token = req.headers['authorization']
    const user = obtenerUsuarioDesdeToken(token)

    if (!user)
        return res.status(401).json({ mensaje: 'Token no proporcionado o inválido' })  

    const { nombreChat, textoMensaje } = req.body;

    try {
        await enviarMensaje(user, nombreChat, textoMensaje);
        res.status(200).json({ mensaje: 'Mensaje enviado con éxito' });
    } catch (error) {
        console.error('Error al enviar el mensaje:', error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
