const connectDB = require('./connectDB');

async function startApp() {
    try {
        await connectDB();
    } catch (error) {
        console.error('Error conexión BBDD', error);
    }
}

startApp();

