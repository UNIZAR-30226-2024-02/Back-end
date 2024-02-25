const mongoose = require("mongoose")
const Skin = require("./Skin")
const Chat = require("./Chat")
const Partida = require("./Partida")

new UsuarioSchema = mongoose.Schema({
  idUsuario: {type: String, required: true, unique: true, lowercase: true},
  pass: {type: String, required: true},
  correo: {type: String, required: true, inmutable: true, unique: true, lowercase: true},
  fNacimiento: {type: Date, required: true, inmutable: true},
  nacionalidad: {type: String, required: true, inmutable: true},
  elo: {type: Number, required: true, default: 1000},
  puntos: {type: Number, required: true, default: 0},

  chats: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat'
    }]
  },

  amigos: {
    type: [{
      type: String,
      ref: 'Usuario.idUsuario'
    }],
    default: [],
    required: true
  },

  solicitudes: {
    type: [{
      type: String,
      ref: 'Usuario.idUsuario'
    }],
    default: [],
    required: true
  },

  partidas: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partida'
    }],
    default: [],
    required: true
  },
  
  // Meter aqui tambien por parte de quien se recibe la invitaicon (?)
  invitaciones: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partida'
    }],
    default: [],
    required: true
  }, 

  skins: {
    type: [{
      type: String,
      ref: 'Skin.idSkin'
    }],
    default: [],   // Añadir aqui idSkin de avatar y fichas predeterminados
    required: true
  },

  avatar: {
    type: {
      type: String,
      ref: 'Skin.idSkin'
    },
    default: '',     // idSkin del avatar predeterminado 
    required : true
  },

  setFichas: {
    type: {
      type: String,
      ref: 'Skin.idSkin'
    },
    default: '',     // idSkin del set de fichas predeterminado
    required : true
  }
})

module.exports = mongoose.model("Usuario", UsuarioSchema)
