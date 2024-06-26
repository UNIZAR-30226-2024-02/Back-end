const express = require('express')
const { connectDB, disconnectDB } = require('./config/db')
const registerRouter = require('./routes/register')
const loginRouter = require('./routes/login')
const rankingRouter = require('./routes/ranking')
const nuevaPartidaRouter = require('./routes/creaPartida')
const obtenerPartidasRouter = require('./routes/getPublicas')
const amistadRouter = require('./routes/amistad')
const tiendaRouter = require('./routes/tienda')
const chatRouter = require('./routes/chats')
const misSkinsRouter = require('./routes/misSkins')
const perfilRouter = require('./routes/perfil')
const cors = require('cors')
const http = require('http')
const setupSocket = require('./sockets/sockets')
const partidaRouter = require('./routes/partida')

const app = express();
const server = http.createServer(app);

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
app.use('/perfil', perfilRouter);
app.use('/partida', partidaRouter);

// ruta prueba principal
app.get('/', (req, res) => {
    res.send('Todo funciona bien');
})

// Configurar socket.io
setupSocket(server);

module.exports = { app, startApp, close };
