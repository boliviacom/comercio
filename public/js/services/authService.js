// public/js/services/authService.js

export const authService = {
    async login(email, password) {
        try {
            const response = await fetch('/api/usuarios/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();

            if (data.exito) {
                // Guardamos info no sensible para la UI
                sessionStorage.setItem('perfil_usuario', JSON.stringify(data.perfil));
            }

            return data;
        } catch (error) {
            return { exito: false, mensaje: 'Error de conexión con el servidor' };
        }
    },

    async logout() {
        try {
            const response = await fetch('/api/usuarios/logout', { method: 'POST' });
            sessionStorage.clear();
            return await response.json();
        } catch (error) {
            sessionStorage.clear();
            return { exito: false };
        }
    },

    /**
     * IMPORTANTE: Cambiamos la ruta a /perfil (la que definimos en routes)
     */
    async verificarSesion() {
        try {
            const response = await fetch('/api/usuarios/perfil');
            return await response.json();
        } catch (error) {
            return { exito: false };
        }
    }
};