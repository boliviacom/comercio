const usuarioService = require('../services/usuarioService');
const { registroSchema, loginSchema } = require('../validators/usuarioValidator');

const usuarioController = {
    /**
     * Inicio de Sesión con Cookie Segura
     */
    async login(req, res) {
        try {
            // 1. Validamos con Zod
            const { email, password } = loginSchema.parse(req.body);

            // 2. Llamamos al servicio
            const respuesta = await usuarioService.login(email, password);

            // 3. Extraemos el token (usando tu lógica de "todas las formas posibles")
            const token = respuesta.session?.access_token || respuesta.user?.access_token;

            if (!token) {
                return res.status(500).json({ exito: false, mensaje: "Error al recuperar sesión" });
            }

            // 4. Seteamos la Cookie (Tu lógica original de seguridad)
            res.cookie('sb-access-token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 3600000 // 1 hora
            });

            // 5. Respondemos al cliente
            return res.status(200).json({
                exito: true,
                mensaje: "Bienvenido",
                user: respuesta.user,
                perfil: respuesta.perfil
            });

        } catch (err) {
            return manejarErrores(res, err);
        }
    },

    /**
     * Registro con Validación Robusta
     */
    async registrar(req, res) {
        try {
            // 1. Validar entrada
            const datosValidados = registroSchema.parse(req.body);

            // 2. Servicio (Auth + Perfil + Rollback manual si falla)
            const nuevoUsuario = await usuarioService.registrarNuevoUsuario(datosValidados);

            return res.status(201).json({
                exito: true,
                data: nuevoUsuario
            });
        } catch (err) {
            return manejarErrores(res, err);
        }
    },

    /**
     * Cerrar Sesión
     */
    async logout(req, res) {
        try {
            await usuarioService.logout();
            res.clearCookie('sb-access-token');
            return res.status(200).json({ exito: true, mensaje: "Sesión cerrada" });
        } catch (err) {
            return res.status(500).json({ exito: false, mensaje: err.message });
        }
    },
    /**
     * Listar todos los usuarios (Agrega esto)
     */
    async listarUsuarios(req, res) {
        try {
            // Llamamos al servicio para obtener la data procesada
            const usuarios = await usuarioService.obtenerEstructuraConfiguracion();
            
            return res.status(200).json({
                exito: true,
                data: usuarios
            });
        } catch (err) {
            return manejarErrores(res, err);
        }
    }
};

/**
 * Manejador de Errores centralizado (Zod + Generales)
 */
function manejarErrores(res, err) {
    if (err.name === "ZodError") {
        return res.status(400).json({
            exito: false,
            errores: err.errors.map(e => ({ campo: e.path[0], mensaje: e.message }))
        });
    }
    return res.status(500).json({
        exito: false,
        mensaje: err.message || "Error interno del servidor"
    });
}

module.exports = usuarioController;