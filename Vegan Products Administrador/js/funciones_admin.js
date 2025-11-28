import { AdminProductManager } from './AdminProductManager.js';
import { AdminCategoryManager } from './AdminCategoryManager.js';
import { AdminUserManager } from './AdminUserManager.js';
import { AdminDireccionManager } from './AdminDireccionManager.js';
import { AdminOrdenManager } from './AdminOrdenManager.js';
import { AdminOrdenDetalleManager } from './AdminOrdenDetalleManager.js';
import { AdminDepartamentoManager } from './AdminDepartamentoManager.js';
import { AdminMunicipioManager } from './AdminMunicipioManager.js';
import { AdminLocalidadManager } from './AdminLocalidadManager.js';
import { AdminZonaManager } from './AdminZonaManager.js';
import { AuthManager } from './authManager.js';
import './personalizacion.js';


document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggle-btn');

    // Seleccionar todos los enlaces de navegación, incluidos los del submenú
    const navLinks = document.querySelectorAll('.nav-list .nav-link');
    const logoutLink = document.getElementById('logout-link');

    const authManager = new AuthManager();

    const displayElementId = 'content-display';
    const modalId = 'crud-modal';

    let currentManager = null;

    const productManager = new AdminProductManager(displayElementId, modalId);
    const categoryManager = new AdminCategoryManager(displayElementId, modalId);
    const userManager = new AdminUserManager(displayElementId, modalId);
    const direccionManager = new AdminDireccionManager(displayElementId, modalId);
    const ordenManager = new AdminOrdenManager(displayElementId, modalId);
    const ordenDetalleManager = new AdminOrdenDetalleManager(displayElementId, modalId);
    const departamentoManager = new AdminDepartamentoManager(displayElementId, modalId);
    const municipioManager = new AdminMunicipioManager(displayElementId, modalId);
    const localidadManager = new AdminLocalidadManager(displayElementId, modalId);
    const zonaManager = new AdminZonaManager(displayElementId, modalId);

    const icon = toggleBtn.querySelector('i');
    if (!sidebar.classList.contains('collapsed')) {
        icon.classList.add('fa-times');
        icon.classList.remove('fa-bars');
    }

    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        if (sidebar.classList.contains('collapsed')) {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        } else {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        }
    });

    const managerMap = {
        'producto': productManager,
        'categoria': categoryManager,
        'usuario': userManager,
        'direccion': direccionManager,
        'orden': ordenManager,
        'orden_detalle': ordenDetalleManager,
        'departamento': departamentoManager,
        'municipio': municipioManager,
        'localidad': localidadManager,
        'zona': zonaManager
    };

    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();

            // 1. 🚨 LIMPIEZA GLOBAL: Remover 'active' de TODOS los enlaces al inicio
            document.querySelectorAll('.nav-list .nav-link').forEach(l => l.classList.remove('active'));

            // Manejo del enlace de personalización
            if (link.id === 'customize-link') {
                return;
            }

            // 2. 🟢 LÓGICA CLAVE DEL TOGGLE (Abre/Cierra Submenú) 🟢
            const toggleTargetId = link.getAttribute('data-toggle');
            if (toggleTargetId) {
                const submenu = document.getElementById(toggleTargetId);
                const icon = link.querySelector('.submenu-icon');

                if (submenu) {
                    // Si es un toggle, lo abrimos/cerramos
                    submenu.classList.toggle('collapsed');

                    if (icon) {
                        // Cambia la flecha visualmente
                        icon.classList.toggle('fa-chevron-down');
                        icon.classList.toggle('fa-chevron-up');
                    }
                }
                // Nota: El toggle no hace 'return', permite que se active la tabla después (Punto 5)
            }
            // --- Fin Lógica de Toggle ---


            const action = link.getAttribute('data-action');
            const tableName = link.getAttribute('data-table');

            // 3. Manejo de ACCIONES (Crear Nuevo / Carga Masiva)
            if (action) {
                const manager = managerMap['producto'];

                if (manager) {
                    if (action === 'crear-producto') {
                        manager.showForm('producto', 'create');
                    } else if (action === 'carga-masiva-producto') {
                        manager.showBulkUploadForm();
                    }

                    // 🌟 CLAVE: Asegurarse de que el enlace PADRE 'Productos' quede activo
                    const productToggleLink = document.querySelector('.submenu-toggle[data-table="producto"]');
                    if (productToggleLink) {
                        productToggleLink.classList.add('active');
                    }

                    // 🔄 Reforzar: Asegurarse de que la tabla de Productos esté cargada por debajo del modal.
                    if (currentManager !== managerMap['producto']) {
                        managerMap['producto'].loadTable();
                        currentManager = managerMap['producto'];
                    }

                    // 🛑 SE ELIMINA el código que hacía innerHTML del displayElementId
                } else {
                    console.error("[Router] Product Manager no encontrado para la acción.");
                }
                return; // Las acciones abren modal y terminan aquí
            }


            // 4. Manejo de TABLAS (CRUD normal)
            if (tableName) {
                link.classList.add('active'); // Activar el enlace clicado (incluyendo 'Productos')

                const newManager = managerMap[tableName];

                if (newManager && newManager.loadTable) {

                    if (currentManager && currentManager !== newManager && typeof currentManager.cleanupListeners === 'function') {
                        currentManager.cleanupListeners();
                    }

                    newManager.loadTable();
                    currentManager = newManager;
                    console.log(`[Router] Cargando tabla ${tableName} con su Manager especializado.`);

                } else {
                    const linkText = link.querySelector('span').textContent.trim();
                    document.getElementById(displayElementId).innerHTML = `
                        <p class="info-message">Gestión no disponible para ${linkText} (tabla: ${tableName}).</p>
                    `;
                    console.warn(`[Router] No hay Manager definido para la tabla: ${tableName}`);
                }
            }
        });
    });

    logoutLink.addEventListener('click', async (event) => {
        event.preventDefault();

        localStorage.removeItem("usuarioEmail");
        localStorage.removeItem("usuarioId");
        localStorage.removeItem("usuarioRol");

        if (currentManager && typeof currentManager.cleanupListeners === 'function') {
            currentManager.cleanupListeners();
        }

        const result = await authManager.cerrarSesion();

        if (result.success) {
            window.location.href = "index.html";
        } else {
            console.error("Error al cerrar sesión:", result.error);
            alert("⚠️ Error al cerrar sesión. Intenta de nuevo.");
        }
    });

    // Carga inicial y activación del enlace
    productManager.loadTable();
    currentManager = productManager;
    console.log('[Router] Carga inicial: Tabla Productos.');

    const productNavLink = document.querySelector('.submenu-toggle[data-table="producto"]');
    if (productNavLink) {
        productNavLink.classList.add('active');
    }

    // 🟢 LÓGICA DE CARGA INICIAL (ASEGURA QUE ESTÉ ABIERTO) 🟢
    const initialSubmenu = document.getElementById('productos-submenu');
    const initialIcon = document.querySelector('.submenu-toggle[data-table="producto"] .submenu-icon');

    // Al cargar la página, forzamos que el submenú de productos se abra la primera vez.
    if (initialSubmenu) {
        initialSubmenu.classList.remove('collapsed');
        if (initialIcon) {
            initialIcon.classList.remove('fa-chevron-down');
            initialIcon.classList.add('fa-chevron-up');
        }
    }
});