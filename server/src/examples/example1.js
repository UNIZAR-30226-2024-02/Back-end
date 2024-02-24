const connectDB = require('../config/db');
const Skin = require('../models/Skin')

async function main() {
    try {
        // Conexion a la bbdd, mongoose pasa a utilizar la BBDD que hay en atlas
        // no hace falta gestionar un objeto con la conexion.
        await connectDB();

        // Fijarse en que funciones se llama sobre la nueva instancia de Skin (newSkin)
        // y cuales se llama directamente sobre el modelo Skin

        // Crear skin nueva
        const newSkin = new Skin({
            idSkin: "exampleSkin",
            tipo: "Avatar",
            precio: 100,
            path: "/path/exampleSkin"
        });

        // Guardar la nueva skin en la BBDD
        const savedSkin = await newSkin.save();
        console.log("Skin guardado exitosamente:", savedSkin);

        // Actualizar un campo
        const updateResult = await Skin.updateOne(
            { idSkin: "exampleSkin" },
            { $set: { tipo: "setFichas" } }
        );
        console.log("Actualización exitosa:", updateResult);

        // Encontrar la skin
        const foundSkin = await Skin.findOne({ idSkin: "exampleSkin" });
        if (foundSkin) {
            console.log("Skin encontrada:", foundSkin);
        } else {
            console.log("No se encontro ninguna skin con ese ID");
        }

        // Eliminar la skin de la BBDD
        const deleteResult = await Skin.deleteOne({ idSkin: "exampleSkin" });
        if (deleteResult.deletedCount > 0) {
            console.log("Skin eliminada exitosamente");
        } else {
            console.log("No se encontro ninguna skin para eliminar");
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

main();
