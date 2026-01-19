import { categoriasController } from './controllers/categoriasController.js';

/**
 * Navigation Controller - Nexus Admin Suite
 * Integra carga de IFRAMEs, AJAX y Controladores MVC
 */
document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const contentArea = document.getElementById('content-area');

    // --- NUEVOS EVENTOS PARA EL SUBMENÚ DE CATEGORÍAS ---
    
    // 1. Administración de Datos
    document.getElementById('link-categorias-datos')?.addEventListener('click', async (e) => {
        e.preventDefault();
        mostrarLoading('Cargando Datos de Categoría');
        
        // Ejecutamos el controlador MVC
        await categoriasController.inicializar();
        
        Swal.close();
        actualizarEstadoActivo(e.currentTarget);
    });

    // 2. Configuración de Columnas (Acceso directo desde menú)
    document.getElementById('link-categorias-columnas')?.addEventListener('click', (e) => {
        e.preventDefault();
        // Llamamos directamente a la lógica de columnas
        categoriasController.abrirConfiguracionColumnas();
    });

    // --- LÓGICA GENERAL PARA OTROS NAV-ITEMS (PRODUCTOS, ROLES, ETC) ---

    navItems.forEach(item => {
        item.addEventListener('click', async (e) => {
            e.preventDefault();

            const viewUrl = item.getAttribute('data-view');
            const loadType = item.getAttribute('data-type');

            if (!viewUrl) return;

            mostrarLoading('Cargando sección');
            actualizarEstadoActivo(item);

            if (loadType === 'iframe') {
                const iframe = document.createElement('iframe');
                iframe.src = viewUrl;
                iframe.className = "content-frame bg-white";
                
                iframe.onload = () => Swal.close();

                contentArea.innerHTML = ''; 
                contentArea.appendChild(iframe);

            } else if (loadType === 'ajax') {
                try {
                    const response = await fetch(viewUrl);
                    if (response.ok) {
                        const html = await response.text();
                        contentArea.innerHTML = `<div class="h-full overflow-auto">${html}</div>`;
                        Swal.close();
                    } else {
                        throw new Error('404');
                    }
                } catch (error) {
                    mostrarError(viewUrl);
                }
            }
        });
    });

    // --- FUNCIONES DE APOYO (HELPERS) ---

    function mostrarLoading(titulo) {
        Swal.fire({
            title: titulo,
            html: 'Por favor espere un momento...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
            showConfirmButton: false,
            backdrop: `rgba(0,0,123,0.1)`
        });
    }

    function mostrarError(url) {
        Swal.fire({
            icon: 'error',
            title: 'Error al cargar',
            text: `No se pudo encontrar la ruta: ${url}`,
            confirmButtonColor: '#3b82f6'
        });
        contentArea.innerHTML = `<div class="flex items-center justify-center h-full text-slate-400">Error al cargar ${url}</div>`;
    }

    function actualizarEstadoActivo(elementoActivo) {
        // Quitamos clase activa a todos (incluyendo los del submenú)
        const todosLosLinks = document.querySelectorAll('.nav-item, #link-categorias-datos, #link-categorias-columnas');
        todosLosLinks.forEach(i => {
            i.classList.remove('bg-blue-50', 'text-blue-600', 'bg-slate-100');
            i.classList.add('text-slate-500');
        });
        
        // Agregamos clase activa al seleccionado
        elementoActivo.classList.add(elementoActivo.id.includes('link') ? 'bg-slate-100' : 'bg-blue-50');
        elementoActivo.classList.add('text-blue-600');
    }
});