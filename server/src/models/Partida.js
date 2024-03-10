const mongoose = require("mongoose")
const Chat = require("./Chat")

const TerritorioSchema = new mongoose.Schema({
    nombre: { type: String },
    frontera: [{ type: String }],
    tropas: { type: Number, required: true, default: 0 }
});

const CartaSchema = new mongoose.Schema({
    territorio: { type: String },
    tropas: { type: Number, required: true, default: 0 }
});

const ContinenteSchema = new mongoose.Schema({
    territorios: [{ type: TerritorioSchema }],
    valor: { type: Number, required: true }
});

const JugadorSchema = new mongoose.Schema({
    usuario: {
        type: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario',
            required: true
        },
    },
    territorios: [{ type: TerritorioSchema, default: [] }],
    cartas: [{ type: CartaSchema , default: []}],
    turno: { type: Number, required: true }
});

const PartidaSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    iniciada: { type: Boolean, required: true, default: false },
    terminada: { type: Boolean, required: true, default: false },
    fechaInicio: { type: Date, required: true, immutable: true },
    fechaFin: { type: Date}, // no la pondria como requerida, una partida puede no haber acabado
    publica: { type: Boolean, required: true, default: false}, 
    password: { type: String, required: false},
    ganador: {
        type: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario',
        },
    },
    turno: { type: Number, required: true, default: 0 },
    jugadores: [{ type: JugadorSchema }],
    mapa: [{ type: ContinenteSchema }], 
    chat: { type: Chat.schema }
});

module.exports = {
    Partida: mongoose.model("Partida", PartidaSchema),
    Jugador: mongoose.model("Jugador", JugadorSchema)
};
