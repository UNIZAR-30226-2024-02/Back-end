const mongoose = require("mongoose");
const Mensaje = require("./Mensaje")


const ChatSchema = new mongoose.Schema({
  nombreChat: { type: String, required: true },
  type: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mensaje'
  }],
  default: [],
});

module.exports = mongoose.model("Chat", ChatSchema);