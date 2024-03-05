const express = require('express');
const {connectDB, disconnectDB} = require('./config/db');
const registerRouter = require('./routes/register');
const loginRouter = require('./routes/login');
const rankingRouter = require('./routes/ranking');
const nuevaPartidaRouter = require('./routes/creaPartida');
const obtenerPartidasRouter = require('./routes/getPublicas');
const amistadRouter = require('./routes/amistad');

const app = express();

// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }))

// parse application/json
app.use(express.json())

// db connection
async function startApp() {
    try {
        await connectDB();
        server = app.listen(4000, () => {
            console.log('Todo piola xD');
        });
    } catch (error) {
        console.error('Error conexión BBDD', error);
    }
}

function close() {
    return new Promise(async (resolve, reject) => {
        try {
            await disconnectDB();
            if (server) {
                server.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('Servidor detenido');
                        resolve();
                    }
                });
            } else {
                resolve(); // Si el servidor no existe, considera la operación como completada.
            }
        } catch (err) {
            reject(err);
        }
    });
}


// Rutas
app.use('/register', registerRouter);
app.use('/login', loginRouter);
app.use('/ranking', rankingRouter);
app.use('/nuevaPartida', nuevaPartidaRouter);
app.use('/partidas', obtenerPartidasRouter);
app.use('/amistad', amistadRouter);

// ruta prueba principal
app.get('/', (req, res) => {
    res.send('Todo funciona bien');
})

module.exports = { app, startApp, close };
