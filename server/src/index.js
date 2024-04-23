const { app, startApp } = require('./app');

(async () => {
    try {
        await startApp();
        
    } catch (error) {
        console.error('Error al iniciar la aplicación:', error);
        process.exit(1);
    }
})();

