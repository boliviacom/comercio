// Importamos el servicio en lugar del modelo/controlador antiguo
import { authService } from '../services/authService.js';

document.addEventListener('DOMContentLoaded', () => {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitBtn = document.querySelector('button[type="button"]:not(#toggle-password)');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const passwordIcon = document.getElementById('password-icon');

    /**
     * 1. Lógica para Ver/Ocultar Contraseña (Se queda igual)
     */
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            passwordIcon.textContent = isPassword ? 'visibility_off' : 'visibility';
        });
    }

    /**
     * 2. Lógica de Autenticación conectada a EXPRESS
     */
    const ejecutarLogin = async (e) => {
        if (e) e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos incompletos',
                text: 'Por favor, ingresa tu correo y contraseña.',
                confirmButtonColor: '#53B59D'
            });
            return;
        }

        // Feedback visual
        const originalContent = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <span class="flex items-center justify-center">
                <svg class="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verificando...
            </span>
        `;

        try {
            const resultado = await authService.login(email, password);

            if (resultado.exito) {
                // Guardamos datos para la UI
                sessionStorage.setItem('usuario_rol', resultado.perfil.rol);
                sessionStorage.setItem('usuario_nombre', resultado.perfil.nombres);

                // REDIRECCIÓN PROFESIONAL
                // Si el backend dijo que es exitoso, el dashboard te dejará entrar 
                // porque ya tienes la cookie sb-access-token configurada
                window.location.href = '/dashboard';
            } else {
                // MANEJO DE ERRORES DE ZOD O AUTH
                let mensajeError = resultado.mensaje || 'Credenciales incorrectas';

                // Si vienen errores de validación de Zod (array)
                if (resultado.errores) {
                    mensajeError = resultado.errores.map(e => e.mensaje).join('<br>');
                }

                Swal.fire({
                    icon: 'error',
                    title: 'Acceso Denegado',
                    html: mensajeError, // Usamos html para mostrar los <br> de Zod
                    confirmButtonColor: '#162925'
                });

                submitBtn.disabled = false;
                submitBtn.innerHTML = originalContent;
            }
        } catch (error) {
            console.error("Error crítico:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No se pudo conectar con el servidor de autenticación.',
                confirmButtonColor: '#162925'
            });
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalContent;
        }
    };

    // Eventos
    if (submitBtn) submitBtn.addEventListener('click', ejecutarLogin);

    [emailInput, passwordInput].forEach(input => {
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') ejecutarLogin(e);
            });
        }
    });
});