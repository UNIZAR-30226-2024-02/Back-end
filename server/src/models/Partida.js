const mongoose = require("mongoose")
const Chat = require("./Chat")

const TerritorioSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    frontera: [{ type: String }],
    tropas: { type: Number, default: 0 }
});

const CartaSchema = new mongoose.Schema({
    territorio: { type: String, required: true },
    estrellas: { type: Number, required: true},
});

const ContinenteSchema = new mongoose.Schema({
    territorios: [{ type: TerritorioSchema }],
    valor: { type: Number, required: true }
});

const JugadorSchema = new mongoose.Schema({
    usuario: {
        type: String,
        required: true
    },
    territorios: [{ type: String, default: [] }],
    cartas: [{ type: CartaSchema }],
    skinFichas: {type: String, ref: 'Skin.idSkin'},
    color: {type: String},
    abandonado: { type: Boolean, default: false}, 
    eloGanado: {type: Number, default: 0},
    dineroGanado: {type: Number, default: 0}
});

const PartidaSchema = new mongoose.Schema({
    maxJugadores: { type: Number, default : 6},
    nombre: { type: String, required: true },
    fechaInicio: { type: Date, default: null},
    fechaFin: { type: Date, default: null},
    password: { type: String, required: false, default: null},

    ganador: { // TODO
            type: String,
            default: null
    },
    jugadores: [{ type: JugadorSchema, default: []}],
    cartas: [{  type: CartaSchema , default: [] }],
    descartes: [{  type: CartaSchema , default: [] }],
    mapa: [{ type: ContinenteSchema, default: [] }], 
    chat: { type: Chat.schema },

    turno: { type: Number, default: 0 },
    fase: { type: Number, default: 0 },
    auxColocar: { type: Number, default: 0 },
    auxRobar: { type: Boolean, default: false },
    paused: { type: Boolean, default: false }
});

module.exports = {
    Partida: mongoose.model("Partida", PartidaSchema),
    Jugador: mongoose.model("Jugador", JugadorSchema),
    Carta: mongoose.model("Carta", CartaSchema),
    Continente: mongoose.model("Continente", ContinenteSchema),
    Territorio: mongoose.model("Territorio", TerritorioSchema),
};
