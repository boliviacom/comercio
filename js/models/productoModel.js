import { supabase } from '../config/supabaseClient.js';

/**
 * Producto Model - Nexus Admin Suite
 * Versión con Soporte para Vista SQL (Lectura) y Tablas Base (Escritura)
 */
export const productoModel = {

    /**
     * Obtiene productos usando la VISTA especializada.
     * Esto resuelve automáticamente la jerarquía Padre > Hijo.
     */
    async listarActivos() {
        try {
            const { data, error } = await supabase
                .from('v_productos_detallados') // Usamos tu nueva vista
                .select('*')
                .eq('visible', true)
                .order('producto_id', { ascending: false });

            if (error) throw error;

            // Mapeamos para mantener compatibilidad con el resto de la App
            return data.map(p => ({
                ...p,
                id: p.producto_id, // La vista usa producto_id, mapeamos a id
                nombre: p.producto_nombre,
                // Si existe un padre, mostramos la ruta completa
                nombre_categoria: p.categoria_padre_nombre 
                    ? `${p.categoria_padre_nombre} > ${p.categoria_nombre}`
                    : (p.categoria_nombre || 'Sin Categoría')
            }));
        } catch (err) {
            console.error('Error en productoModel.listarActivos (Vista):', err.message);
            return [];
        }
    },

    /**
     * Obtiene un producto por ID usando la vista para traer detalle completo
     */
    async obtenerPorId(id) {
        try {
            const { data, error } = await supabase
                .from('v_productos_detallados')
                .select('*')
                .eq('producto_id', id)
                .single();

            if (error) throw error;
            
            // Normalizamos el ID para el resto del sistema
            return { ...data, id: data.producto_id };
        } catch (err) {
            console.error(`Error al obtener producto ${id} desde vista:`, err.message);
            return null;
        }
    },

    /**
     * Actualiza un producto (IMPORTANTE: Se usa la tabla base, no la vista)
     */
    async actualizar(id, cambios) {
        try {
            if (cambios.precio !== undefined) cambios.precio = parseFloat(cambios.precio);
            if (cambios.stock !== undefined) cambios.stock = parseInt(cambios.stock);
            
            // Limpiamos campos que vienen de la vista y no pertenecen a la tabla física
            const { 
                producto_id, producto_nombre, nombre_categoria, 
                categoria_nombre, categoria_padre_nombre, categoria_padre_id,
                categoria_id, ...datosLimpios 
            } = cambios;

            const { data, error } = await supabase
                .from('producto')
                .update(datosLimpios)
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
     * Crea un nuevo registro (Tabla base)
     */
    async crear(datos) {
        try {
            const payload = {
                nombre: datos.nombre.trim(),
                descripcion: datos.descripcion || '',
                imagen_url: datos.imagen_url || '',
                precio: parseFloat(datos.precio) || 0,
                stock: parseInt(datos.stock) || 0,
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
     * Víncula producto con categoría (Tabla intermedia)
     */
    async vincularCategoria(id_producto, id_categoria) {
        try {
            const { error } = await supabase
                .from('producto_categorias_rel')
                .insert([{ id_producto, id_categoria }]);

            if (error) throw error;
            return { exito: true };
        } catch (err) {
            console.error('Error al vincular categoría:', err.message);
            return { exito: false };
        }
    },

    /**
     * Actualización Masiva (Tabla base)
     * Actualiza TODOS los productos visibles
     */
    async actualizarMasivo(campo, valor) {
        try {
            const { data, error } = await supabase
                .from('producto')
                .update({ [campo]: valor })
                .eq('visible', true)
                .select();

            if (error) throw error;
            return { exito: true, total: data.length };
        } catch (err) {
            console.error(`Error en actualización masiva:`, err.message);
            return { exito: false, mensaje: err.message };
        }
    },

    /**
     * ACTUALIZACIÓN POR FILTRO (Nuevo método necesario para el Controller)
     * Actualiza solo un grupo específico de IDs
     */
    async actualizarVarios(ids, datos) {
        try {
            const { data, error } = await supabase
                .from('producto')
                .update(datos)
                .in('id', ids);

            if (error) throw error;
            return { exito: true, data };
        } catch (err) {
            console.error("Error en actualizarVarios (Model):", err.message);
            return { exito: false, mensaje: err.message };
        }
    },

    /**
     * Soft Delete (Tabla base)
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