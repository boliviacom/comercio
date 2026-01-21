import { categoriasController } from './controllers/categoriasController.js';
import { productoController } from './controllers/productoController.js';

/**
 * Navigation Controller - Nexus Admin Suite
 * Integra carga de IFRAMEs, AJAX, MVC y UI de Sidebar
 */
document.addEventListener('DOMContentLoaded', () => {
    
    // --- EXPOSICIÓN GLOBAL PARA EVENTOS ONCLICK ---
    window.categoriasController = categoriasController;
    window.productoController = productoController;

    const navItems = document.querySelectorAll('.nav-item');
    const contentArea = document.getElementById('content-area');

    // --- INYECCIÓN DE ESTILOS GLOBALES (Modo Oscuro Automático) ---
    const inyectarEstilosGlobales = () => {
        if (document.getElementById('nexus-dynamic-styles')) return;
        const style = document.createElement('style');
        style.id = 'nexus-dynamic-styles';
        style.innerHTML = `
            /* Transiciones suaves */
            * { transition: background-color 0.2s ease, border-color 0.2s ease; }

            /* Sobrescritura global para modo oscuro basada en tu tailwindConfig */
            .dark body { background-color: #101922 !important; color: #f1f5f9; }
            .dark #main-sidebar { background-color: #101922 !important; border-right-color: #1e293b; }
            .dark header { background-color: #101922 !important; border-bottom-color: #1e293b; }
            
            /* Ajuste de tarjetas y contenedores blancos */
            .dark .bg-white { background-color: #16222e !important; color: #f1f5f9 !important; }
            .dark .border-slate-200, .dark .border-gray-200 { border-color: #1e293b !important; }
            
            /* Ajuste de textos */
            .dark .text-slate-800, .dark .text-gray-800 { color: #f1f5f9 !important; }
            .dark .text-slate-500, .dark .text-gray-500 { color: #94a3b8 !important; }
        `;
        document.head.appendChild(style);
    };

    inyectarEstilosGlobales();

    // --- LÓGICA DE UI: SIDEBAR ---

    window.sidebarController = {
        toggle() {
            const sidebar = document.getElementById('main-sidebar');
            const icon = document.getElementById('sidebar-icon');
            const logoImg = document.getElementById('sidebar-logo');
            
            const isColapsed = sidebar.classList.toggle('w-[80px]');
            
            if (isColapsed) {
                sidebar.classList.remove('w-[280px]');
                icon.innerText = 'chevron_right';
                if (logoImg) {
                    logoImg.src = 'images/favicon.png';
                    logoImg.classList.add('h-8');
                }
                document.querySelectorAll('.sidebar-hide').forEach(el => el.classList.add('hidden'));
            } else {
                sidebar.classList.add('w-[280px]');
                icon.innerText = 'chevron_left';
                if (logoImg) {
                    logoImg.src = 'images/logo.png';
                    logoImg.classList.remove('h-8');
                }
                document.querySelectorAll('.sidebar-hide').forEach(el => el.classList.remove('hidden'));
            }
        }
    };

    // --- LÓGICA DE MODO OSCURO ---

    window.themeController = {
        toggle() {
            const root = document.documentElement;
            const cursor = document.getElementById('theme-cursor');
            const bg = document.getElementById('theme-switch');
            
            const isDark = root.classList.toggle('dark');
            
            if (cursor && bg) {
                cursor.style.transform = isDark ? 'translateX(20px)' : 'translateX(0px)';
                bg.classList.toggle('bg-blue-600', isDark);
                bg.classList.toggle('bg-slate-200', !isDark);
            }

            localStorage.setItem('theme', isDark ? 'dark' : 'light');

            // Sincronizar IFRAME
            const iframe = contentArea.querySelector('iframe');
            if (iframe && iframe.contentDocument) {
                iframe.contentDocument.documentElement.classList.toggle('dark', isDark);
            }
        }
    };

    const inicializarTema = () => {
        const temaGuardado = localStorage.getItem('theme');
        const root = document.documentElement;
        if (temaGuardado === 'dark') {
            root.classList.add('dark');
            const cursor = document.getElementById('theme-cursor');
            const bg = document.getElementById('theme-switch');
            if (cursor && bg) {
                cursor.style.transform = 'translateX(20px)';
                bg.classList.add('bg-blue-600');
                bg.classList.remove('bg-slate-200');
            }
        }
    };

    inicializarTema();

    // --- LÓGICA DE CARGA DE CONTENIDO ---

    async function cargarSeccion(url, type, elemento) {
        if (!url) return;
        
        mostrarLoading('Cargando sección');
        actualizarEstadoActivo(elemento);

        if (type === 'iframe') {
            contentArea.innerHTML = ''; 
            const iframe = document.createElement('iframe');
            iframe.src = url;
            iframe.className = "w-full h-full border-none bg-transparent opacity-0 transition-opacity duration-300";
            
            iframe.onload = () => {
                const isDark = document.documentElement.classList.contains('dark');
                // Sincronizar modo oscuro con el contenido del iframe
                if (iframe.contentDocument) {
                    iframe.contentDocument.documentElement.classList.toggle('dark', isDark);
                    // Inyectar los mismos estilos automáticos dentro del iframe
                    const styleClone = document.createElement('style');
                    styleClone.innerHTML = document.getElementById('nexus-dynamic-styles').innerHTML;
                    iframe.contentDocument.head.appendChild(styleClone);
                }
                
                iframe.classList.remove('opacity-0');
                Swal.close();
            };
            contentArea.appendChild(iframe);
        } else {
            await cargarPaginaAjax(url, elemento);
        }
    }

    // --- EVENTOS DE NAVEGACIÓN ---

    navItems.forEach(item => {
        item.addEventListener('click', async (e) => {
            e.preventDefault();
            const viewUrl = item.getAttribute('data-view');
            const loadType = item.getAttribute('data-type') || 'ajax';
            await cargarSeccion(viewUrl, loadType, item);
        });
    });

    // --- EVENTOS ESPECÍFICOS PARA CATEGORÍAS ---
    
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

    // --- FUNCIONES DE APOYO (HELPERS) ---

    async function cargarPaginaAjax(url, elemento) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                const html = await response.text();
                contentArea.innerHTML = `<div class="h-full overflow-auto animate-fade-in">${html}</div>`;
                actualizarEstadoActivo(elemento);
                Swal.close();
            } else { throw new Error('404'); }
        } catch (error) { mostrarError(url); }
    }

    function mostrarLoading(titulo) {
        Swal.fire({
            title: titulo,
            html: 'Por favor espere un momento...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
            showConfirmButton: false,
            backdrop: `rgba(15, 23, 42, 0.1)`
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
        if (!elementoActivo) return;
        const todosLosLinks = document.querySelectorAll('.nav-item, [id^="link-"]');
        
        todosLosLinks.forEach(i => {
            i.classList.remove('bg-blue-50', 'text-blue-600', 'bg-slate-100', 'bg-indigo-50', 'text-indigo-600');
            i.classList.add('text-slate-500');
        });
        
        const isConfig = elementoActivo.id === 'link-config-cliente';
        const esSubmenu = elementoActivo.id?.includes('link');
        
        if (isConfig) {
            elementoActivo.classList.add('bg-indigo-50', 'text-indigo-600');
        } else if (esSubmenu) {
            elementoActivo.classList.add('bg-slate-100', 'text-blue-600');
        } else {
            elementoActivo.classList.add('bg-blue-50', 'text-blue-600');
        }
        elementoActivo.classList.remove('text-slate-500');
    }
});