/**
 * Producto View - Nexus Admin Suite
 * Actualización: Soporte para lista maestra de categorías global
 */
export const productoView = {
    _estado: {
        busqueda: '',
        categoriasSeleccionadas: [],
        orden: 'desc',
        paginaActual: 1,
        filasPorPagina: 10
    },

    // --- MÉTODOS DE NOTIFICACIÓN ---
    notificarExito(mensaje) {
        Swal.fire({
            icon: 'success',
            title: '<span class="text-slate-800 font-black uppercase text-sm">¡Éxito!</span>',
            text: mensaje,
            timer: 2000,
            showConfirmButton: false,
            customClass: { popup: 'rounded-[32px] border-none shadow-xl' }
        });
    },

    notificarError(mensaje) {
        Swal.fire({
            icon: 'error',
            title: '<span class="text-red-600 font-black uppercase text-sm">Error</span>',
            text: mensaje,
            confirmButtonColor: '#2563eb',
            customClass: { popup: 'rounded-[32px] border-none shadow-xl' }
        });
    },

    mostrarCargando(mensaje = 'Procesando...') {
        Swal.fire({
            title: '<span class="text-slate-800 font-black uppercase text-sm">Cargando</span>',
            text: mensaje,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
            customClass: { popup: 'rounded-[32px] border-none shadow-xl' }
        });
    },

    _obtenerColorCategoria(nombre) {
        if (!nombre) return 'bg-slate-100 text-slate-500';
        const coloresSeguros = [
            'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-violet-100 text-violet-700',
            'bg-cyan-100 text-cyan-700', 'bg-indigo-100 text-indigo-700', 'bg-lime-100 text-lime-700',
            'bg-fuchsia-100 text-fuchsia-700', 'bg-sky-100 text-sky-700', 'bg-teal-100 text-teal-700'
        ];
        let hash = 0;
        for (let i = 0; i < nombre.length; i++) hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
        return coloresSeguros[Math.abs(hash) % coloresSeguros.length];
    },

    /**
     * ACTUALIZACIÓN: Ahora recibe 'todasLasCategorias' desde el controlador
     */
    render(productos, todasLasCategorias = []) {
        const contenedor = document.getElementById('content-area');
        if (!contenedor) return;

        // Lógica de Inteligencia UX: Si recibimos categorías globales las usamos, 
        // de lo contrario, extraemos las que existan en los productos como respaldo.
        if (todasLasCategorias.length > 0) {
            this._categoriasDisponibles = todasLasCategorias.map(c => c.nombre || c).filter(Boolean);
        } else {
            this._categoriasDisponibles = [...new Set(productos.map(p => p.nombre_categoria).filter(Boolean))];
        }
        
        const todosConWhatsapp = productos.length > 0 && productos.every(p => p.habilitar_whatsapp);
        const todosConPrecio = productos.length > 0 && productos.every(p => p.mostrar_precio);

        let filtrados = this._ordenarDatos(this._filtrarDatos(productos));
        
        contenedor.innerHTML = `
            <div class="p-8 animate-fade-in max-h-[calc(100vh-64px)] overflow-y-auto">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Gestión de Inventario</h1>
                        <p class="text-slate-500 text-sm">Control total de visibilidad y catálogo.</p>
                    </div>
                    <button onclick="productoController.mostrarFormularioCrear()" 
                            class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-md font-bold text-sm flex items-center gap-2">
                        <span class="material-symbols-outlined text-[20px]">add_box</span> Nuevo Producto
                    </button>
                </div>

                <div class="bg-slate-50/50 p-6 rounded-[32px] border border-slate-100 mb-6 space-y-4">
                    <div class="flex flex-wrap items-center gap-4">
                        <div class="relative flex-1 min-w-[280px]">
                            <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                            <input type="text" oninput="productoView.gestionarBusqueda(this.value)" value="${this._estado.busqueda}"
                                   class="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/10 font-medium transition-all" 
                                   placeholder="Buscar por nombre...">
                        </div>

                        <div class="relative w-full md:w-80">
                            <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">sell</span>
                            <input type="text" 
                                   id="category-search-input"
                                   onkeyup="productoView.filtrarSugerencias(this.value)"
                                   onfocus="productoView.filtrarSugerencias(this.value)"
                                   class="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/10 font-medium transition-all" 
                                   placeholder="Buscar categoría..."
                                   autocomplete="off">
                            
                            <div id="suggestions-panel" class="hidden absolute z-[100] w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-60 overflow-y-auto p-2">
                                </div>
                        </div>

                        <button onclick="productoView.gestionarOrden()" class="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:text-blue-600 transition-all shadow-sm font-bold text-xs uppercase">
                            <span class="material-symbols-outlined text-lg">${this._estado.orden === 'asc' ? 'sort_by_alpha' : 'text_rotate_vertical'}</span>
                            ${this._estado.orden === 'asc' ? 'A-Z' : 'Z-A'}
                        </button>
                    </div>

                    ${this._renderEtiquetasFiltro()}

                    <div class="flex items-center gap-6 bg-white/50 px-6 py-3 rounded-2xl border border-dashed border-slate-200">
                        <div class="flex items-center gap-3 border-r border-slate-200 pr-6">
                            <span class="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Global WhatsApp</span>
                            ${this._renderSwitch('global', 'habilitar_whatsapp', todosConWhatsapp, 'emerald', true)}
                        </div>
                        <div class="flex items-center gap-3">
                            <span class="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Global Precios</span>
                            ${this._renderSwitch('global', 'mostrar_precio', todosConPrecio, 'blue', true)}
                        </div>
                    </div>
                </div>

                <div class="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden mb-8">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-slate-50/80">
                                    <th class="px-6 py-5 text-[10px] font-black text-slate-400 uppercase w-20 text-center">N°</th>
                                    <th class="px-6 py-5 text-[10px] font-black text-slate-400 uppercase">Producto</th>
                                    <th class="px-6 py-5 text-[10px] font-black text-slate-400 uppercase text-center">Precio</th>
                                    <th class="px-6 py-5 text-[10px] font-black text-slate-400 uppercase text-center">Stock</th>
                                    <th class="px-6 py-5 text-[10px] font-black text-slate-400 uppercase text-center">Hab. Whatsapp</th>
                                    <th class="px-6 py-5 text-[10px] font-black text-slate-400 uppercase text-center">Hab. Precio</th>
                                    <th class="px-6 py-5 text-[10px] font-black text-slate-400 uppercase text-center w-48">Acciones</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                ${this._generarFilas(filtrados)}
                            </tbody>
                        </table>
                    </div>
                    ${this._generarPaginacion(filtrados.length)}
                </div>
            </div>
        `;

        // Cerrar sugerencias al hacer clic fuera
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('suggestions-panel');
            const input = document.getElementById('category-search-input');
            if (panel && !panel.contains(e.target) && e.target !== input) {
                panel.classList.add('hidden');
            }
        });
    },

    // --- LÓGICA DE FILTRADO Y PANEL ---

    filtrarSugerencias(query) {
        const panel = document.getElementById('suggestions-panel');
        if (!panel) return;

        const coincidencias = this._categoriasDisponibles.filter(cat => 
            cat.toLowerCase().includes(query.toLowerCase()) && 
            !this._estado.categoriasSeleccionadas.includes(cat)
        );

        if (coincidencias.length > 0) {
            panel.classList.remove('hidden');
            panel.innerHTML = coincidencias.map(cat => `
                <div onclick="productoView.agregarFiltroCategoria('${cat}')" 
                     class="flex items-center justify-between px-4 py-3 hover:bg-blue-50 rounded-xl cursor-pointer transition-colors group">
                    <span class="text-sm font-medium text-slate-700 group-hover:text-blue-600">${cat}</span>
                    <span class="material-symbols-outlined text-slate-300 text-sm group-hover:text-blue-400">add_circle</span>
                </div>
            `).join('');
        } else {
            panel.classList.remove('hidden');
            panel.innerHTML = `<div class="p-4 text-xs font-bold text-slate-400 uppercase text-center">Sin resultados</div>`;
            if (query === '') panel.classList.add('hidden');
        }
    },

    _renderEtiquetasFiltro() {
        if (this._estado.categoriasSeleccionadas.length === 0) return '';
        return `
            <div class="flex flex-wrap items-center gap-2 animate-fade-in">
                <span class="text-[10px] font-black text-slate-400 uppercase mr-2">Filtros Activos:</span>
                ${this._estado.categoriasSeleccionadas.map(cat => `
                    <div class="flex items-center gap-2 bg-blue-600 text-white pl-3 pr-1 py-1 rounded-full text-[11px] font-bold shadow-sm">
                        ${cat.toUpperCase()}
                        <button onclick="productoView.quitarFiltroCategoria('${cat}')" class="hover:bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center transition-colors">
                            <span class="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>
                `).join('')}
                <button onclick="productoView.limpiarFiltros()" class="text-[10px] font-black text-red-500 hover:text-red-700 uppercase ml-2 underline decoration-2 underline-offset-4">
                    Limpiar Todo
                </button>
            </div>
        `;
    },

    agregarFiltroCategoria(cat) {
        if (!this._estado.categoriasSeleccionadas.includes(cat)) {
            this._estado.categoriasSeleccionadas.push(cat);
            this._estado.paginaActual = 1;
            const input = document.getElementById('category-search-input');
            if (input) input.value = '';
            document.getElementById('suggestions-panel')?.classList.add('hidden');
            productoController.refrescarVista();
        }
    },

    quitarFiltroCategoria(cat) {
        this._estado.categoriasSeleccionadas = this._estado.categoriasSeleccionadas.filter(c => c !== cat);
        productoController.refrescarVista();
    },

    limpiarFiltros() {
        this._estado.categoriasSeleccionadas = [];
        this._estado.busqueda = '';
        productoController.refrescarVista();
    },

    _filtrarDatos(d) {
        let resultados = [...d];
        if (this._estado.busqueda) {
            const t = this._estado.busqueda.toLowerCase();
            resultados = resultados.filter(x => 
                x.nombre.toLowerCase().includes(t) || 
                (x.nombre_categoria && x.nombre_categoria.toLowerCase().includes(t))
            );
        }
        if (this._estado.categoriasSeleccionadas.length > 0) {
            resultados = resultados.filter(x => 
                this._estado.categoriasSeleccionadas.includes(x.nombre_categoria)
            );
        }
        return resultados;
    },

    // --- MÉTODOS DE TABLA Y UI ---

    _generarFilas(datos) {
        const inicio = (this._estado.paginaActual - 1) * this._estado.filasPorPagina;
        const paged = datos.slice(inicio, inicio + this._estado.filasPorPagina);
        return paged.map((p, i) => {
            const dataEnc = btoa(unescape(encodeURIComponent(JSON.stringify(p))));
            const colorCat = this._obtenerColorCategoria(p.nombre_categoria);
            return `
                <tr class="hover:bg-blue-50/40 transition-colors group">
                    <td class="px-6 py-5 text-center text-xs font-bold text-slate-400">${inicio + i + 1}</td>
                    <td class="px-6 py-5">
                        <div class="flex items-center gap-3">
                            <img src="${p.imagen_url}" class="h-11 w-11 rounded-xl object-cover border border-slate-100 shadow-sm">
                            <div class="flex flex-col text-left">
                                <span class="text-slate-800 font-bold uppercase text-[12px] tracking-wide mb-1 leading-none">${p.nombre}</span>
                                <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase w-fit ${colorCat}">${p.nombre_categoria || 'General'}</span>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-5 text-center font-black text-slate-700 text-sm">Bs. ${p.precio}</td>
                    <td class="px-6 py-5 text-center">
                        <span class="px-2 py-1 rounded-lg text-[10px] font-black uppercase ${p.stock > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}">
                            ${p.stock} UDS
                        </span>
                    </td>
                    <td class="px-6 py-5 text-center">${this._renderSwitch(p.id, 'habilitar_whatsapp', p.habilitar_whatsapp, 'emerald', false, p.nombre)}</td>
                    <td class="px-6 py-5 text-center">${this._renderSwitch(p.id, 'mostrar_precio', p.mostrar_precio, 'blue', false, p.nombre)}</td>
                    <td class="px-6 py-4 text-center">
                        <div class="flex justify-center gap-2 opacity-80 group-hover:opacity-100">
                            <button onclick="productoController.mostrarFormularioEditar('${p.id}')" class="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all"><span class="material-symbols-outlined text-sm">edit</span></button>
                            <button onclick="productoView.verDetalle('${p.id}')" class="w-9 h-9 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all"><span class="material-symbols-outlined text-sm">visibility</span></button>
                            <button onclick="productoView.confirmarEliminacion('${dataEnc}')" class="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-600 hover:text-white transition-all"><span class="material-symbols-outlined text-sm">delete</span></button>
                        </div>
                    </td>
                </tr>`;
        }).join('');
    },

    _renderSwitch(id, campo, valor, color, esGlobal = false, nombreObj = '') {
        const checked = valor ? 'checked' : '';
        const params = `'${id}', '${campo}', ${valor}, ${esGlobal}, '${nombreObj.replace(/'/g, "\\'")}'`;
        return `
            <div class="flex justify-center">
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="sr-only peer" ${checked} 
                            onclick="event.preventDefault(); productoView.confirmarCambioSwitch(${params})">
                    <div class="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-${color}-500 shadow-inner"></div>
                </label>
            </div>`;
    },

    confirmarCambioSwitch(id, campo, valorActual, esGlobal, nombre) {
        const nuevoEstado = !valorActual;
        const accion = nuevoEstado ? 'ACTIVAR' : 'DESACTIVAR';
        const feature = campo === 'habilitar_whatsapp' ? 'el contacto por WhatsApp' : 'la visualización de precios';
        let titulo = esGlobal ? `<span class="text-blue-600 font-black uppercase text-xs">¿Cambio Global?</span>` : `<span class="text-slate-800 font-black uppercase text-xs">¿Confirmar Cambio?</span>`;
        let mensaje = esGlobal ? `¿Desea ${accion} ${feature} para <b>TODOS</b> los productos?` : `¿Desea ${accion} ${feature} para <b>${nombre.toUpperCase()}</b>?`;

        Swal.fire({
            title: titulo,
            html: `<p class="text-sm text-slate-600">${mensaje}</p>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: `SÍ, ${accion}`,
            cancelButtonText: 'CANCELAR',
            confirmButtonColor: nuevoEstado ? '#10b981' : '#3b82f6',
            customClass: { popup: 'rounded-[32px] shadow-2xl', confirmButton: 'rounded-xl px-5 py-2.5 text-xs font-bold uppercase', cancelButton: 'rounded-xl px-5 py-2.5 text-xs font-bold uppercase' }
        }).then((result) => {
            if (result.isConfirmed) {
                if (esGlobal) productoController.toggleMasivo(campo, nuevoEstado);
                else productoController.toggleEstado(id, campo, nuevoEstado);
            }
        });
    },

    _generarPaginacion(total) {
        const totalPaginas = Math.ceil(total / this._estado.filasPorPagina) || 1;
        return `
            <div class="px-6 py-4 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total: ${total}</p>
                <div class="flex gap-2">
                    <button onclick="productoView.cambiarPagina(${this._estado.paginaActual - 1})" ${this._estado.paginaActual === 1 ? 'disabled' : ''} class="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500"><span class="material-symbols-outlined text-sm">chevron_left</span></button>
                    <div class="px-3 flex items-center bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-500">${this._estado.paginaActual} / ${totalPaginas}</div>
                    <button onclick="productoView.cambiarPagina(${this._estado.paginaActual + 1})" ${this._estado.paginaActual >= totalPaginas ? 'disabled' : ''} class="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500"><span class="material-symbols-outlined text-sm">chevron_right</span></button>
                </div>
            </div>`;
    },

    verDetalle(id) { productoController.verDetalle(id); },
    gestionarBusqueda(v) { this._estado.busqueda = v; this._estado.paginaActual = 1; productoController.refrescarVista(); },
    gestionarOrden() { this._estado.orden = this._estado.orden === 'asc' ? 'desc' : 'asc'; productoController.refrescarVista(); },
    cambiarPagina(p) { this._estado.paginaActual = p; productoController.refrescarVista(); },
    _ordenarDatos(d) { return [...d].sort((a, b) => this._estado.orden === 'asc' ? a.nombre.localeCompare(b.nombre) : b.nombre.localeCompare(a.nombre)); },
    
    confirmarEliminacion(dataEncoded) {
        const p = JSON.parse(decodeURIComponent(escape(atob(dataEncoded))));
        Swal.fire({
            title: '<span class="text-red-600 font-black uppercase text-sm">¿Eliminar Producto?</span>',
            text: `¿Confirma que desea eliminar ${p.nombre.toUpperCase()}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'SÍ, ELIMINAR',
            confirmButtonColor: '#dc2626',
            customClass: { popup: 'rounded-[32px]' }
        }).then((res) => { if (res.isConfirmed) productoController.eliminar(p.id); });
    }
};

window.productoView = productoView;