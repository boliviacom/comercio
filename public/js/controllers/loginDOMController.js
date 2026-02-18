import { authService } from '../services/authService.js';

// 1. EL ID DEBE COINCIDIR: Tu HTML tiene "btn-ingresar"
const btnLogin = document.getElementById('btn-ingresar');

if (btnLogin) {
    btnLogin.addEventListener('click', async (e) => {
        // Evitamos cualquier acción por defecto del formulario
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!email || !password) {
            Swal.fire('Atención', 'Por favor, completa todos los campos', 'warning');
            return;
        }

        // 2. Efecto Visual
        const textoOriginal = btnLogin.innerHTML;
        btnLogin.disabled = true;
        btnLogin.innerHTML = "Verificando...";

        try {
            const resultado = await authService.login(email, password);

            if (resultado.exito) {
                sessionStorage.setItem('usuario_rol', resultado.perfil.rol);
                console.log("Login exitoso, redirigiendo a /dashboard...");
                window.location.href = '/dashboard';
            } else {
                Swal.fire('Error', resultado.mensaje, 'error');
                btnLogin.disabled = false;
                btnLogin.innerHTML = textoOriginal;
            }
        } catch (error) {
            console.error("Error en login:", error);
            btnLogin.disabled = false;
            btnLogin.innerHTML = textoOriginal;
        }
    });
}