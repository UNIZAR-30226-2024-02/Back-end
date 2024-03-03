const jwt = require('jsonwebtoken');

function obtenerUsuarioDesdeToken(token) {
  if (!token) {
    return null; // No se proporcionó un token
  }

  try {
    const decoded = jwt.verify(token, 'claveSecreta');
    return decoded.idUsuario;
  } catch (error) {
    return null; // Token no válido
  }
}

module.exports = obtenerUsuarioDesdeToken;