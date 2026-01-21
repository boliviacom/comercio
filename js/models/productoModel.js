import { supabase } from '../config/supabaseClient.js';

/**
 * Producto Model - Nexus Admin Suite
 * Actualizado para soporte de cambios individuales y masivos.
 */
export const productoModel = {

    /**
     * Obtiene todos los productos activos (visible = true).
     */
    async listarActivos() {
        try {
            const { data, error } = await supabase
                .from('producto')
                .select(`
                    *,
                    categoria:id_categoria ( nombre )
                `)
                .eq('visible', true)
                .order('id', { ascending: false });

            if (error) throw error;

            return data.map(p => ({
                ...p,
                nombre_categoria: p.categoria ? p.categoria.nombre : 'Sin Categoría'
            }));
        } catch (err) {
            console.error('Error en productoModel.listarActivos:', err.message);
            return [];
        }
    },

    /**
     * Actualiza un producto específico (Individual).
     * El controlador envía cambios como: { habilitar_whatsapp: true }
     */
    async actualizar(id, cambios) {
        try {
            // Sanitización básica para datos numéricos si existen
            if (cambios.precio !== undefined) cambios.precio = parseFloat(cambios.precio);
            if (cambios.stock !== undefined) cambios.stock = parseInt(cambios.stock);
            if (cambios.id_categoria !== undefined) cambios.id_categoria = parseInt(cambios.id_categoria);

            const { data, error } = await supabase
                .from('producto')
                .update(cambios)
                .eq('id', id)
                .select();

            if (error) throw error;
            return { exito: true, data: data[0] };
        } catch (err) {
            console.error('Error al actualizar producto:', err.message);
            return { exito: false, mensaje: err.message };
        }
    },

    /**
     * ACTUALIZACIÓN MASIVA (Para los Master Switches)
     * Cambia un campo para TODOS los productos que estén visibles.
     */
    async actualizarMasivo(campo, valor) {
        try {
            const { data, error } = await supabase
                .from('producto')
                .update({ [campo]: valor }) // Sintaxis de propiedad dinámica
                .eq('visible', true)        // Solo a los productos activos
                .select();

            if (error) throw error;
            return { exito: true, total: data.length };
        } catch (err) {
            console.error(`Error en actualización masiva (${campo}):`, err.message);
            return { exito: false, mensaje: err.message };
        }
    },

    /**
     * Obtiene un producto específico por su ID.
     */
    async obtenerPorId(id) {
        try {
            const { data, error } = await supabase
                .from('producto')
                .select(`*, categoria:id_categoria ( nombre )`)
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (err) {
            console.error(`Error al obtener producto ${id}:`, err.message);
            return null;
        }
    },

    /**
     * Crea un nuevo producto.
     */
    async crear(datos) {
        try {
            const payload = {
                nombre: datos.nombre.trim(),
                descripcion: datos.descripcion,
                imagen_url: datos.imagen_url,
                precio: parseFloat(datos.precio),
                stock: parseInt(datos.stock),
                id_categoria: parseInt(datos.id_categoria),
                visible: true,
                mostrar_precio: datos.mostrar_precio ?? true,
                habilitar_whatsapp: datos.habilitar_whatsapp ?? false
            };

            const { data, error } = await supabase
                .from('producto')
                .insert([payload])
                .select();

            if (error) throw error;
            return { exito: true, data: data[0] };
        } catch (err) {
            console.error('Error al crear producto:', err.message);
            return { exito: false, mensaje: err.message };
        }
    },

    /**
     * Soft Delete (cambia visible a false).
     */
    async eliminar(id) {
        try {
            const { data, error } = await supabase
                .from('producto')
                .update({ visible: false })
                .eq('id', id)
                .select();

            if (error) throw error;
            return { exito: true, data: data[0] };
        } catch (err) {
            console.error('Error en Soft Delete:', err.message);
            return { exito: false, mensaje: err.message };
        }
    }
};