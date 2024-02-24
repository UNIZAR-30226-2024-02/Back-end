const mongoose = require("mongoose");
const Mensaje = require("./Mensaje");

const ChatSchema = new mongoose.Schema({
  nombreChat: { type: String, required: true },
  mensajes: [Mensaje.schema]
});

module.exports = mongoose.model("Chat", ChatSchema);