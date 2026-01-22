import { supabase } from '../config/supabaseClient.js';

/**
 * Modelo para la gestión de galería de productos (CRUD con Soft Delete)
 * Nexus Admin Suite - Model Layer - Actualizado para Supabase Client
 */
export const galeriaProductoModel = {
    
    /**
     * 1. VER (READ)
     * Obtiene los recursos visibles de un producto específico.
     * Filtra automáticamente por la columna 'visible'.
     */
    async getByProducto(idProducto) {
        try {
            const { data, error } = await supabase
                .from('galeria_producto')
                .select('*')
                .eq('id_producto', idProducto)
                .eq('visible', true)
                .order('orden', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Model Error [getByProducto]:", error.message);
            return [];
        }
    },

    /**
     * 2. AÑADIR (CREATE)
     * Inserta un nuevo recurso (imagen/video) a la galería.
     */
    async create(data) {
        try {
            const { data: result, error } = await supabase
                .from('galeria_producto')
                .insert([{
                    id_producto: data.idProducto,
                    url: data.url,
                    tipo: data.tipo || 'imagen',
                    orden: data.orden || 0,
                    visible: true
                }])
                .select();
            
            if (error) throw error;
            return result[0];
        } catch (error) {
            console.error("Model Error [create]:", error.message);
            throw error;
        }
    },

    /**
     * NUEVO: AÑADIR EN LOTE (BULK INSERT)
     * Inserta múltiples imágenes a la vez. Ideal para la creación masiva del Controller.
     */
    async createLote(idProducto, urls) {
        try {
            const payload = urls.map((url, index) => ({
                id_producto: idProducto,
                url: url,
                tipo: 'imagen',
                orden: index,
                visible: true
            }));

            const { data, error } = await supabase
                .from('galeria_producto')
                .insert(payload)
                .select();

            if (error) throw error;
            return { exito: true, data };
        } catch (error) {
            console.error("Model Error [createLote]:", error.message);
            return { exito: false, mensaje: error.message };
        }
    },

    /**
     * 3. EDITAR (UPDATE)
     * Actualiza datos de un recurso existente (cambio de URL, tipo u orden).
     */
    async update(id, updates) {
        try {
            const { error } = await supabase
                .from('galeria_producto')
                .update(updates)
                .eq('id', id);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error("Model Error [update]:", error.message);
            return false;
        }
    },

    /**
     * 4. ELIMINAR (SOFT DELETE)
     * No borra el registro de la DB, solo lo oculta de la vista del usuario.
     */
    async delete(id) {
        try {
            const { error } = await supabase
                .from('galeria_producto')
                .update({ visible: false })
                .eq('id', id);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error("Model Error [delete]:", error.message);
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
            // En Supabase, para actualizar múltiples filas con diferentes valores 
            // de forma eficiente, solemos disparar las promesas en paralelo.
            const promesas = listaOrdenada.map(item => 
                this.update(item.id, { orden: item.orden })
            );
            await Promise.all(promesas);
            return true;
        } catch (error) {
            console.error("Model Error [updateOrden]:", error.message);
            return false;
        }
    }
};