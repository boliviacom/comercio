// routes/usuarioRoutes.js
const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

// ==========================================
// RUTAS DE AUTENTICACIÓN
// ==========================================

// POST /api/usuarios/login
router.post('/login', usuarioController.login);

// POST /api/usuarios/logout
router.post('/logout', usuarioController.logout);

// ==========================================
// RUTAS DE GESTIÓN (CRUD)
// ==========================================

// GET /api/usuarios/todos -> Para listar en el panel
router.get('/todos', usuarioController.listarUsuarios);

// POST /api/usuarios/registro -> Para crear nuevos usuarios
//router.post('/registro', usuarioController.registrar);

module.exports = router;