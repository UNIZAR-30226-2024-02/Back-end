const express = require('express');
const {connectDB, disconnectDB} = require('./config/db');
const registerRoutes = require('./routes/register');

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
app.use('/register', registerRoutes);

// ruta prueba principal
app.get('/', (req, res) => {
    res.send('Todo funciona bien');
})

module.exports = { app, startApp, close };
