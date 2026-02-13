import { usuarioService } from '../services/usuarioService.js';
import { authService } from '../services/authService.js';

const listaUsuarios = document.getElementById('lista-usuarios');
const btnLogout = document.getElementById('btn-logout');

// Cargar datos al iniciar
async function inicializar() {
    const usuarios = await usuarioService.obtenerTodos();
    
    // Si el servidor respondió con error (por el middleware esOwner)
    if (usuarios.exito === false) {
        alert("Tu sesión ha expirado o no tienes permisos.");
        window.location.href = '/index.html';
        return;
    }

    // Renderizar los usuarios en el DOM
    usuarios.forEach(u => {
        const li = document.createElement('li');
        li.textContent = `${u.nombres} - ${u.rol}`;
        listaUsuarios.appendChild(li);
    });
}

// Configurar botón de cerrar sesión
if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
        await authService.logout();
    });
}

inicializar();