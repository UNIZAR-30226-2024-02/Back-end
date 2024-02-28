// server.js
const { app, startApp } = require('./app');

const PORT = process.env.PORT || 4000;

(async () => {
    try {
        await startApp();
        app.listen(PORT, () => {
            console.log(`Servidor escuchando en el puerto ${PORT}`);
        });
    } catch (error) {
        console.error('Error al iniciar la aplicación:', error);
        process.exit(1);
    }
})();
