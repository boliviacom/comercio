/**
 * Modelo para la gestión de galería de productos (CRUD con Soft Delete)
 * Nexus Admin Suite - Model Layer
 */

export const galeriaProductoModel = {
    
    /**
     * 1. VER (READ)
     * Obtiene los recursos visibles de un producto específico.
     * Filtra automáticamente por la columna 'visible'.
     */
    async getByProducto(idProducto) {
        try {
            // Filtramos por producto, que sea visible y ordenamos por la columna orden
            const response = await fetch(`/api/galeria_producto?id_producto=eq.${idProducto}&visible=eq.true&order=orden.asc`);
            if (!response.ok) throw new Error('Error al obtener la galería');
            
            return await response.json();
        } catch (error) {
            console.error("Model Error [getByProducto]:", error);
            return [];
        }
    },

    /**
     * 2. AÑADIR (CREATE)
     * Inserta un nuevo recurso (imagen/video) a la galería.
     */
    async create(data) {
        try {
            // Estructura esperada: { id_producto, url, tipo, orden }
            const response = await fetch(`/api/galeria_producto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_producto: data.idProducto,
                    url: data.url,
                    tipo: data.tipo || 'imagen',
                    orden: data.orden || 0,
                    visible: true
                })
            });
            
            return await response.json();
        } catch (error) {
            console.error("Model Error [create]:", error);
            throw error;
        }
    },

    /**
     * 3. EDITAR (UPDATE)
     * Actualiza datos de un recurso existente (cambio de URL, tipo u orden).
     */
    async update(id, updates) {
        try {
            const response = await fetch(`/api/galeria_producto?id=eq.${id}`, {
                method: 'PATCH', // O 'PUT' según tu backend
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            
            return response.ok;
        } catch (error) {
            console.error("Model Error [update]:", error);
            return false;
        }
    },

    /**
     * 4. ELIMINAR (SOFT DELETE)
     * No borra el registro de la DB, solo lo oculta de la vista del usuario.
     */
    async delete(id) {
        try {
            // En lugar de DELETE, hacemos un UPDATE de la columna visible
            const response = await fetch(`/api/galeria_producto?id=eq.${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ visible: false })
            });
            
            return response.ok;
        } catch (error) {
            console.error("Model Error [delete]:", error);
            return false;
        }
    },

    /**
     * EXTRA: REORDENAR (Bulk Update)
     * Util para cuando arrastras imágenes y quieres guardar el nuevo orden de todas.
     */
    async updateOrden(listaOrdenada) {
        // listaOrdenada: [{id: 1, orden: 0}, {id: 2, orden: 1}, ...]
        try {
            const promesas = listaOrdenada.map(item => 
                this.update(item.id, { orden: item.orden })
            );
            await Promise.all(promesas);
            return true;
        } catch (error) {
            console.error("Model Error [updateOrden]:", error);
            return false;
        }
    }
};