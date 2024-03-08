const Chat = require('../models/Chat');
const Usuario = require('../models/Usuario');
const Mensaje = require('../models/Mensaje');


// nombreChat -> Nombre del chat
// idUsuario -> Usuario que crea el chat 
// usuarios -> usuarios que se añadirán al chat si es creado con éxito
async function crearChat(nombreChat, idUsuario, usuarios) {
    try {
        const usuariosExistentes = await Usuario.find({ idUsuario: { $in: [idUsuario, ...usuarios] } }, 'idUsuario');

        // se podría hacer que se añadan todos excepto ese, por ejemplo. Esto igual es un poco drástico
        // pero de momento lo dejo así (TODO)
        if (usuariosExistentes.length !== usuarios.length + 1) {
            throw new Error('Al menos uno de los usuarios no existe en la base de datos.');
        }
        console.log(nombreChat);
        console.log(usuariosExistentes)
        // se crea el chat con el nombre del chat especiificado
        // interesante comprobar que no exista un chat ya con este nombre?
        const nuevoChat = new Chat({nombreChat});
        await nuevoChat.save()

        
        // para cada usuario, le unimos al chat
        await Usuario.updateMany(
          { idUsuario: { $in: [idUsuario, ...usuarios] } },
          { $push: { chats: nuevoChat._id } }
        );
        
        // TODO
        // Notificar ALL Usuario u IN usuarios
        // TODO

        return nuevoChat;
      } catch (error) {
        console.error('Error al crear el chat:', error);
        throw error;
      }
}

// El usuario idUsuario abandonará el chat nombreChat
async function salirDeChat(nombreChat, idUsuario) {
  try {
    const chatExistente = await Chat.findOne({ nombreChat });

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

    // TODO: Si el usuario es el último del chat, borrarlo
    // ...

    console.log('Usuario salió del chat exitosamente');
  } catch (error) {
    console.error('Error al salir del chat:', error.message);
    throw error;
  }
}

// El usuario idUsuario envía un Mensaje al chat nombreChat
// idUsuario: idUsuario del usuario que envía el mensaje
// textoMensaje: el mensaje, en texto plano 
// nombreChat: nombre del chat destino (o el OID?)
async function enviarMensaje(idUsuario, nombreChat, textoMensaje) {
  try {
    const usuario = await Usuario.findOne({ idUsuario }); // obtengo usuario y su OID
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    const chat = await Chat.findOne({ nombreChat }); // obtengo chat y su OID
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

    console.log('Mensaje enviado con éxito');
  } catch (error) {
    console.error('Error al enviar el mensaje:', error.message);
    throw error;
  }
}

module.exports = {
    crearChat,
    salirDeChat,
    enviarMensaje
};