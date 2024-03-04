const SkinModel = require('../models/Skin');


// Obtiene todos los artículos de la tienda
const obtenerTodo = async (options = {}) => {
    try {
      let query = SkinModel.find();
  
      if (options.sortBy) { // si quiere ordenar, ordenamos
        query = query.sort(options.sortBy);
      }
      // la añadimos un filtro de precio en caso de que así haya sido especificado por el usuario
      if (options.precioMin !== undefined || options.precioMax !== undefined) {
        const precioFilter = {};
  
        if (options.precioMin !== undefined) {
          precioFilter.$gte = options.precioMin;
        }
  
        if (options.precioMax !== undefined) {
          precioFilter.$lte = options.precioMax;
        }
  
        query = query.find({ precio: precioFilter });
      }
  
      const skins = await query.exec();
      return skins;
    } catch (error) {
      console.error('Error al obtener skins de la tienda:', error);
      throw error;
    }
  };

async function obtenerSkins() {
   
}

async function obtenerAvatares() {
   
}

async function obtenerTerrenos() {
   
}

async function comprar() {
   
}


// Devuelve las partidas públicas que no han empezado ni terminado
async function getPartidasDisponibles() {
    try {
        const partidasDisponibles = await Partida.find({ iniciada: false, terminada: false, publica: true });

        return partidasDisponibles;
    } catch (error) {
        console.error("Error al obtener partidas disponibles:", error);
        throw error;
    }
}

module.exports = {
    obtenerTodo, 
};