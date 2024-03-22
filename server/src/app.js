const express = require('express');
const {connectDB, disconnectDB} = require('./config/db');
const registerRouter = require('./routes/register');
const loginRouter = require('./routes/login');
const rankingRouter = require('./routes/ranking');
const nuevaPartidaRouter = require('./routes/creaPartida');
const obtenerPartidasRouter = require('./routes/getPublicas');
const amistadRouter = require('./routes/amistad');
const tiendaRouter = require('./routes/tienda');
const chatRouter = require('./routes/chats')
const misSkinsRouter = require('./routes/misSkins')
const cors = require('cors');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
    cors: {
      origin: "http://localhost:4200",
      methods: ["GET", "POST"]
    }
  });

// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }))

// parse application/json
app.use(express.json())

// db connection
async function startApp() {
    try {
        await connectDB();
        server.listen(4000, () => {
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

app.use(cors());  // Habilita CORS
// Rutas
app.use('/register', registerRouter);
app.use('/login', loginRouter);
app.use('/ranking', rankingRouter);
app.use('/nuevaPartida', nuevaPartidaRouter);
app.use('/partidas', obtenerPartidasRouter);
app.use('/amistad', amistadRouter);
app.use('/tienda', tiendaRouter);
app.use('/chats', chatRouter)
app.use('/misSkins', misSkinsRouter)

// ruta prueba principal
app.get('/', (req, res) => {
    res.send('Todo funciona bien');
})

io.on('connection', (socket) => {
    const clientIp = socket.handshake.address; // Obtener la dirección IP del cliente
    console.log(`Usuario con IP ${clientIp} conectado`); // Registrar la IP del cliente

    socket.on('joinGame', (gameId) => {
        socket.join(gameId);
        console.log(`Usuario se unió a la partida ${gameId}`);
        console.log(`IP del cliente: ${clientIp}`);
    });

    socket.on('friendRequest', (data) => {
        io.to(data.userId).emit('friendRequest', data.notification);
        console.log(`Notificación de solicitud de amistad enviada a ${data.userId}`);
        console.log(`IP del cliente: ${clientIp}`);
    });

    socket.on('disconnectGame', (gameId) => {
        console.log(`Usuario desconectado de la partida ${gameId}`);
        console.log(`IP del cliente: ${clientIp}`);
    });

});

function notifyGame(gameId, notification) {
    io.to(gameId).emit('gameNotification', notification);
    console.log(`Notificación de juego enviada a la partida ${gameId}`);
}

setTimeout(() => {
    notifyGame('game123', 'Mensaje de notificación para los usuarios de la partida');
}, 5000);


module.exports = { app, startApp, close };
