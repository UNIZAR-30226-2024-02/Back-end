const SkinModel = require('../models/Skin');
const UsuarioModel = require('../models/Usuario');


/**
 * Obtiene la lista de skins, permitiendo filtrar/ordenar según opciones.
 * @param {Object} options - Las opciones para filtrar y ordenar los skins.
 * @param {string} options.sortBy - Permite ordenar por precio.
 * @param {number} options.precioMin - Permite filtrar por precio mínimo.
 * @param {number} options.precioMax - Permite filtrar por precio máximo.
 * @param {string} options.tipo - Permite filtrar por tipo de skin. tipo IN {'avatar', 'skin', 'terreno'}.
 * @returns {Promise<Array>} La lista de skins.
 * @throws {Error} Si ocurre un error al obtener los skins.
 */
const obtenerTodo = async (options = {}) => {
  try {
    let query = SkinModel.find();

    if (options.sortBy) {
      query = query.sort(options.sortBy);
    }

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
    if (options.tipo) { 
      const tipoRegex = new RegExp(options.tipo, 'i');
      query = query.find({ tipo: tipoRegex });
    }

    const skins = await query.exec();
    return skins;
  } catch (error) {
    console.error('Error al obtener skins de la tienda:', error);
    throw error;
  }
};

/**
 * Compra una skin.
 * @param {string} skinId - El nombre de la skin.
 * @param {string} userId - El identificador del usuario.
 * @returns {Promise<boolean>} Devuelve true si se pudo comprar la skin (usuario & skin existen, usuario tiene dinero suficiente).
 * @throws {Error} Si ocurre un error al comprar la skin.
 */
const comprarSkin = async (skinId, userId) => {
  try {
    // obtengo el usuario y la skin
    const usuario = await UsuarioModel.findOne({ $or: [{ idUsuario: userId }, { correo: userId }] });
    const tipoRegex = new RegExp('^' + skinId, 'i');
    const skin = await SkinModel.findOne({ idSkin: tipoRegex });
    console.log(skinId)
    console.log(skin)
    // usuario y skin existen, y el usuario tiene $$ para comprarla (no prestamos dinero, no somos judíos #noalausura)
    if (usuario && skin && usuario.puntos >= skin.precio) {
      
      if(usuario.skins.includes(skin.idSkin)){ // si ya la tiene no le dejamos comprarla de nuevo
        return false;
      }
      usuario.skins.push(skin.idSkin); // se la damos 
      usuario.puntos -= skin.precio; // y le cobramos 
      
      await usuario.save();
      console.log("aa")
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('Error al comprar la skin:', error);
    console.log("Aaaaa")
    throw error;
  }
};

module.exports = {
    obtenerTodo, 
    comprarSkin
};