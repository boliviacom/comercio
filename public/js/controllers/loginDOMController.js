// public/js/controllers/loginDOMController.js
import { authService } from '../services/authService.js';

const loginForm = document.getElementById('login-form'); // Asegúrate que el ID coincida con tu HTML
const errorMensaje = document.getElementById('error-mensaje'); // Para mostrar errores al usuario

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Obtener datos de los inputs
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // 2. Llamar al servicio (que hace el fetch a Express)
        const resultado = await authService.login(email, password);

        // 3. Reaccionar según la respuesta del servidor
        if (resultado.exito) {
            // Guardamos datos de sesión en el navegador
            sessionStorage.setItem('usuario_nombre', resultado.perfil.nombres);
            sessionStorage.setItem('usuario_rol', resultado.perfil.rol);
            
            // Redirigir al panel
            window.location.href = '/admin';
        } else {
            // Mostrar error en la pantalla
            if (errorMensaje) {
                errorMensaje.textContent = resultado.mensaje;
                errorMensaje.style.display = 'block';
            } else {
                alert(resultado.mensaje);
            }
        }
    });
}