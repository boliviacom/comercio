const usuarioService = require('../services/usuarioService');

const esOwner = async (req, res, next) => {
    try {
        const token = req.cookies['sb-access-token'];

        // Si no hay token, no perdemos tiempo y redirigimos
        if (!token) return res.redirect('/');

        const usuarioFull = await usuarioService.validarSesion(token);

        // Validamos que la sesión exista y que el rol sea 'owner'
        if (usuarioFull?.perfil?.rol?.toLowerCase() === 'owner') {
            // Adjuntamos el usuario al objeto 'req' por si lo necesitas en el dashboard
            req.usuario = usuarioFull; 
            return next();
        }

        // Si llegamos aquí es porque no es owner o la sesión no es válida
        return res.redirect('/'); 

    } catch (error) {
        // En caso de error crítico, simplemente mandamos al inicio para proteger la ruta
        return res.redirect('/');
    }
};

module.exports = { esOwner };