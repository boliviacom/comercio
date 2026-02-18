// src/models/usuarioModel.js
const supabase = require('../config/supabase');

const usuarioModel = {
    /**
     * Inserta un nuevo perfil en la tabla 'usuario'
     */
    async crearPerfil(datos) {
        const { data, error } = await supabase
            .from('usuario')
            .insert([datos])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Obtiene un perfil por su ID (UUID de Auth)
     */
    async obtenerPorId(id) {
        const { data, error } = await supabase
            .from('usuario')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Obtiene todos los usuarios visibles ordenados
     */
    async obtenerTodosActivos() {
        const { data, error } = await supabase
            .from('usuario')
            .select('*')
            .eq('visible', true)
            .order('apellido_paterno', { ascending: true });

        if (error) throw error;
        return data;
    },

    /**
     * Actualiza datos en la tabla 'usuario'
     */
    async actualizar(id, cambios) {
        const { data, error } = await supabase
            .from('usuario')
            .update(cambios)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Consulta optimizada para configuraciones de Admin
     */
    async obtenerListadoConfiguracion() {
        const { data, error } = await supabase
            .from('usuario')
            .select('id, nombres, apellido_paterno, apellido_materno, rol')
            .eq('visible', true);

        if (error) throw error;
        return data;
    }
};

module.exports = usuarioModel;