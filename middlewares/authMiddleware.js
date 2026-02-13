const usuarioModel = require('../models/usuarioModel');

const esOwner = async (req, res, next) => {
    try {
        const sesion = await usuarioModel.obtenerSesionActual();

        if (sesion && sesion.perfil.rol.toLowerCase() === 'owner') {
            return next(); // Todo bien, pasa al controlador
        }

        res.status(403).json({ exito: false, mensaje: "Acceso denegado: Se requiere ser Owner" });
    } catch (error) {
        res.status(401).json({ exito: false, mensaje: "Sesión no válida" });
    }
};

module.exports = { esOwner };