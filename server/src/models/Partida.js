const mongoose = require("mongoose")
const Chat = require("./Chat")

const TerritorioSchema = mongoose.Schema({
    Nombre: { type: String },
    Frontera: [{ type: String }],
    Tropas: { type: Number, required: true, default: 0 }
});

const CartaSchema = mongoose.Schema({
    Territorio: { type: String },
    Tropas: { type: Number, required: true, default: 0 }
});

const ContinenteSchema = mongoose.Schema({
    Territorios: [{ type: TerritorioSchema }],
    Valor: { type: Number, required: true }
});

const JugadorSchema = mongoose.Schema({
    Usuario: {
        type: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario',
            required: true
        },
    },
    Territorios: [{ type: TerritorioSchema, default: [] }],
    Cartas: [{ type: CartaSchema , default: []}],
    Turno: { type: Number, required: true }
});

const PartidaSchema = mongoose.Schema({
    Nombre: { type: String, required: true },
    Iniciada: { type: Boolean, required: true, default: false },
    Terminada: { type: Boolean, required: true, default: false },
    fechaInicio: { type: Date, required: true, immutable: true },
    fechaFin: { type: Date, required: true, immutable: true },
    Public: { type: Boolean, required: true, default: false}, 
    Password: { type: String, required: false},
    Ganador: {
        type: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario',
        },
    },
    Turno: { type: Number, required: true, default: 0 },
    Jugadores: [{ type: JugadorSchema }],
    Mapa: [{ type: ContinenteSchema }], 
    Chat: { type: ChatSchema }
});

module.exports = mongoose.model("Partida", PartidaSchema);
