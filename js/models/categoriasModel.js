import { supabase } from '../config/supabaseClient.js';

export const categoriasModel = {
    /**
     * Obtiene todas las categorías de la base de datos.
     */
    async obtenerTodas() {
        try {
            const { data, error } = await supabase
                .from('categoria')
                .select('*')
                .order('nombre', { ascending: true });

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Error en categoriasModel.obtenerTodas:', err.message);
            return [];
        }
    },

    /**
     * Obtiene una categoría específica por su ID.
     */
    async obtenerPorId(id) {
        try {
            const { data, error } = await supabase
                .from('categoria')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (err) {
            console.error(`Error al obtener categoría ${id}:`, err.message);
            return null;
        }
    },

    /**
     * Crea una nueva categoría.
     * @param {Object} categoria - { nombre, visible, id_padre }
     */
    async crear(categoria) {
        try {
            const { data, error } = await supabase
                .from('categoria')
                .insert([categoria])
                .select();

            if (error) throw error;
            return { exito: true, data: data[0] };
        } catch (err) {
            return { exito: false, mensaje: err.message };
        }
    },

    /**
     * Actualiza una categoría existente.
     */
    async actualizar(id, cambios) {
        try {
            const { data, error } = await supabase
                .from('categoria')
                .update(cambios)
                .eq('id', id)
                .select();

            if (error) throw error;
            return { exito: true, data: data[0] };
        } catch (err) {
            return { exito: false, mensaje: err.message };
        }
    },

    /**
     * Elimina (o desactiva) una categoría.
     */
    async eliminar(id) {
        try {
            const { error } = await supabase
                .from('categoria')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { exito: true };
        } catch (err) {
            return { exito: false, mensaje: err.message };
        }
    }
};