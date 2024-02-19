const express = require('express');
const connectDB = require('./config/db');

const app = express();

// db connection
connectDB();

// ruta prueba principal
app.get('/', (req, res) => {
    res.send('Todo funciona bien');
})

app.listen(4000, () => {
    console.log('todo piola xD');
})
