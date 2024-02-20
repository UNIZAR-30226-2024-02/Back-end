const mongoose = require("mongoose");

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
            type: String,
            ref: 'Usuario.idUsuario'
        },
    },
    Territorios: [{ type: TerritorioSchema }],
    Cartas: [{ type: CartaSchema }],
    Turno: { type: Number, required: true }
});

const PartidaSchema = mongoose.Schema({
    Nombre: { type: String, required: true },
    Iniciada: { type: Boolean, required: true, default: false },
    Terminada: { type: Boolean, required: true, default: false },
    fechaInicio: { type: Date, required: true, immutable: true },
    fechaFin: { type: Date, required: true, immutable: true },
    Ganador: {
        type: {
            type: String,
            ref: 'Usuario.idUsuario'
        },
    },
    Turno: { type: Number, required: true, default: 0 },
    Jugadores: [{ type: JugadorSchema }],
    Mapa: [{ type: ContinenteSchema }]
});

module.exports = mongoose.model("Partida", PartidaSchema);
