const Chat = require('../models/Chat');
const Usuario = require('../models/Usuario');
const Mensaje = require('../models/Mensaje');


// nombreChat -> Nombre del chat
// idUsuario -> Usuario que crea el chat 
// usuarios -> usuarios que se añadirán al chat si es creado con éxito
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

// El usuario idUsuario abandonará el chat OIDChat (chat_id)
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

// El usuario idUsuario envía un Mensaje al chat OID
// idUsuario: idUsuario del usuario que envía el mensaje
// textoMensaje: el mensaje, en texto plano 
// OID: OID del chat destino 
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

    if (!usuario.chats.includes(chat._id)) {
      throw new Error('El usuario no tiene acceso a este chat');
    }

    const nuevoMensaje = {
      texto: textoMensaje,
      idUsuario: usuario._id,
      timestamp: new Date(),
    };

    chat.mensajes.push(nuevoMensaje);

    await chat.save();
    //TODO avisar a todos los participantes del nuevo mensaje

    console.log('Mensaje enviado con éxito');
  } catch (error) {
    console.error('Error al enviar el mensaje:', error.message);
    throw error;
  }
}

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

// chatId es el OID 
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

// Obtiene todos los participantes de un chat
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