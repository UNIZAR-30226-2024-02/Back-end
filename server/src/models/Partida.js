const mongoose = require("mongoose")
const Chat = require("./Chat")

const TerritorioSchema = new mongoose.Schema({
    nombre: { type: String, required: true, unique: true},
    frontera: [{ type: String }],
    tropas: { type: Number, default: 0 }
});

const CartaSchema = new mongoose.Schema({
    territorio: { type: String, required: true, unique: true },
    estrellas: { type: Number, required: true},
});

const ContinenteSchema = new mongoose.Schema({
    territorios: [{ type: TerritorioSchema }],
    valor: { type: Number, required: true }
});

const JugadorSchema = new mongoose.Schema({
    usuario: {
        type: String,
        required: true,
        unique: true
    },
    territorios: [{ type: String, default: []}],
    cartas: [{ type: CartaSchema }],
    skinFichas: {type: String, ref: 'Skin.idSkin'},
    color: {type: String, unique: true},
    abandonado: { type: Boolean, default: false}
});

const PartidaSchema = new mongoose.Schema({
    maxJugadores: { type: Number, default : 6},
    nombre: { type: String, required: true },
    //iniciada: { type: Boolean, required: true, default: false },
    //terminada: { type: Boolean, required: true, default: false },
    fechaInicio: { type: Date, default: null},
    fechaFin: { type: Date, default: null},
    //publica: { type: Boolean, required: true, default: false}, 
    password: { type: String, required: false, default: null},

    ganador: {
        type: {
            type: String,
            ref: 'Usuario.idUsuario',
        },
    },
    turno: { type: Number, required: true, default: 0 },
    jugadores: [{ type: JugadorSchema, default: []}],
    cartas: [{  type: CartaSchema , default: [] }],
    descartes: [{  type: CartaSchema , default: [] }],
    mapa: [{ type: ContinenteSchema }], 
    chat: { type: Chat.schema }
});

module.exports = {
    Partida: mongoose.model("Partida", PartidaSchema),
    Jugador: mongoose.model("Jugador", JugadorSchema),
    Jugador: mongoose.model("Carta", CartaSchema),
    Jugador: mongoose.model("Continente", ContinenteSchema),
    Jugador: mongoose.model("Territorio", TerritorioSchema),
};
