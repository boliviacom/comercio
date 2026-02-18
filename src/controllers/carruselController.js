const carruselModel = require('../models/carruselModel');

const carruselController = {

    // GET /api/carrusel
    listar: async (req, res) => {
        try {
            const data = await carruselModel.listar();
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // GET /api/carrusel/:id/items
    obtenerItems: async (req, res) => {
        try {
            const { id } = req.params;
            const items = await carruselModel.obtenerItems(id);
            
            // Aquí movimos tu lógica de mapeo que tenías en 'cargarItemsPorCarrusel'
            const mapeados = items.map(item => ({
                id: item.id,
                titulo: item.titulo_manual || item.producto?.nombre || item.categoria?.nombre || 'Sin título',
                subtitulo: item.subtitulo_manual || (item.producto?.precio ? `$ ${item.producto.precio}` : ''),
                imagen: item.imagen_url_manual || item.producto?.imagen_url || item.categoria?.imagen || 'fa-solid fa-image',
                tipo: item.producto_id ? 'producto' : (item.categoria_id ? 'categoria' : 'banner')
            }));

            res.json(mapeados);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // POST /api/carrusel/guardar-completo
    // Aquí movimos tu lógica de 'guardarConfiguracion'
    guardarTodo: async (req, res) => {
        try {
            const { config, items, id } = req.body; // Recibimos cabecera y detalle
            let carruselId = id;

            // 1. Guardar o Actualizar Cabecera
            if (id) {
                await carruselModel.actualizar(id, config);
            } else {
                const nuevo = await carruselModel.crear(config);
                carruselId = nuevo.data.id;
            }

            // 2. Gestión de Ítems (Lógica del bucle que tenías)
            if (carruselId) {
                await carruselModel.limpiarItemsCarrusel(carruselId);
                
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    await carruselModel.agregarItem({
                        carrusel_id: carruselId,
                        orden: i,
                        titulo_manual: item.titulo_manual || item.titulo,
                        subtitulo_manual: item.subtitulo_manual || item.subtitulo,
                        imagen_url_manual: item.imagen_url_manual || item.imagen_preview,
                        link_destino_manual: item.link || item.link_destino_manual,
                        producto_id: item.producto_id || null,
                        categoria_id: item.categoria_id || null
                    });
                }
            }

            res.json({ exito: true, id: carruselId });
        } catch (error) {
            res.status(500).json({ exito: false, mensaje: error.message });
        }
    },

    // DELETE /api/carrusel/:id
    eliminar: async (req, res) => {
        try {
            const { id } = req.params;
            const resultado = await carruselModel.eliminar(id);
            res.json(resultado);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = carruselController;