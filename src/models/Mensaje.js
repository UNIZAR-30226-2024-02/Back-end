const mongoose = require("mongoose")
const Usuario = require("./Usuario")

new MensajeSchema = mongoose.Schema({
  Texto: {type: String, require:true, default:""},
  idUsuario: {
    type: String,
    ref: 'Usuario.idUsuario',
    require: true
  },
  Timestamp: {type: String, default: () => Date.now(), require: true}
})

module.exports = mongoose.model("Mensaje", MensajeSchema)
