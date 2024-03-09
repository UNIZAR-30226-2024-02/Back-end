const mongoose = require("mongoose");
const Mensaje = require("./Mensaje");

const ChatSchema = new mongoose.Schema({
  nombreChat: { type: String, required: true },
  mensajes: [Mensaje.schema], 
  usuarios: [{ type: String, ref: 'Usuario' }] // guardo el id usuario
});

module.exports = mongoose.model("Chat", ChatSchema);