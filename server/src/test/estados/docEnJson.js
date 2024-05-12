const fs = require('fs');
const { Partida } = require('../../models/Partida');
const { startApp, close } = require('../../app');

async function guardarPartidaComoJSON(nombrePartida) {
    try {
        // Iniciar la aplicación para acceder a la base de datos
        await startApp();

        // Buscar la partida por su nombre
        const partida = await Partida.findOne({ nombre: nombrePartida });

        // Verificar si la partida existe
        if (!partida) {
            console.log(`No se ha encontrado ninguna partida con el nombre: '${nombrePartida}'.`);
            return;
        }

        // Convertir la partida a JSON
        const partidaJSON = partida.toJSON();

        // Guardar la partida como JSON en un archivo
        const filePath = `${nombrePartida}.json`;
        fs.writeFile(filePath, JSON.stringify(partidaJSON, null, 2), 'utf8', (err) => {
            if (err) {
                console.error('Error al guardar la partida como JSON:', err);
            } else {
                console.log(`Partida guardada en: '${filePath}'.`);
            }
        });

        close();
    } catch (error) {
        console.error('Error al buscar la partida en la base de datos:', error);
    }
}

const nombrePartida = process.argv[2];

// Verificar los argumentos
if (!nombrePartida) {
    console.error('Pasar el nombre de la partida como argumento');
} else {
    // Ejecutar la función para guardar la partida como JSON
    guardarPartidaComoJSON(nombrePartida);
}
