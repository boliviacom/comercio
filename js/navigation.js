import { categoriasController } from './controllers/categoriasController.js';

/**
 * Navigation Controller - Nexus Admin Suite
 * Integra carga de IFRAMEs, AJAX y Controladores MVC
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- EXPOSICIÓN GLOBAL PARA EVENTOS ONCLICK EN HTML ---
    window.categoriasController = categoriasController;

    const navItems = document.querySelectorAll('.nav-item');
    const contentArea = document.getElementById('content-area');

    // --- NUEVOS EVENTOS PARA EL SUBMENÚ DE CATEGORÍAS ---
    
    document.getElementById('link-categorias-datos')?.addEventListener('click', async (e) => {
        e.preventDefault();
        mostrarLoading('Cargando Categorías');
        await categoriasController.inicializar('categorias');
        Swal.close();
        actualizarEstadoActivo(e.currentTarget);
    });

    document.getElementById('link-subcategorias-datos')?.addEventListener('click', async (e) => {
        e.preventDefault();
        mostrarLoading('Cargando Subcategorías');
        await categoriasController.inicializar('subcategorias');
        Swal.close();
        actualizarEstadoActivo(e.currentTarget);
    });

    document.getElementById('link-categorias-columnas')?.addEventListener('click', (e) => {
        e.preventDefault();
        categoriasController.abrirConfiguracionColumnas();
    });

    // --- LÓGICA GENERAL PARA OTROS NAV-ITEMS ---

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
        // 1. Validación de seguridad
        if (!elementoActivo) return;

        // 2. Seleccionamos todos los disparadores
        const todosLosLinks = document.querySelectorAll('.nav-item, #link-categorias-datos, #link-subcategorias-datos, #link-categorias-columnas');
        
        todosLosLinks.forEach(i => {
            i.classList.remove('bg-blue-50', 'text-blue-600', 'bg-slate-100', 'shadow-sm');
            i.classList.add('text-slate-500');
        });
        
        // 3. Verificamos si tiene ID para aplicar la clase de fondo correcta
        // Usamos optional chaining (?.) para evitar errores si id es undefined
        const esSubmenu = elementoActivo.id?.includes('link');
        const bgClass = esSubmenu ? 'bg-slate-100' : 'bg-blue-50';
        
        elementoActivo.classList.add(bgClass, 'text-blue-600');
        elementoActivo.classList.remove('text-slate-500');
    }
});