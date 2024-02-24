const mongoose = require("mongoose")

const SkinSchema = new mongoose.Schema({
  idSkin: {type: String, required: true, unique: true, lowercase: true},
  tipo: {type: String, required: true, lowercase: true}, // mapa, avatar o fichas  
  precio: {type: Number, required: true, default: 0},
  path: {type: String, required: true}
})

module.exports = mongoose.model("Skin", SkinSchema)
