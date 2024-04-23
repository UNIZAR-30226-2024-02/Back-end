const mongoose = require("mongoose");
const Usuario = require("./Usuario");

const MensajeSchema = mongoose.Schema({
  texto: { type: String, required: true, default: "" },
  idUsuario: {
    type: String,
    ref: 'Usuario',
    required: true
  },
  timestamp: { type: Date, default: () => Date.now(), required: true } // Cambiado a Date para el timestamp
});

module.exports = mongoose.model("Mensaje", MensajeSchema);

