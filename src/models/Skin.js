const mongoose = require("mongoose")

new SkinSchema = mongoose.Schema({
  idSkin: {type: String, require: true, unique: true, lowercase: true},
  Tipo: {type: String, require: true, lowercase: true}, // mapa, avatar o fichas  
  Precio: {type: Number, require: true, default: 0, default: 0},
  Path: {type: String, require: true}
})  

module.exports = mongoose.model("Skin", SkinSchema)
