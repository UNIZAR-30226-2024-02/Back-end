const express = require('express');
const connectDB = require('./config/db');

const app = express();

// db connection
async function startApp() {
    try {
        await connectDB();
    } catch (error) {
        console.error('Error conexión BBDD', error);
    }
}

// ruta prueba principal
app.get('/', (req, res) => {
    res.send('Todo funciona bien');
})


startApp();
app.listen(4000, () => {
    console.log('todo piola xD');
})
