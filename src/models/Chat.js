const mongoose = require("mongoose")
const Mensaje = require("./Mensaje.js")

new Chat = mongoose.Schema({
  nombreChat: {type: String, require:true},
  Mensajes: {type: [Mensaje], default: [], require: true}
})

module.exports = mongoose.model("Chat", ChatSchema)
