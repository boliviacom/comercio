// public/js/services/usuarioService.js

export const usuarioService = {
    /**
     * Obtiene la lista completa de usuarios visibles
     */
    async obtenerTodos() {
        const response = await fetch('/api/usuarios/todos');
        return await response.json();
    },

    /**
     * Registra un nuevo usuario enviando los datos al controlador de Express
     */
    async registrar(datosUsuario) {
        const response = await fetch('/api/usuarios/registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosUsuario)
        });
        return await response.json();
    },

    /**
     * Obtiene un usuario específico por su ID
     */
    async obtenerPorId(id) {
        const response = await fetch(`/api/usuarios/${id}`);
        return await response.json();
    },

    /**
     * Actualiza datos de un usuario existente
     */
    async actualizar(id, cambios) {
        const response = await fetch(`/api/usuarios/actualizar/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cambios)
        });
        return await response.json();
    },

    /**
     * Obtiene configuración de destinos y roles (uso administrativo)
     */
    async obtenerConfiguracion() {
        const response = await fetch('/api/usuarios/configuracion-destinos');
        return await response.json();
    }
};