import { MediaHelper } from '../../utils/mediaHelper.js';

export const carruselTemplates = {
    /**
     * Renderiza la estructura base del editor
     */
    renderMain(isEdit, paso, config, items) {
        return `
            <div class="h-full w-full bg-slate-50/50 overflow-y-auto p-4 md:p-8 animate-fade-in custom-scrollbar">
                ${this._renderHeader(isEdit, paso)}
                <div class="max-w-[1400px] mx-auto">
                    ${this._renderTabs(paso)}
                    ${paso === 1 ? this._renderPaso1(config) : this._renderPaso2(items, config.tipo)}
                </div>
            </div>
        `;
    },

    _renderHeader(isEdit, paso) {
        return `
            <div class="max-w-[1400px] mx-auto mb-8 flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <button onclick="RegisterCarrusel.cancelarEdicion()" class="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 shadow-sm transition-all active:scale-95">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                    <div>
                        <h2 class="text-2xl font-black text-slate-800 uppercase tracking-tight">${isEdit ? 'Editar' : 'Nuevo'} Carrusel</h2>
                        <p class="text-slate-500 text-[10px] font-black uppercase tracking-widest">Gestión de Contenido Dinámico y Ubicaciones</p>
                    </div>
                </div>
                <div class="flex gap-3">
                    ${paso === 2 ? `
                        <button onclick="RegisterCarrusel.cambiarPaso(1)" class="px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-black text-xs uppercase hover:bg-slate-50 transition-all">Atrás</button>
                        <button onclick="RegisterCarrusel.finalizarGuardado()" class="px-8 py-3 rounded-xl bg-blue-600 text-white font-black text-xs uppercase shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">Publicar Cambios</button>
                    ` : `
                        <button onclick="RegisterCarrusel.irAPaso2()" class="px-8 py-3 rounded-xl bg-slate-900 text-white font-black text-xs uppercase flex items-center gap-2 shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all">Siguiente Paso <span class="material-symbols-outlined text-sm">arrow_forward</span></button>
                    `}
                </div>
            </div>
        `;
    },

    _renderTabs(paso) {
        return `
            <div class="flex mb-8 bg-white p-2 rounded-3xl shadow-sm border border-slate-100 w-fit">
                <button onclick="RegisterCarrusel.cambiarPaso(1)" class="px-8 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${paso === 1 ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}">1. Ubicación y Tipo</button>
                <button onclick="RegisterCarrusel.irAPaso2()" class="px-8 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${paso === 2 ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}">2. Selección de Contenido</button>
            </div>
        `;
    },

    _renderPaso1(c) {
        return `
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-slide-up">
                <div class="lg:col-span-8 space-y-6">
                    <div class="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100">
                        <h3 class="text-sm font-black text-slate-800 uppercase mb-8 flex items-center gap-3">
                            <span class="material-symbols-outlined text-blue-600">distance</span> Ubicación en la Web
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="space-y-2 md:col-span-2">
                                <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Nombre Identificador (Interno)</label>
                                <input type="text" id="cfg_nombre" value="${c.nombre || ''}" placeholder="Ej: Carrusel de Ofertas Verano" class="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none">
                            </div>

                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Sección Destino</label>
                                <select id="cfg_slug" onchange="RegisterCarrusel.actualizarOrdenAutomatico(this.value)" class="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl p-4 text-sm font-bold outline-none cursor-pointer">
                                    <option value="home-top" ${c.ubicacion_slug === 'home-top' ? 'selected' : ''}>Inicio - Superior (Top)</option>
                                    <option value="home-middle" ${c.ubicacion_slug === 'home-middle' ? 'selected' : ''}>Inicio - Cuerpo (Middle)</option>
                                    <option value="home-bottom" ${c.ubicacion_slug === 'home-bottom' ? 'selected' : ''}>Inicio - Pie (Bottom)</option>
                                </select>
                            </div>

                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Prioridad en Sección</label>
                                <div class="relative">
                                    <input type="number" id="cfg_orden_seccion" value="${c.orden_seccion || 0}" readonly class="w-full bg-slate-100 border-2 border-transparent rounded-2xl p-4 text-sm font-bold text-slate-500 outline-none cursor-not-allowed">
                                    <span class="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 text-sm">lock</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100">
                        <label class="text-[10px] font-black text-slate-400 uppercase ml-2 block mb-2">Descripción o Notas</label>
                        <textarea id="cfg_descripcion" class="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl p-4 text-sm font-bold h-24 transition-all outline-none resize-none">${c.descripcion || ''}</textarea>
                    </div>
                </div>

                <div class="lg:col-span-4 space-y-6">
                    <div class="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100">
                        <label class="text-[10px] font-black text-slate-400 uppercase mb-6 block ml-2">¿Qué mostrará este carrusel?</label>
                        <div class="grid gap-3">
                            ${['banners', 'productos', 'categorias'].map(t => `
                                <button onclick="RegisterCarrusel.cambiarTipo('${t}')" class="w-full p-5 rounded-2xl text-left transition-all flex items-center justify-between border-2 ${c.tipo === t ? 'border-blue-600 bg-blue-50/50 text-blue-600' : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'}">
                                    <div class="flex items-center gap-3">
                                        <span class="material-symbols-outlined text-xl">${t === 'banners' ? 'gallery_thumbnail' : t === 'productos' ? 'shopping_bag' : 'category'}</span>
                                        <span class="text-xs font-black uppercase">${t}</span>
                                    </div>
                                    <span class="material-symbols-outlined text-sm">${c.tipo === t ? 'radio_button_checked' : 'radio_button_unchecked'}</span>
                                </button>
                            `).join('')}
                        </div>
                        <p class="mt-6 text-[9px] text-slate-400 font-medium px-2 leading-relaxed">
                            <b class="text-slate-600">Nota:</b> Al cambiar el tipo, se reiniciará la lista de ítems para mantener la integridad de los datos.
                        </p>
                    </div>
                </div>
            </div>
        `;
    },

    _renderPaso2(items, tipo) {
        return `
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-slide-up pb-20">
                <div class="lg:col-span-4">
                    <div id="form_item_container" class="bg-white rounded-[2.5rem] p-8 shadow-xl sticky top-8 border border-slate-100">
                        ${this.renderFormItem(tipo)}
                    </div>
                </div>
                <div class="lg:col-span-8 space-y-8">
                    <div id="live_preview_container">
                        ${this.renderLivePreview(items, 0, tipo)}
                    </div>
                    <div id="items_list_container">
                        ${this.renderItemsList(items)}
                    </div>
                </div>
            </div>
        `;
    },

    renderFormItem(tipo, itemEdit = null) {
        if (tipo !== 'banners') {
            return `
            <h3 class="text-xs font-black uppercase mb-6 text-slate-800 flex items-center gap-2">
                <span class="material-symbols-outlined text-blue-500">search</span>
                Buscar ${tipo === 'productos' ? 'Productos' : 'Categorías'}
            </h3>
            <div class="space-y-4">
                <div class="relative">
                    <input type="text" id="it_search" 
                           oninput="carruselActions.buscarRelacionados(this.value)"
                           placeholder="Escribe nombre de ${tipo === 'productos' ? 'producto' : 'categoría'}..." 
                           class="w-full bg-slate-100 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-2xl p-4 pl-12 pr-12 text-sm font-bold outline-none transition-all">
                    
                    <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    
                    <button onclick="carruselActions.limpiarBuscadorRapido()" 
                            class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 transition-colors">
                        <span class="material-symbols-outlined text-xl">cancel</span>
                    </button>
                </div>

                <div id="search_results_list" class="bg-white border-2 border-slate-100 rounded-2xl overflow-hidden hidden shadow-xl max-h-[300px] overflow-y-auto custom-scrollbar">
                </div>

                <input type="hidden" id="it_relacion_id">
                <input type="hidden" id="it_titulo">
                <input type="hidden" id="it_media_url">
                <input type="hidden" id="it_link"> 
                <input type="hidden" id="it_subtitulo"> <div id="preview_box" class="aspect-square bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center">
                    <span class="material-symbols-outlined text-slate-200 text-4xl">image</span>
                </div>

                <button onclick="RegisterCarrusel.agregarItemALista()" 
                        class="w-full bg-slate-900 text-white p-4 rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-slate-800 transition-all mt-2">
                    Confirmar y Añadir
                </button>
            </div>`;
        }

        return `
            <h3 class="text-xs font-black uppercase mb-6 text-slate-800 flex items-center gap-2">
                <span class="material-symbols-outlined text-blue-500">${itemEdit ? 'edit_note' : 'add_circle'}</span>
                ${itemEdit ? 'Modificar Banner' : 'Nuevo Banner'}
            </h3>
            <div class="space-y-5">
                <div class="relative group/img-container aspect-video bg-slate-50 rounded-[1.5rem] border-2 border-dashed border-slate-200 overflow-hidden transition-all">
                    <div id="preview_box" class="w-full h-full flex flex-col items-center justify-center">
                        ${itemEdit ? `<img src="${itemEdit.imagen_preview}" class="w-full h-full object-cover">` : `
                            <span class="material-symbols-outlined text-slate-300 text-4xl mb-2">add_photo_alternate</span>
                            <p class="text-[9px] font-black text-slate-400 uppercase text-center px-4">Sube una imagen o video</p>
                        `}
                    </div>
                    <div class="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/img-container:opacity-100 transition-all flex items-center justify-center gap-3">
                        <button onclick="document.getElementById('file_item').click()" class="w-10 h-10 bg-white rounded-full text-slate-900 shadow-lg flex items-center justify-center hover:scale-110 transition-transform"><span class="material-symbols-outlined">upload_file</span></button>
                        <button onclick="carruselActions.pedirUrlImagen()" class="w-10 h-10 bg-white rounded-full text-slate-900 shadow-lg flex items-center justify-center hover:scale-110 transition-transform"><span class="material-symbols-outlined">link</span></button>
                    </div>
                    <input type="file" id="file_item" hidden accept="image/*,video/*" onchange="carruselActions.previsualizarMediaLocal(this)">
                    <input type="hidden" id="it_media_url" value="${itemEdit?.imagen_preview || ''}">
                </div>

                <div class="grid gap-4">
                    <div class="space-y-1">
                        <label class="text-[9px] font-black text-slate-400 uppercase ml-2">Título Principal</label>
                        <input type="text" id="it_titulo" value="${itemEdit?.titulo || ''}" class="w-full bg-slate-50 rounded-xl p-3 text-xs font-bold outline-none focus:bg-white border border-transparent focus:border-slate-200 transition-all">
                    </div>
                    <div class="space-y-1">
                        <label class="text-[9px] font-black text-slate-400 uppercase ml-2">Texto del Botón / Subtítulo</label>
                        <input type="text" id="it_subtitulo" value="${itemEdit?.subtitulo || ''}" class="w-full bg-slate-50 rounded-xl p-3 text-xs font-bold outline-none focus:bg-white border border-transparent focus:border-slate-200 transition-all">
                    </div>
                    <div class="space-y-1">
                        <label class="text-[9px] font-black text-slate-400 uppercase ml-2">Enlace de Destino (URL)</label>
                        <input type="text" id="it_link" value="${itemEdit?.link || ''}" class="w-full bg-slate-50 rounded-xl p-3 text-xs font-bold outline-none focus:bg-white border border-transparent focus:border-slate-200 transition-all">
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3 mt-4">
                    ${itemEdit ? `
                        <button onclick="RegisterCarrusel.cancelarEdicionItem()" class="bg-slate-100 text-slate-600 p-4 rounded-xl font-black text-[10px] uppercase hover:bg-slate-200 transition-all">Cancelar</button>
                        <button onclick="RegisterCarrusel.agregarItemALista()" class="bg-blue-600 text-white p-4 rounded-xl font-black text-[10px] uppercase hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all">Actualizar</button>
                    ` : `
                        <button onclick="RegisterCarrusel.agregarItemALista()" class="col-span-2 bg-slate-900 text-white p-5 rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-slate-800 transition-all">Añadir al Carrusel</button>
                    `}
                </div>
            </div>`;
    },

    renderLivePreview(items, activo = 0, tipo = 'banners') {
        if (items.length === 0) {
            return `<div class="aspect-[21/9] bg-slate-200 rounded-[3rem] flex items-center justify-center border-4 border-dashed border-slate-300">
                <div class="text-center opacity-30">
                    <span class="material-symbols-outlined text-6xl">view_carousel</span>
                    <p class="text-xs font-black uppercase mt-2">Vista previa vacía</p>
                </div>
            </div>`;
        }

        if (tipo !== 'banners') {
            return `
                <div class="bg-slate-50 border-2 border-slate-100 rounded-[3rem] p-8 relative">
                    <p class="text-[10px] font-black text-slate-400 uppercase mb-4 ml-4">Previsualización de Tarjetas</p>
                    <div class="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                        ${items.map((it) => `
                            <div class="min-w-[200px] max-w-[200px] bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex-shrink-0 animate-fade-in group">
                                <div class="aspect-square bg-slate-50 rounded-2xl mb-3 overflow-hidden relative">
                                    <img src="${it.imagen_preview}" class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" onerror="this.src='https://placehold.co/200?text=No+Img'">
                                </div>
                                <p class="text-[10px] font-black uppercase text-slate-800 line-clamp-2 h-8 leading-tight">${it.titulo}</p>
                                <div class="mt-3 flex justify-between items-center">
                                    <span class="text-blue-600 font-black text-sm">
                                        ${it.subtitulo ? it.subtitulo : '$ --.--'}
                                    </span>
                                    <span class="material-symbols-outlined text-slate-200 text-sm group-hover:text-blue-500 transition-colors">shopping_cart</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>`;
        }

        const item = items[activo];
        const media = MediaHelper.obtenerInfoVideo(item.imagen_preview);

        return `
            <div class="bg-slate-900 rounded-[3rem] p-2 shadow-2xl overflow-hidden relative group border-4 border-white animate-fade-in">
                <div class="aspect-[21/9] w-full bg-slate-800 rounded-[2.5rem] flex items-center justify-center relative overflow-hidden">
                    <div class="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent z-[1]"></div>
                    <img src="${media.thumb}" class="absolute inset-0 w-full h-full object-cover">
                    <div class="relative z-10 w-full h-full flex flex-col justify-center px-16 text-left">
                        <h4 class="text-white text-4xl font-black uppercase tracking-tighter max-w-lg leading-tight mb-2">${item.titulo || 'SIN TÍTULO'}</h4>
                        <div class="flex items-center gap-4">
                             <div class="px-6 py-2 bg-white text-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest">${item.subtitulo || 'BOTÓN'}</div>
                        </div>
                    </div>
                    <div class="absolute bottom-6 right-12 z-20 flex gap-2">
                        <button onclick="RegisterCarrusel.cambiarSlide(-1)" class="w-10 h-10 rounded-full bg-white/10 text-white backdrop-blur-md flex items-center justify-center hover:bg-white hover:text-slate-900 transition-all"><span class="material-symbols-outlined">chevron_left</span></button>
                        <button onclick="RegisterCarrusel.cambiarSlide(1)" class="w-10 h-10 rounded-full bg-white/10 text-white backdrop-blur-md flex items-center justify-center hover:bg-white hover:text-slate-900 transition-all"><span class="material-symbols-outlined">chevron_right</span></button>
                    </div>
                </div>
            </div>`;
    },

    renderItemsList(items) {
        return `
            <div class="space-y-4">
                <div class="flex justify-between items-center px-4">
                    <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Elementos en el Carrusel (${items.length})</h3>
                    <p class="text-[9px] font-bold text-blue-500 uppercase">Arrastra para reordenar</p>
                </div>
                <div class="grid gap-3">
                    ${items.length === 0 ? `
                        <div class="bg-white/50 border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center">
                            <p class="text-xs font-bold text-slate-400 uppercase">No hay elementos agregados aún</p>
                        </div>
                    ` : items.map((item, idx) => `
                        <div class="bg-white p-4 rounded-[2rem] flex items-center gap-4 shadow-sm border border-slate-100 group transition-all hover:border-blue-200 hover:shadow-md">
                            <div class="flex flex-col gap-1">
                                <button onclick="RegisterCarrusel.reordenar(${idx}, -1)" class="material-symbols-outlined text-slate-300 hover:text-blue-500 transition-colors">expand_less</button>
                                <button onclick="RegisterCarrusel.reordenar(${idx}, 1)" class="material-symbols-outlined text-slate-300 hover:text-blue-500 transition-colors">expand_more</button>
                            </div>
                            <div class="w-24 h-16 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0">
                                <img src="${MediaHelper.obtenerInfoVideo(item.imagen_preview).thumb}" class="w-full h-full object-cover">
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-2">
                                    <p class="text-[11px] font-black text-slate-800 uppercase truncate">${item.titulo || 'SIN TÍTULO'}</p>
                                    ${item.subtitulo && (item.tipo_contenido === 'productos') ? `<span class="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">${item.subtitulo}</span>` : ''}
                                </div>
                                <p class="text-[9px] font-bold text-slate-400 uppercase truncate">${item.link || 'Sin enlace'}</p>
                            </div>
                            <div class="flex gap-2 pr-2">
                                <button onclick="RegisterCarrusel.cargarItemParaEditar(${idx})" class="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center"><span class="material-symbols-outlined text-sm">edit</span></button>
                                <button onclick="RegisterCarrusel.quitarItem(${idx})" class="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"><span class="material-symbols-outlined text-sm">delete</span></button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
    }
};