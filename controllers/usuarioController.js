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

            if (respuesta.exito) {
                const rol = respuesta.perfil.rol.toLowerCase();
                if (rol === 'owner') {
                    return res.status(200).json(respuesta);
                } else {
                    await usuarioModel.logout();
                    return res.status(403).json({ 
                        exito: false, 
                        mensaje: "Acceso denegado: Se requieren permisos de Propietario." 
                    });
                }
            }
            res.status(401).json(respuesta);
        } catch (error) {
            res.status(500).json({ exito: false, mensaje: "Error interno del servidor" });
        }
    },

    async logout(req, res) {
        const resultado = await usuarioModel.logout();
        res.status(200).json(resultado);
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