const Partida = require('../models/Partida');


// privacidad --> boolean 1 privada 0 pública
// user -> Usuario que crea la partida
// num -> Número mínimo/máximo de usuarios
// nombre -> nombre de la partida
// password -> contraseña de la partida, en caso de ser privada
async function crearPartida(privacidad, user, num, nombre, password) {
    console.log(privacidad, user, num, nombre, password)
    fechaInicio = new Date(); // se supone q esto coge la fecha actual
    const nuevaPartida = new Partida({ nombre: nombre, 
                                       iniciada: false, 
                                       terminada: false,
                                       fechaInicio: fechaInicio,
                                       fechaFin: null,
                                       publica: !privacidad,
                                       password: password // si me llega null saldra null y ya
                                       //resto null
                                       }); 

    // Si existe una partida con el mismo nombre y la misma password, que no haya terminado -> no podremos crearla (?)
    const partidaExistente = await Partida.findOne({ nombre: nombre, terminada: false, password: password });
    if(partidaExistente)
        throw new Error('Ya hay una partida en curso con estas credenciales.')
    await nuevaPartida.save()
}

module.exports = {
    crearPartida
};