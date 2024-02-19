const express = require('express');

const app = express();

// ruta prueba principal
app.get('/', (req, res) => {
    res.send('Todo funciona bien');
})

app.listen(4000, () => {
    console.log('todo piola xD');
})
