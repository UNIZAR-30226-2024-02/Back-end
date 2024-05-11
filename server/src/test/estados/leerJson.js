const fs = require('fs');

async function leerJson(filepath) {
    try {
        const jsonData = fs.readFileSync(filepath, 'utf8');
        return JSON.parse(jsonData);
    } catch (error) {
        console.error('Error al leer el archivo JSON:', error);
        throw error;
    }
}

module.exports = leerJson;