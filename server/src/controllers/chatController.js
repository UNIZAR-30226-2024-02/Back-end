const Chat = require('../models/Chat');
const Usuario = require('../models/Usuario');
const Mensaje = require('../models/Mensaje');
const {Partida, Jugador} = require('../models/Partida');


/**
 * Crea un nuevo chat.
 * @param {string} nombreChat - El nombre del chat.
 * @param {string} idUsuario - El ID del usuario que crea el chat.
 * @param {Array<string>} usuarios - Los usuarios que se añadirán al chat si se crea con éxito.
 * @returns {Promise<Object>} El nuevo chat creado y un mensaje indicando el resultado de la operación.
 * @throws {Error} Si ya existe un chat con ese nombre y al menos uno de los usuarios.
 */
async function crearChat(nombreChat, idUsuario, usuarios) {
    try {

        // si ya existe un chat con ese nombre, y al menos alguno de los usuarios, no se puede crear el chat
        // es poco transparente (podemos hacer ataques y mirar en qué chats está un usuario) pero no se me ocurre
        // nada mejor
        const chatExistente = await Chat.findOne({
          nombreChat: nombreChat,
          usuarios: { $in: [idUsuario, ...usuarios] }
        });

        if (chatExistente) {
          throw new Error('Ya existe un chat con ese nombre y al menos uno de los usuarios.');
        }

        //Para comprobrar si son amigos necesito el usuario unico
        const miusuario = await Usuario.findOne({ idUsuario: idUsuario });

        const usuariosExistentes = await Usuario.find({ idUsuario: { $in: [idUsuario, ...usuarios] } }, 'idUsuario');
        let idUsuariosExistentes = usuariosExistentes.map(usuario => usuario.idUsuario);

        let amigosexistentes = [];
        let noexistentes = [];

        for (let usuario of usuarios) {
          if(!idUsuariosExistentes.includes(usuario) || !miusuario.amigos.includes(usuario)){
            noexistentes.push(usuario)
          }
          else if(miusuario.amigos.includes(usuario)){
            amigosexistentes.push(usuario)
          }

        }

        console.log(nombreChat);
        console.log(amigosexistentes);
        // se crea el chat con el nombre del chat especiificado
        const todosLosUsuarios = [...amigosexistentes, idUsuario];
        if(todosLosUsuarios.length < 2){
          throw new Error('No hay suficientes usuarios para crear un chat');
        }

        const nuevoChat = new Chat({nombreChat, usuarios: todosLosUsuarios});
        console.log(nuevoChat)
        await nuevoChat.save()

        // para cada usuario, le unimos al chat
        await Usuario.updateMany(
          { idUsuario: { $in: [idUsuario, ...usuarios] } },
          { $push: { chats: nuevoChat._id } }
        );
        let mensaje

        // si hay usuarios que no son amigos o no existen, se notifica en el mensaje, sino es OK
        if (noexistentes.length > 0) {
          mensaje = 'No se ha añadido a ' + noexistentes.join(', ') + ' porque no son tus amigos/ no existen';
        }
        else {
          mensaje = 'OK';
        }
        let retValue = {chat: nuevoChat, message: mensaje};
        // TODO
        // Notificar ALL Usuario u IN usuarios
        // TODO

        return retValue;
      } catch (error) {
        console.error('Error al crear el chat:', error);
        throw error;
      }
}

/**
 * Permite a un usuario abandonar un chat.
 * @param {string} OIDChat - El ID del chat a abandonar.
 * @param {string} idUsuario - El ID del usuario que abandona el chat.
 * @throws {Error} Si el chat no existe o el usuario no está en el chat.
 */
