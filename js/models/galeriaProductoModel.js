import { supabase } from '../config/supabaseClient.js';

/**
 * Modelo para la gestión de galería de productos
 * Nexus Admin Suite - Model Layer
 */
export const galeriaProductoModel = {

    /**
     * Obtiene los elementos multimedia activos de un producto
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
     * MÉTODO PRIVADO: Normalización de datos
     * Evita que se guarden objetos JSON en columnas de texto.
     */
    _normalizarItem(item) {
        let urlFinal = '';
        let tipoFinal = 'imagen';

        // Si el item es directamente un string (la URL)
        if (typeof item === 'string') {
            urlFinal = item;
        }
        // Si es el objeto que viene del Controller o del View
        else if (item && typeof item === 'object') {
            // Prioridad 1: Buscar la URL en las propiedades comunes
            urlFinal = item.url || item.file_url || '';
            tipoFinal = item.tipo || 'imagen';
        }

        // Limpieza final: Asegurar que sea string y no contenga rastro de objetos
        return {
            url: String(urlFinal).trim(),
            tipo: String(tipoFinal).toLowerCase().includes('video') ? 'video' : 'imagen'
        };
    },

    /**
     * Inserta un solo elemento multimedia
     */
    async create(data) {
        try {
            const cleaned = this._normalizarItem(data);

            const { data: result, error } = await supabase
                .from('galeria_producto')
                .insert([{
                    id_producto: data.idProducto,
                    url: cleaned.url,
                    tipo: cleaned.tipo,
                    orden: parseInt(data.orden) || 0,
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
     * Inserta elementos en lote (Bulk Insert)
     * Corregido para mapear correctamente las columnas de la DB.
     */
    async createLote(idProducto, itemsMultimedia) {
        try {
            // Mapeamos los items asegurándonos de que 'url' sea solo el string
            const payload = itemsMultimedia.map(item => ({
                id_producto: idProducto,
                url: item.url,    // <--- Aquí debe llegar el string, no {url: '...'}
                tipo: item.tipo,  // <--- Aquí 'imagen' o 'video'
                orden: item.orden,
                visible: true
            }));

            const { data, error } = await supabase
                .from('galeria_producto')
                .insert(payload);

            if (error) throw error;
            return { exito: true, data };
        } catch (error) {
            console.error("Error en GaleriaModel:", error.message);
            throw error;
        }
    },

    /**
     * Actualiza un elemento multimedia
     */
    async update(id, updates) {
        try {
            const normalizado = this._normalizarItem(updates);
            const cleanUpdates = { ...updates };

            if (updates.url) cleanUpdates.url = normalizado.url;
            if (updates.tipo) cleanUpdates.tipo = normalizado.tipo;

            const { error } = await supabase
                .from('galeria_producto')
                .update(cleanUpdates)
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error("Model Error [update]:", error.message);
            return false;
        }
    },

    /**
     * Borrado lógico (Soft Delete)
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
     * Borrado físico (Limpieza antes de re-insertar en Edición)
     */
    async limpiarGaleria(idProducto) {
        try {
            const { error } = await supabase
                .from('galeria_producto')
                .delete()
                .eq('id_producto', idProducto);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error("Model Error [limpiarGaleria]:", error.message);
            return false;
        }
    }
};