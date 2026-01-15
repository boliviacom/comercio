// js/models/paletaColorModel.js
import { supabase } from '../config/supabaseClient.js'; // <--- LA CLAVE ESTÁ AQUÍ

export const paletaColorModel = {
    
    async obtenerTodas() {
        // Ahora usamos 'supabase' que viene importado con tu URL y KEY
        const { data, error } = await supabase
            .from('paletas_colores')
            .select('*')
            .order('creado_en', { ascending: false });

        if (error) {
            console.error('Error al obtener paletas:', error);
            return null;
        }
        return data;
    },

    async crearPaleta(paleta) {
        const { data, error } = await supabase
            .from('paletas_colores')
            .insert([paleta])
            .select();

        if (error) return { exito: false, error };
        return { exito: true, data: data[0] };
    },

    async eliminarPaleta(id) {
        const { error } = await supabase
            .from('paletas_colores')
            .delete()
            .eq('id', id);

        return { exito: !error, error };
    },

    async activarPaleta(id) {
        try {
            // 1. Desactivar todas
            await supabase.from('paletas_colores').update({ es_activa: false }).neq('id', 0);

            // 2. Activar la elegida
            const { data, error } = await supabase
                .from('paletas_colores')
                .update({ es_activa: true })
                .eq('id', id)
                .select();

            if (error) throw error;
            return { exito: true, paletaActiva: data[0] };
        } catch (error) {
            return { exito: false, error: error.message };
        }
    }
};