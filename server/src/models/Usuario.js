const mongoose = require("mongoose")
const Skin = require("./Skin")
const Chat = require("./Chat")
const Partida = require("./Partida")

const UsuarioSchema = new mongoose.Schema({
  idUsuario: {type: String, require: true, unique: true, lowercase: true},
  Pass: {type: String, require: true},
  Correo: {type: String, require: true, inmutable: true, unique: true, lowercase: true},
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
    //default: [null],
    //require: true
  },

  Solicitudes: {
    type: [{
      type: String,
      ref: 'Usuario.idUsuario'
    }],
    //default: null,
    //require: true
  },

  Partidas: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partida'
    }],
    //default: null,
    //require: true
  },
  
  // Meter aqui tambien por parte de quien se recibe la invitaicon
  Invitaciones: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partida'
    }],
    //default: null,
    //require: true
  }, 

  Skins: {
    type: [{
      type: String,
      ref: 'Skin.idSkin'
    }],
    //default: ['12', '1'],   // Añadir aqui idSkin de avatar y fichas predeterminados
    //require: true
  },

  Avatar: {
    type: {
      type: String,
      ref: 'Skin.idSkin'
    },
    //default: "122",     // idSkin del avatar predeterminado 
    //require : true
  },

  Fichas: {
    type: {
      type: String,
      ref: 'Skin.idSkin'
    },
    //default: '1',     // idSkin del set de fichas predeterminado
    //require : true
  }
})

module.exports = mongoose.model("Usuario", UsuarioSchema)
