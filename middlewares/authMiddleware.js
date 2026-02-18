// middlewares/authMiddleware.js
const usuarioModel = require('../models/usuarioModel');

const esOwner = async (req, res, next) => {
    try {
        // 1. Extraemos el token de la cookie
        const token = req.cookies['sb-access-token'];

        if (!token) {
            console.log("No hay token en las cookies, denegando acceso.");
            return res.redirect('/'); // Si no hay cookie, al login
        }

        // 2. Validamos la sesión con el modelo
        // Nota: Asegúrate de que obtenerSesionActual acepte el token como parámetro
        const sesion = await usuarioModel.obtenerSesionActual(token);

        if (sesion && sesion.perfil.rol.toLowerCase() === 'owner') {
            return next(); // Es dueño, adelante
        }

        console.log("Usuario no es Owner, redirigiendo...");
        res.redirect('/'); 
    } catch (error) {
        console.error("Error en middleware auth:", error.message);
        res.redirect('/');
    }
};

module.exports = { esOwner };