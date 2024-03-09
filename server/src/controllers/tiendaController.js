const SkinModel = require('../models/Skin');
const UsuarioModel = require('../models/Usuario');


/*
 * Obtiene la lista de skins, permitiendo filtrar/ordenar según opciones. 
 * Parámetro sortBy -> Permite ordenar por precio 
 * Paráemtros precioMin y precioMax -> Permiten filtrar por precio. precioMin, precioMax IN [0, 10000000]
 * Parámetro tipo -> Permite filtrar por tipo de skin. tipo IN {'avatar', 'skin', 'terreno'}
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

// skinId -> nombre de la skin
// userId -> identificador del usuario
// devuelve true <-> se pudo comprar la skin (usuario & skin existen, usuario tiene dinero suficiente)
const comprarSkin = async (skinId, userId) => {
  try {
    // obtengo el usuario y la skin
    const usuario = await UsuarioModel.findOne({ $or: [{ idUsuario: userId }, { correo: userId }] });
    const tipoRegex = new RegExp(skinId, 'i');
    const skin = await SkinModel.findOne({ idSkin: tipoRegex });
    // usuario y skin existen, y el usuario tiene $$ para comprarla (no prestamos dinero, no somos judíos #noalausura)
    if (usuario && skin && usuario.puntos >= skin.precio) {
      
      if(usuario.skins.includes(skin)){ // si ya la tiene no le dejamos comprarla de nuevo
        return false;
      }
      usuario.skins.push(skin); // se la damos 
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