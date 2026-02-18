const express = require('express');
const router = express.Router();
const carruselController = require('../controllers/carruselController');

/**
 * RUTAS PARA LA GESTIÓN DE CARRUSELES
 * Prefijo: /api/carrusel
 */

// 1. Obtener todos los carruseles (Cabeceras)
router.get('/', carruselController.listar);

// 2. Obtener los ítems de un carrusel específico (Detalle)
router.get('/:id/items', carruselController.obtenerItems);

// 3. Guardar o actualizar un carrusel completo (Cabecera + Ítems)
// Esta ruta centraliza la lógica pesada que tenías de limpiar e insertar ítems
router.post('/guardar-completo', carruselController.guardarTodo);

// 4. Obtener el siguiente número de orden para un slug
// Útil cuando vas a crear uno nuevo desde el front
router.get('/siguiente-orden/:slug', async (req, res) => {
    try {
        const carruselModel = require('../models/carruselModel');
        const orden = await carruselModel.obtenerSiguienteOrden(req.params.slug);
        res.json({ orden });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. Eliminar un carrusel y sus ítems (Borrado en cascada)
router.delete('/:id', carruselController.eliminar);

module.exports = router;