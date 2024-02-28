const mongoose = require("mongoose")
const Skin = require("./Skin")
const Chat = require("./Chat")
const Partida = require("./Partida")

const UsuarioSchema = new mongoose.Schema({
  idUsuario: {type: String, required: true, unique: true, lowercase: true},
  pass: {type: String, required: true},
  correo: {type: String, required: true, inmutable: true, unique: true, lowercase: true},
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
    //default: [null],
    //require: true
  },

  solicitudes: {
    type: [{
      type: String,
      ref: 'Usuario.idUsuario'
    }],
    //default: null,
    //require: true
  },

  partidas: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partida'
    }],
    //default: null,
    //require: true
  },
  
  // Meter aqui tambien por parte de quien se recibe la invitaicon (?)
  invitaciones: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partida'
    }],
    //default: null,
    //require: true
  }, 

  skins: {
    type: [{
      type: String,
      ref: 'Skin.idSkin'
    }],
    //default: ['12', '1'],   // Añadir aqui idSkin de avatar y fichas predeterminados
    //require: true
  },

  avatar: {
    type: {
      type: String,
      ref: 'Skin.idSkin'
    },
    //default: "122",     // idSkin del avatar predeterminado 
    //require : true
  },

  setFichas: {
    type: {
      type: String,
      ref: 'Skin.idSkin'
    },
    //default: '1',     // idSkin del set de fichas predeterminado
    //require : true
  }
})

module.exports = mongoose.model("Usuario", UsuarioSchema)
