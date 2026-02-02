import { MediaHelper } from '../utils/mediaHelper.js';

export const detallesProductoView = {
    _galeriaReferencia: [],
    _itemActivo: null,

    _cambiarRecursoPrincipal: function(url, tipo) {
        this._itemActivo = url;
        const visor = document.getElementById('main-visor-container');
        if (!visor) return;

        const info = MediaHelper.obtenerInfoVideo(url, null, this._galeriaReferencia);
        
        let contenido = (info.tipo !== 'imagen') 
            ? MediaHelper.renderVideoPlayer(url, this._galeriaReferencia)
            : `<img src="${url}" class="w-full h-full object-contain animate-fade-in">`;

        visor.innerHTML = `
            ${contenido}
            <button onclick="window.detallesProductoView._verPreview('${url}', '${info.tipo}')" 
                    class="absolute bottom-4 right-4 w-12 h-12 bg-white/90 backdrop-blur hover:bg-indigo-600 hover:text-white text-slate-700 rounded-full shadow-lg transition-all flex items-center justify-center group">
                <span class="material-symbols-outlined transition-transform group-hover:scale-110">fullscreen</span>
            </button>
        `;

        this._actualizarEstadoThumbs(url);
    },

    _actualizarEstadoThumbs: function(url) {
        document.querySelectorAll('.thumb-item').forEach(el => {
            el.classList.remove('ring-2', 'ring-indigo-500', 'opacity-100');
            el.classList.add('opacity-50');
            if (el.dataset.url === url) {
                el.classList.add('ring-2', 'ring-indigo-500', 'opacity-100');
                el.classList.remove('opacity-50');
            }
        });
    },

    _verPreview: function(url, tipo) {
        MediaHelper.verPreviewAmpliado(url, tipo, this._galeriaReferencia);
    },

    render: function (datos, onEdit, onVolver) {
        const { producto, categorias, subcategorias, galeria } = datos;
        if (!producto) return `<div class="p-20 text-center text-slate-500 font-medium">Error al cargar datos</div>`;

        const nombre = producto.nombre;
        const portadaUrl = producto.imagen_url || producto.portada || 'https://via.placeholder.com/400';
        this._galeriaReferencia = [{ url: portadaUrl, tipo: 'imagen' }, ...(galeria || [])];
        this._itemActivo = portadaUrl;
        
        const precio = new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(producto.precio || 0);

        const renderStatus = (val, labelTrue, labelFalse, iconTrue, iconFalse) => {
            const isActive = !!val;
            const color = isActive ? 'emerald' : 'slate';
            return `
                <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-${color}-200 bg-${color}-50 text-${color}-700 shadow-sm transition-all">
                    <span class="material-symbols-outlined text-[18px]">${isActive ? iconTrue : iconFalse}</span>
                    <span class="text-[11px] font-bold uppercase tracking-tight">${isActive ? labelTrue : labelFalse}</span>
                </div>
            `;
        };

        const htmlThumbs = this._galeriaReferencia.map((item) => {
            const url = item.url || item.file_url;
            const info = MediaHelper.obtenerInfoVideo(url, null, this._galeriaReferencia);
            return `
            <div onclick="window.detallesProductoView._cambiarRecursoPrincipal('${url}', '${info.tipo}')" 
                 data-url="${url}"
                 class="thumb-item relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-slate-200 transition-all cursor-pointer bg-white 
                 ${url === this._itemActivo ? 'ring-2 ring-indigo-500 opacity-100' : 'opacity-50 hover:opacity-100'}">
                <img src="${info.thumb}" class="w-full h-full object-cover">
                ${info.tipo !== 'imagen' ? `<div class="absolute inset-0 flex items-center justify-center bg-black/20 text-white"><span class="material-symbols-outlined text-sm">play_circle</span></div>` : ''}
            </div>`;
        }).join('');

        return `
        <div class="w-full h-full bg-[#f8fafc] overflow-y-auto custom-scrollbar pb-12">
            <div class="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 shadow-sm">
                <div class="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
                    <div class="flex items-center gap-4">
                        <button id="btnVolverListado" class="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-all">
                            <span class="material-symbols-outlined">arrow_back</span>
                        </button>
                        <div>
                            <h1 class="text-xl font-black text-slate-800 leading-none">${nombre}</h1>
                            <div class="flex gap-2 mt-2">
                                ${renderStatus(producto.mostrar_precio, 'Público', 'Privado', 'visibility', 'visibility_off')}
                                ${renderStatus(producto.habilitar_whatsapp, 'WhatsApp On', 'WhatsApp Off', 'chat', 'comments_disabled')}
                            </div>
                        </div>
                    </div>
                    <button id="btnEditarProductoMain" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-md">
                        <span class="material-symbols-outlined text-lg">edit_square</span> Editar Información
                    </button>
                </div>
            </div>

            <div class="max-w-[1400px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div class="lg:col-span-5 space-y-4">
                    <div id="main-visor-container" class="aspect-square w-full rounded-3xl overflow-hidden bg-white shadow-xl border border-slate-200 relative">
                        <img src="${portadaUrl}" class="w-full h-full object-contain">
                        <button onclick="window.detallesProductoView._verPreview('${portadaUrl}', 'imagen')" 
                                class="absolute bottom-4 right-4 w-12 h-12 bg-white/90 backdrop-blur hover:bg-indigo-600 hover:text-white text-slate-700 rounded-full shadow-lg transition-all flex items-center justify-center">
                            <span class="material-symbols-outlined text-2xl">fullscreen</span>
                        </button>
                    </div>
                    <div class="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                        ${htmlThumbs}
                    </div>
                </div>

                <div class="lg:col-span-7 space-y-6">
                    <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-8">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Precio Unitario</label>
                                <p class="text-3xl font-black text-slate-900">${producto.mostrar_precio !== false ? precio : 'Consultar'}</p>
                            </div>
                            <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Stock Actual</label>
                                <p class="text-3xl font-black ${producto.stock > 0 ? 'text-slate-900' : 'text-red-500'}">${producto.stock || 0} Und.</p>
                            </div>
                        </div>

                        <div>
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4 italic">Categorización en Catálogo</label>
                            <div class="flex flex-wrap gap-2">
                                ${categorias.length ? categorias.map(cat => `
                                    <span class="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold shadow-sm uppercase">
                                        <span class="material-symbols-outlined text-indigo-500 text-sm">label</span> ${cat.nombre || cat}
                                    </span>
                                `).join('') : '<span class="text-slate-400 text-xs italic">Sin categorías asignadas</span>'}
                                
                                ${subcategorias?.map(sub => `
                                    <span class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-500 rounded-lg text-xs font-bold uppercase">
                                        <span class="material-symbols-outlined text-sm">subdirectory_arrow_right</span> ${sub.nombre || sub}
                                    </span>
                                `).join('') || ''}
                            </div>
                        </div>

                        <div class="border-t border-slate-100 pt-6">
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Descripción Técnica / Comercial</label>
                            <div class="prose prose-slate max-w-none">
                                <p class="text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200 italic whitespace-pre-wrap text-sm">
                                    ${producto.descripcion || 'No se ha redactado una descripción para este producto.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    },

    initEventListeners: function(producto, onEdit, onVolver) {
        document.getElementById('btnEditarProductoMain')?.addEventListener('click', () => onEdit(producto));
        document.getElementById('btnVolverListado')?.addEventListener('click', () => onVolver());
        window.detallesProductoView = this;
    }
};