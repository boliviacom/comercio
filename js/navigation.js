import { categoriasController } from './controllers/categoriasController.js';
import { productoController } from './controllers/productoController.js';
import { importacionController } from './controllers/importacionController.js';

/**
 * Navigation Controller - Nexus Admin Suite
 * Integra carga de IFRAMEs, AJAX, MVC y UI de Sidebar
 */
document.addEventListener('DOMContentLoaded', () => {

    // --- EXPOSICIÓN GLOBAL PARA EVENTOS ONCLICK ---
    window.categoriasController = categoriasController;
    window.productoController = productoController;
    window.importacionController = importacionController;

    const navItems = document.querySelectorAll('.nav-item');
    const contentArea = document.getElementById('content-area');

    // --- INYECCIÓN DE ESTILOS GLOBALES (Modo Oscuro Automático) ---
    const inyectarEstilosGlobales = () => {
        if (document.getElementById('nexus-dynamic-styles')) return;
        const style = document.createElement('style');
        style.id = 'nexus-dynamic-styles';
        style.innerHTML = `
            * { transition: background-color 0.2s ease, border-color 0.2s ease; }
            .dark body { background-color: #101922 !important; color: #f1f5f9; }
            .dark #main-sidebar { background-color: #101922 !important; border-right-color: #1e293b; }
            .dark header { background-color: #101922 !important; border-bottom-color: #1e293b; }
            .dark .bg-white { background-color: #16222e !important; color: #f1f5f9 !important; }
            .dark .border-slate-200, .dark .border-gray-200 { border-color: #1e293b !important; }
            .dark .text-slate-800, .dark .text-gray-800 { color: #f1f5f9 !important; }
            .dark .text-slate-500, .dark .text-gray-500 { color: #94a3b8 !important; }
            .animate-fade-in { animation: fadeIn 0.3s ease-out; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
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
            const iframe = contentArea.querySelector('iframe');
            if (iframe && iframe.contentDocument) {
                iframe.contentDocument.documentElement.classList.toggle('dark', isDark);
            }
        }
    };

    const inicializarTema = () => {
        const temaGuardado = localStorage.getItem('theme');
        if (temaGuardado === 'dark') {
            document.documentElement.classList.add('dark');
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
                if (iframe.contentDocument) {
                    const isDark = document.documentElement.classList.contains('dark');
                    iframe.contentDocument.documentElement.classList.toggle('dark', isDark);
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

    // --- NAVEGACIÓN UNIFICADA (DELEGACIÓN DE EVENTOS) ---
    // Escuchamos clics en todo el sidebar para atrapar los 'onclick' del HTML
    document.getElementById('main-sidebar')?.addEventListener('click', (e) => {
        const item = e.target.closest('.nav-item, [id^="link-"], button, summary');
        if (!item) return;

        // Si es un summary con un div adentro (tus categorías/productos)
        const clickableDiv = item.querySelector('div[onclick]');
        
        // Ejecutamos la limpieza visual
        actualizarEstadoActivo(item);
    });

    // Eventos para nav-items estándar
    navItems.forEach(item => {
        item.addEventListener('click', async (e) => {
            e.preventDefault();
            const viewUrl = item.getAttribute('data-view');
            const loadType = item.getAttribute('data-type') || 'ajax';
            await cargarSeccion(viewUrl, loadType, item);
        });
    });

    // --- HELPERS ---
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
        Swal.fire({ icon: 'error', title: 'Error al cargar', text: `No se encontró la ruta: ${url}` });
        contentArea.innerHTML = `<div class="flex items-center justify-center h-full text-slate-400">Error al cargar ${url}</div>`;
    }

    function actualizarEstadoActivo(elementoActivo) {
        if (!elementoActivo) return;

        // 1. Limpieza de TODOS los elementos
        const todosLosLinks = document.querySelectorAll('.nav-item, [id^="link-"], details button, summary');
        todosLosLinks.forEach(i => {
            i.classList.remove(
                'bg-blue-50', 'text-blue-600',
                'bg-indigo-50', 'text-indigo-600',
                'bg-orange-50', 'text-orange-600',
                'bg-emerald-50', 'text-emerald-600',
                'bg-slate-100'
            );
            i.classList.add('text-slate-500');
            // Si el summary tiene un p interno, también lo limpiamos
            const p = i.querySelector('p');
            if(p) p.classList.remove('text-blue-600');
        });

        // 2. Aplicación de estado activo
        elementoActivo.classList.remove('text-slate-500', 'text-slate-400');
        const id = elementoActivo.id || '';
        const texto = elementoActivo.innerText.toLowerCase();

        if (id === 'link-config-cliente') {
            elementoActivo.classList.add('bg-indigo-50', 'text-indigo-600');
        } else if (texto.includes('carga masiva')) {
            elementoActivo.classList.add('bg-orange-50', 'text-orange-600');
        } else if (texto.includes('nueva subcategoría')) {
            elementoActivo.classList.add('bg-emerald-50', 'text-emerald-600');
        } else {
            elementoActivo.classList.add('bg-blue-50', 'text-blue-600');
        }
    }
});