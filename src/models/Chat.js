const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MensajeSchema = new Schema({
  Texto: { type: String, required: true, default: "" },
  idUsuario: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  Timestamp: { type: Date, default: () => Date.now(), required: true }
});

const ChatSchema = new Schema({
  nombreChat: { type: String, required: true },
  mensajes: [MensajeSchema]
});

module.exports = mongoose.model("Chat", ChatSchema);