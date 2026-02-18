const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
// Aquí podrías importar middlewares de protección en el futuro
// const { esOwner } = require('../middlewares/authMiddleware');

// ==========================================
// RUTAS DE AUTENTICACIÓN
// ==========================================

// Iniciar sesión (Genera la cookie sb-access-token)
router.post('/login', usuarioController.login);

// Cerrar sesión (Limpia la cookie)
router.post('/logout', usuarioController.logout);

// ==========================================
// RUTAS DE GESTIÓN (CRUD)
// ==========================================

// Obtener todos los usuarios activos
// Nota: Cambiamos a 'listarUsuarios' si así se llama en tu controlador refactorizado
router.get('/todos', usuarioController.listarUsuarios);

// Registrar un nuevo usuario (Auth + Perfil)
router.post('/registro', usuarioController.registrar);

module.exports = router;