async function salirDeChat(OIDChat, idUsuario) {
  try {

    const chatExistente = await Chat.findById(OIDChat); // lo busco por su oid

    if (!chatExistente) {
      throw new Error('El chat no existe.');
    }

    // Usamos updateOne y esperamos la promesa para verificar el resultado
    const resultadoUpdate = await Usuario.updateOne(
      { idUsuario: idUsuario, chats: chatExistente._id },
      { $pull: { chats: chatExistente._id } }
    );

    // Verificar si la actualización tuvo éxito
    if (resultadoUpdate.nModified === 0) {
      throw new Error('El usuario no estaba en el chat o la actualización no tuvo éxito.');
    }

    await Chat.updateOne( // quito al usuario del chat
      { _id: chatExistente._id },
      { $pull: { usuarios: idUsuario } }
    );

    // Si el usuario es el último del chat, borrarlo
    if (chatExistente.usuarios.length === 0) {
      // Eliminar el chat si el usuario es el último
      await Chat.deleteOne({ _id: chatExistente._id });
      console.log('Chat eliminado porque el usuario era el último en el chat.');
    }

    console.log('Usuario salió del chat exitosamente');
  } catch (error) {
    console.error('Error al salir del chat:', error.message);
    throw error;
  }
}

/**
 * Envía un mensaje a un chat.
 * @param {string} idUsuario - El ID del usuario que envía el mensaje.
 * @param {string} OIDChat - El ID del chat al que se está enviando el mensaje.
 * @param {string} textoMensaje - El mensaje, en texto plano.
 * @throws {Error} Si el usuario o el chat no existen, o el usuario no tiene acceso al chat.
 */
async function enviarMensaje(idUsuario, OIDChat, textoMensaje) {
  try {
    const usuario = await Usuario.findOne({ idUsuario }); // obtengo usuario y su OID
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    const chat = await Chat.findById(OIDChat);
    if (!chat) {
      throw new Error('Chat no encontrado');
    }
    const partida = await Partida.findOne({
      'jugadores.usuario': usuario.idUsuario,
      'chat._id': OIDChat
    });
    if (!usuario.chats.includes(chat._id) && !partida){
      throw new Error('El usuario no tiene acceso a este chat');
    }
    console.log(idUsuario)
    const nuevoMensaje = {
      texto: textoMensaje,
      idUsuario: idUsuario,
      timestamp: new Date(),
    };

    chat.mensajes.push(nuevoMensaje);

    await chat.save();
    //TODO avisar a todos los participantes del nuevo mensaje
    if(partida){
      partida.chat.mensajes.push(nuevoMensaje);
      await partida.save();
    }

    console.log('Mensaje enviado con éxito');
  } catch (error) {
    console.error('Error al enviar el mensaje:', error.message);
    throw error;
  }
}

/**
 * Lista todos los chats de un usuario.
 * @param {string} idUsuario - El ID del usuario.
 * @returns {Promise<Array<Object>>} Los nombres y IDs de los chats.
 * @throws {Error} Si el usuario no existe.
 */
async function listarChats(idUsuario) {
  try {
    const usuario = await Usuario.findOne({ idUsuario }); // obtengo usuario y su OID
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    const nombresChats = [];

    for (let chatId of usuario.chats) {
      const chat = await Chat.findById(chatId);
      if (chat && chat.usuarios.includes(idUsuario)) {
        nombresChats.push({nombre: chat.nombreChat, oid: chatId});
      }
    }

    return nombresChats;
    
  } catch (error) {
    console.error('Error al obtener chats:', error.message);
    throw error;
  }
}

/**
 * Obtiene todos los mensajes de un chat.
 * @param {string} idUsuario - El ID del usuario.
 * @param {string} chatId - El ID del chat.
 * @returns {Promise<Array<Object>>} Los mensajes del chat.
 * @throws {Error} Si el chat no existe.
 */
async function getMensajes(idUsuario, chatId){
  try {
    const chat = await Chat.findById(chatId).populate('mensajes');
    if (!chat) {
      throw new Error('Chat no encontrado');
    }

    return chat.mensajes;
  } catch (error) {
    console.error('Error al obtener mensajes del chat:', error.message);
    throw error;
  }
  
}

/**
 * Obtiene todos los participantes de un chat.
 * @param {string} chatId - El ID del chat.
 * @returns {Promise<Array<string>>} Los participantes del chat.
 * @throws {Error} Si el chat no existe.
 */
async function getParticipantes(chatId){
  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new Error('Chat no encontrado');
    }

    return chat.usuarios;
  } catch (error) {
    console.error('Error al obtener participantes del chat:', error.message);
    throw error;
  }
}



module.exports = {
    crearChat,
    salirDeChat,
    enviarMensaje,
    listarChats, 
    getMensajes,
    getParticipantes
};