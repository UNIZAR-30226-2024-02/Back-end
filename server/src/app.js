const express = require('express');
const connectDB = require('./config/db');
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
    } catch (error) {
        console.error('Error conexión BBDD', error);
    }
}


// Rutas
app.use('/register', registerRoutes);

// ruta prueba principal
app.get('/', (req, res) => {
    res.send('Todo funciona bien');
})

module.exports = { app, startApp };
