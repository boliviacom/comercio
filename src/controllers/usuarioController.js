// controllers/usuarioController.js
const usuarioModel = require('../models/usuarioModel');

const usuarioController = {
    async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ exito: false, mensaje: "Todos los campos son obligatorios" });
            }

            const respuesta = await usuarioModel.login(email, password);

            // En usuarioController.js (Método login)
            // usuarioController.js -> dentro de login()
            if (respuesta.exito) {
                // Intentamos capturar el token de todas las formas posibles según la versión de Supabase
                const token =
                    respuesta.data?.session?.access_token ||
                    respuesta.session?.access_token ||
                    respuesta.data?.access_token ||
                    respuesta.access_token;

                if (!token) {
                    // Si sigue saliendo NO, vamos a ver qué tiene el objeto respuesta para entenderlo
                    console.error("Estructura de respuesta inesperada:", JSON.stringify(respuesta));
                    return res.status(500).json({ exito: false, mensaje: "Error al recuperar sesión" });
                }

                res.cookie('sb-access-token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 3600000
                });

                return res.status(200).json(respuesta);
            }
            res.status(401).json(respuesta);
        } catch (error) {
            res.status(500).json({ exito: false, mensaje: "Error interno del servidor" });
        }
    },

    // En usuarioController.js
    async logout(req, res) {
        try {
            await usuarioModel.logout();

            // BORRAMOS LA COOKIE
            res.clearCookie('sb-access-token');

            res.status(200).json({ exito: true, mensaje: "Sesión cerrada" });
        } catch (error) {
            res.status(500).json({ exito: false, mensaje: error.message });
        }
    },

    // ==========================================
    // AGREGAR ESTAS FUNCIONES QUE FALTABAN:
    // ==========================================

    async listarUsuarios(req, res) {
        try {
            const usuarios = await usuarioModel.obtenerTodos();
            res.status(200).json(usuarios);
        } catch (error) {
            res.status(500).json({ exito: false, mensaje: error.message });
        }
    },

    async registrar(req, res) {
        try {
            const resultado = await usuarioModel.crear(req.body);
            if (resultado.exito) {
                res.status(201).json(resultado);
            } else {
                res.status(400).json(resultado);
            }
        } catch (error) {
            res.status(500).json({ exito: false, mensaje: error.message });
        }
    }
};

module.exports = usuarioController;