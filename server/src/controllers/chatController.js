const {Chat} = require('../models/Chat');
const Usuario = require('../models/Usuario');


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

        // se crea el chat con el nombre del chat especiificado
        const nuevoChat = await Chat.create({
          nombreChat
        });
    
        // para cada usuario, le unimos al chat
        await Usuario.updateMany(
          { _id: { $in: [idUsuario, ...usuarios] } },
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
async function salirDeChat(nombreChat, idUsuario){
    try{
        const chatExistente = await Chat.findOne({ nombreChat });

        if (!chatExistente) {
        throw new Error('El chat no existe.');
        }

        await Usuario.updateOne(
            { idUsuario: idUsuario, chats: chatExistente._id },
            { $pull: { chats: chatExistente._id } }
        );
        // Si el usuario es el último del chat, borrarlo TODO -> igual sí que hace falta guardar chats.usuarios y no causa redundancia innecesaria :) 
    } catch(error){
        console.error('Error al salir del chat:', error);
    throw error;
    }

}


module.exports = {
    crearChat
};