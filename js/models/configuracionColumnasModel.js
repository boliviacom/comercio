import { supabase } from '../config/supabaseClient.js';

export const configuracionColumnasModel = {
    /**
     * Obtiene la configuración con prioridad: 
     * 1. Usuario específico 
     * 2. Rol del usuario
     */
    async obtenerConfiguracion(tablaNombre, usuarioId = null, rolId = null) {
        try {
            let query = supabase
                .from('configuracion_columnas')
                .select('columnas_visibles, usuario_id, rol_id')
                .eq('tabla_nombre', tablaNombre);

            // --- CORRECCIÓN: Filtros Dinámicos ---
            // Solo añadimos al .or() los valores que realmente existen.
            let filtros = [];
            if (usuarioId && usuarioId !== 'null') {
                filtros.push(`usuario_id.eq.${usuarioId}`);
            }
            if (rolId && rolId !== 'null') {
                filtros.push(`rol_id.eq.${rolId}`);
            }

            // Si hay filtros, aplicamos el .or(), si no, no tiene sentido consultar
            if (filtros.length > 0) {
                query = query.or(filtros.join(','));
            } else {
                return null; 
            }

            const { data, error } = await query;

            if (error) throw error;
            if (!data || data.length === 0) return null;

            // Lógica de prioridad: Si existe la del usuario, devolvemos esa.
            const userConfig = data.find(c => c.usuario_id === usuarioId);
            if (userConfig) return userConfig.columnas_visibles;

            // Si no, la del rol.
            const roleConfig = data.find(c => c.rol_id === rolId);
            if (roleConfig) return roleConfig.columnas_visibles;

            return null;
        } catch (err) {
            console.error('Error en configuracionColumnasModel.obtener:', err);
            return null;
        }
    },

    /**
     * Guarda o actualiza usando UPSERT aprovechando los UNIQUE constraints
     */
    async guardarConfiguracion(config) {
        try {
            // --- CORRECCIÓN: Limpieza de Objeto ---
            // Aseguramos que los campos vacíos sean null real y no strings vacíos o "null"
            const payload = {
                tabla_nombre: config.tabla_nombre,
                columnas_visibles: config.columnas_visibles,
                usuario_id: (config.usuario_id && config.usuario_id !== 'null') ? config.usuario_id : null,
                rol_id: (config.rol_id && config.rol_id !== 'null') ? config.rol_id : null
            };

            const { error } = await supabase
                .from('configuracion_columnas')
                .upsert(payload, { 
                    onConflict: payload.usuario_id ? 'tabla_nombre,usuario_id' : 'tabla_nombre,rol_id' 
                });

            if (error) throw error;
            return { exito: true };
        } catch (err) {
            console.error('Error al guardar configuración:', err.message);
            return { exito: false, mensaje: err.message };
        }
    },

    /**
     * Elimina la configuración personalizada
     */
    async resetearConfiguracion(tablaNombre, destinoTipo, destinoId) {
        try {
            const query = supabase
                .from('configuracion_columnas')
                .delete()
                .eq('tabla_nombre', tablaNombre);

            if (destinoTipo === 'usuario') query.eq('usuario_id', destinoId);
            else query.eq('rol_id', destinoId);

            const { error } = await query;
            if (error) throw error;
            return { exito: true };
        } catch (err) {
            console.error('Error al resetear configuración:', err.message);
            return { exito: false, mensaje: err.message };
        }
    }
};