const mongoose = require("mongoose")
const Skin = require("./Skin")
const Chat = require("./Chat")
const Partida = require("./Partida")

new UsuarioSchema = mongoose.Schema({
  idUsuario: {type: String, require: true, unique: true, lowercase: true},
  Pass: {type: String, require: true},
  Correo: {type: String, require: true, inmutable: true, unique: true, lowercase: true},
  fNacimiento: {type: Date, require: true, inmutable: true},
  Nacionalidad: {type: String, require: true, inmutable: true},
  Sexo: {type: String, require: true, inmutable: true},
  Elo: {type: Number, require: true, default: 1000},
  Puntos: {type: Number, require: true, default: 0},

  Chats: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat'
    }]
  },

  Amigos: {
    type: [{
      type: String,
      ref: 'Usuario.idUsuario'
    }],
    default: [],
    require: true
  },

  Solicitudes: {
    type: [{
      type: String,
      ref: 'Usuario.idUsuario'
    }],
    default: [],
    require: true
  },

  Partidas: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partida'
    }],
    default: [],
    require: true
  },
  
  // Meter aqui tambien por parte de quien se recibe la invitaicon
  Invitaciones: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partida'
    }],
    default: [],
    require: true
  }, 

  Skins: {
    type: [{
      type: String,
      ref: 'Skin.idSkin'
    }],
    default: [],   // Añadir aqui idSkin de avatar y fichas predeterminados
    require: true
  },

  Avatar: {
    type: {
      type: String,
      ref: 'Skin.idSkin'
    },
    default: '',     // idSkin del avatar predeterminado 
    require : true
  },

  Fichas: {
    type: {
      type: String,
      ref: 'Skin.idSkin'
    },
    default: '',     // idSkin del set de fichas predeterminado
    require : true
  }
})

module.exports = mongoose.model("Usuario", UsuarioSchema)
