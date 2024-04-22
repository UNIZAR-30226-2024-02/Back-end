const mongoose = require("mongoose")
const Skin = require("./Skin")
const Chat = require("./Chat")
const Partida = require("./Partida")

const UsuarioSchema = new mongoose.Schema({
  idUsuario: {type: String, required: true, unique: true, lowercase: true},
  password: {type: String, required: true},
  correo: {type: String, required: true, inmutable: true, unique: true, lowercase: true},
  info: {type: String},
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
    require: true
  },

  solicitudes: {
    type: [{
      type: String,
      ref: 'Usuario.idUsuario'
    }],
    default: [],
    require: true
  },

  partidas: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partida'
    }],
    default: [],
    require: true
  },
  
  // Meter aqui tambien por parte de quien se recibe la invitaicon (?)
  invitaciones: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partida',
      ref: 'Usuario.idUsuario'
    }],
    default: [],
    require: true
  }, 

  skins: {
    type: [{
      type: String,
      ref: 'Skin.idSkin',
    }],
    default: ['defaultSkin', 'defaultFichas', 'defaultMap']
  },

  avatar: {
    type: {
      type: String,
      ref: 'Skin.idSkin',
      default: 'defaultSkin'
    },
  },

  setFichas: {
    type: {
      type: String,
      ref: 'Skin.idSkin',
      default: 'defaultFichas'
    },
  },

  terreno: {
    type: {
      type: String,
      ref: 'Skin.idSkin',
      default: 'defaultMap'
    },
  }
})

module.exports = mongoose.model("Usuario", UsuarioSchema)
