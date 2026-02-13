// public/js/services/authService.js

export const authService = {
    /**
     * Envia credenciales al backend y guarda la sesión si es exitoso
     */
    async login(email, password) {
        try {
            const response = await fetch('/api/usuarios/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();

            if (data.exito) {
                // Guardamos el perfil para uso rápido en el frontend
                sessionStorage.setItem('perfil_usuario', JSON.stringify(data.perfil));
            }

            return data;
        } catch (error) {
            return { exito: false, mensaje: 'Error de conexión con el servidor' };
        }
    },

    /**
     * Informa al backend del cierre de sesión y limpia el almacenamiento local
     */
    async logout() {
        try {
            const response = await fetch('/api/usuarios/logout', { method: 'POST' });
            const data = await response.json();
            
            // Limpiamos siempre el storage del cliente, responda lo que responda el server
            sessionStorage.clear();
            
            return data;
        } catch (error) {
            sessionStorage.clear();
            return { exito: false };
        }
    },

    /**
     * Verifica si el backend aún reconoce una sesión activa
     */
    async verificarSesion() {
        const response = await fetch('/api/usuarios/sesion-actual');
        return await response.json();
    }
};