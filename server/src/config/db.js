const path = require('path');
const fs = require('fs');

// Función para encontrar el archivo .env en directorios superiores
function findEnvFile() {
    let currentDir = __dirname;

    while (currentDir !== '/') {
        const envPath = path.join(currentDir, '.env');

        if (fs.existsSync(envPath)) {
            return envPath;
        }

        currentDir = path.dirname(currentDir);
    }

    return null;
}

// Busca el archivo .env
const envPath = findEnvFile();

if (envPath) {
    // Carga las variables de entorno si se encuentra el archivo .env
    require('dotenv').config({ path: envPath });
    console.log(`Se encontró el archivo .env en: ${envPath}`);
} else {
    console.error('No se encontró el archivo .env en los directorios superiores.');
    process.exit(1);
}

const mongoose = require('mongoose');

async function connectDB() {
    try {
        console.log(process.env.DB_MONGO);
        await mongoose.connect(process.env.DB_MONGO);
        console.log('Successful connection');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

async function disconnectDB() {
    try {
        await mongoose.disconnect();
        console.log('Disconnected from the database');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

module.exports = { connectDB, disconnectDB };

