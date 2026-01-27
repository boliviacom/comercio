/**
 * Nexus Admin Suite V6.8 - Multimedia & Preview Optimization
 * Actualización: Integración de Proporciones Dinámicas (YT, FB, IG, TK)
 */
export const productManager = {
    _galeriaArchivos: [],
    _portadaArchivo: { tipo: 'local', data: null, url: '' },
    _pasoActual: 1,
    _categoriasSeleccionadas: [],
    _datosTemporales: { ws_active: true, price_visible: true, nombre: '', precio: '', stock: 0, descripcion: '' },
    _resolve: null,
    _originalContent: null,
    _mainContainer: null,
    _searchTerm: '',

    async start(containerId, categorias, dPrevios = {}) {
        this._mainContainer = document.getElementById(containerId);
        if (!this._mainContainer) return;
        this._originalContent = this._mainContainer.innerHTML;
        window.categoriasRaw = categorias;
        
        this._pasoActual = 1;
        this._datosTemporales = { 
            nombre: dPrevios.nombre || '',
            precio: dPrevios.precio || '',
            stock: dPrevios.stock || 0,
            descripcion: dPrevios.descripcion || '',
            ws_active: dPrevios.ws_active !== undefined ? dPrevios.ws_active : true,
            price_visible: dPrevios.price_visible !== undefined ? dPrevios.price_visible : true,
            id: dPrevios.id || null
        };

        this._categoriasSeleccionadas = dPrevios.categoriasIds || [];
        
        this._galeriaArchivos = (dPrevios.galeria || []).map(item => ({
            id: item.id || Date.now().toString() + Math.random(),
            tipo: item.tipo || 'imagen',
            url: item.url || item.file_url,
            file: null,
            thumb: item.tipo === 'video' ? this.obtenerInfoVideo(item.url || item.file_url).thumb : (item.url || item.file_url),
            nombre: item.nombre || 'Archivo existente',
            orden: item.orden || 0
        }));
        
        if (dPrevios.imagen_url || dPrevios.portada) {
            const path = dPrevios.imagen_url || dPrevios.portada;
            this._portadaArchivo = typeof path === 'string' 
                ? { tipo: 'url', url: path, data: null }
                : { tipo: 'local', data: path, url: URL.createObjectURL(path) };
        } else {
            this._portadaArchivo = { tipo: 'local', data: null, url: '' };
        }

        this.render();
        this.injectStyles(); 
        return new Promise((resolve) => { this._resolve = resolve; });
    },

    // 1. Identificación y Miniaturas (Lógica Actualizada)
    obtenerInfoVideo(url) {
        if (!url || typeof url !== 'string') return { tipo: 'desconocido', thumb: '' };

        // Detección de YouTube (Soporta Shorts, Live, etc.)
        const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
        const ytMatch = url.match(ytRegex);
        if (ytMatch) {
            return { 
                tipo: 'youtube', 
                id: ytMatch[1], 
                thumb: `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg` 
            };
        }

        // Detección de TikTok
        if (url.includes('tiktok.com')) {
            const ttId = url.split('/video/')[1]?.split('?')[0];
            return { 
                tipo: 'tiktok', 
                id: ttId, 
                thumb: 'https://cdn-icons-png.flaticon.com/512/3046/3046121.png' 
            };
        }

        // Detección de Redes Sociales (Meta)
        if (url.includes('facebook.com') || url.includes('fb.watch')) {
            return { tipo: 'facebook', thumb: 'https://cdn-icons-png.flaticon.com/512/124/124010.png' };
        }
        if (url.includes('instagram.com')) {
            return { tipo: 'instagram', thumb: 'https://cdn-icons-png.flaticon.com/512/174/174855.png' };
        }

        // Archivos locales (.mp4, .webm, etc)
        const esArchivo = url.match(/\.(mp4|webm|ogg|mov)$/i) || url.startsWith('blob:');
        return { tipo: esArchivo ? 'local' : 'imagen', thumb: url, esArchivo: !!esArchivo };
    },

    // 2. Proporciones Dinámicas y Reproductor (Lógica Actualizada)
    renderVideoPlayer(url) {
        const info = this.obtenerInfoVideo(url);
        
        if (info.esArchivo) {
            return `<video src="${url}" controls class="w-full rounded-2xl shadow-2xl" autoplay></video>`;
        }

        let iframeSrc = '';
        let aspectPadding = '56.25%'; // 16:9 Estándar (YouTube)

        switch (info.tipo) {
            case 'youtube':
                iframeSrc = `https://www.youtube.com/embed/${info.id}?autoplay=1`;
                break;
            case 'facebook':
                iframeSrc = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&autoplay=1`;
                aspectPadding = '75%'; // 4:3 para Facebook
                break;
            case 'instagram':
                // Limpia la URL y fuerza el /embed
                const cleanIns = url.split('?')[0].replace(/\/$/, "") + '/embed';
                iframeSrc = cleanIns;
                aspectPadding = '125%'; // Formato retrato IG
                break;
            case 'tiktok':
                if (info.id) iframeSrc = `https://www.tiktok.com/embed/v2/${info.id}`;
                aspectPadding = '177%'; // 9:16 Vertical total (TikTok)
                break;
        }

        if (iframeSrc) {
            return `
                <div style="position: relative; width: 100%; padding-top: ${aspectPadding}; background: black; border-radius: 1.5rem; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                    <iframe src="${iframeSrc}" 
                            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
                            frameborder="0" 
                            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; fullscreen" 
                            allowfullscreen>
                    </iframe>
                </div>`;
        }
        
        return `<div class="p-10 bg-slate-100 text-center rounded-2xl font-bold">No se pudo cargar la previsualización del video</div>`;
    },

    verPreviewAmpliado(url, tipo = 'image') {
        if (!url) return;
        const info = this.obtenerInfoVideo(url);
        // Si el tipo es video o el detector dice que es archivo de video
        const content = (tipo === 'video' || info.esArchivo) ? this.renderVideoPlayer(url) : `<img src="${url}" class="w-full rounded-2xl shadow-2xl">`;
        
        Swal.fire({ 
            html: content, 
            showConfirmButton: false, 
            background: 'transparent', 
            width: (tipo === 'video' && (info.tipo === 'tiktok' || info.tipo === 'instagram')) ? '400px' : '850px', 
            backdrop: 'rgba(15, 23, 42, 0.95)' 
        });
    },

    sync(el, campo, type = 'text') {
        this._datosTemporales[campo] = type === 'checkbox' ? el.checked : el.value;
        if (campo === 'nombre') document.querySelector('.preview-nombre').innerText = el.value || 'Nombre del Producto';
        if (campo === 'precio') document.querySelector('.preview-precio').innerText = el.value || '0.00';
        if (campo === 'descripcion') document.querySelector('.preview-desc').innerText = el.value || 'Descripción...';
        if (campo === 'stock') document.querySelector('.preview-stock').innerText = el.value || '0';
        if (campo === 'price_visible') document.querySelector('.preview-price-box').style.opacity = el.checked ? '1' : '0';
        if (campo === 'ws_active') document.querySelector('.preview-ws-btn').style.display = el.checked ? 'flex' : 'none';
    },

    async cambiarPortada(metodo) {
        if (metodo === 'local') {
            const { value: file } = await Swal.fire({ 
                title: 'Cargar Imagen Local', input: 'file', inputAttributes: { 'accept': 'image/*' },
                customClass: { confirmButton: 'bg-blue-600' }
            });
            if (file) {
                this._portadaArchivo = { tipo: 'local', data: file, url: URL.createObjectURL(file) };
                this.updateUI();
            }
        } else {
            const { value: url } = await Swal.fire({ title: 'Vincular URL de Imagen', input: 'url' });
            if (url) {
                this._portadaArchivo = { tipo: 'url', data: null, url: url };
                this.updateUI();
            }
        }
    },

    handleSearch(el) {
        this._searchTerm = el.value.toLowerCase();
        const lista = document.getElementById('nexus-resultados-busqueda');
        const filtradas = window.categoriasRaw.filter(c => c.id_padre && c.nombre.toLowerCase().includes(this._searchTerm)).slice(0, 10);
        lista.innerHTML = filtradas.map(h => `
            <div onclick="window.productManager.toggleHija(${h.id})" class="p-3 bg-white rounded-xl border-2 cursor-pointer hover:border-blue-600 mb-2 flex justify-between items-center group transition-all">
                <p class="text-[11px] font-black text-slate-700 uppercase">${h.nombre}</p>
                <span class="material-symbols-outlined text-slate-300 group-hover:text-blue-600 text-sm">add_circle</span>
            </div>
        `).join('');
    },

    toggleHija(id) {
        this._categoriasSeleccionadas = this._categoriasSeleccionadas.includes(id) ? this._categoriasSeleccionadas.filter(i => i !== id) : [...this._categoriasSeleccionadas, id];
        this.updateUI();
    },

    async addGaleriaManual() {
        const { value: formValues } = await Swal.fire({
            title: 'Configurar Multimedia',
            width: '600px',
            html: `
                <div class="grid grid-cols-2 gap-6 p-4 text-left">
                    <div>
                        <label class="text-[10px] font-black uppercase text-slate-400 block mb-2 px-1">Formato</label>
                        <select id="swal-tipo" class="w-full bg-slate-100 border-none rounded-xl p-4 font-bold outline-none">
                            <option value="imagen">Imagen</option>
                            <option value="video">Video</option>
                        </select>
                    </div>
                    <div>
                        <label class="text-[10px] font-black uppercase text-slate-400 block mb-2 px-1">Carga</label>
                        <select id="swal-metodo" class="w-full bg-slate-100 border-none rounded-xl p-4 font-bold outline-none">
                            <option value="url">URL / Enlace</option>
                            <option value="local">Archivo</option>
                        </select>
                    </div>
                </div>`,
            confirmButtonText: 'Siguiente',
            preConfirm: () => [document.getElementById('swal-tipo').value, document.getElementById('swal-metodo').value]
        });

        if (!formValues) return;
        const [tipo, metodo] = formValues;
        let url = ''; let file = null;

        if (metodo === 'local') {
            const acceptAttr = tipo === 'video' ? 'video/*' : 'image/*';
            const { value: f } = await Swal.fire({ title: 'Subir Archivo', input: 'file', inputAttributes: { 'accept': acceptAttr } });
            if (f) { file = f; url = URL.createObjectURL(f); }
        } else {
            const { value: u } = await Swal.fire({ title: 'Pegar URL', input: 'url' });
            if (u) url = u;
        }

        if (url) {
            const info = this.obtenerInfoVideo(url);
            this._galeriaArchivos.push({
                id: Date.now().toString() + Math.random(),
                tipo: info.esArchivo || tipo === 'video' ? 'video' : 'imagen', 
                url, 
                file, 
                thumb: (info.esArchivo || tipo === 'video') ? info.thumb : url,
                nombre: metodo === 'url' ? (info.tipo !== 'local' && info.tipo !== 'imagen' ? info.tipo.toUpperCase() : 'URL Externo') : file.name,
                orden: this._galeriaArchivos.length + 1
            });
            this._galeriaArchivos.sort((a, b) => a.orden - b.orden);
            this.updateUI();
        }
    },

    setOrdenGaleria(id, valor) {
        const nuevoOrden = parseInt(valor) || 0;
        const item = this._galeriaArchivos.find(i => i.id === id);
        if (item) {
            item.orden = nuevoOrden;
            this._galeriaArchivos.sort((a, b) => a.orden - b.orden);
            this.updateUI();
        }
    },

    injectStyles() {
        if (document.getElementById('nexus-tooltips-styles')) return;
        const style = document.createElement('style');
        style.id = 'nexus-tooltips-styles';
        style.innerHTML = `
            [data-nexus-tooltip] { position: relative; }
            [data-nexus-tooltip]::before {
                content: attr(data-nexus-tooltip);
                position: absolute;
                bottom: 125%;
                left: 50%;
                transform: translateX(-50%) translateY(10px);
                background: #0f172a;
                color: white;
                padding: 8px 14px;
                border-radius: 10px;
                font-size: 10px;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 1px;
                white-space: nowrap;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                z-index: 9999;
                box-shadow: 0 10px 20px rgba(0,0,0,0.2);
            }
            [data-nexus-tooltip]:hover::before { opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0); }
            [data-nexus-tooltip]::after {
                content: '';
                position: absolute;
                bottom: 110%;
                left: 50%;
                transform: translateX(-50%);
                border: 6px solid transparent;
                border-top-color: #0f172a;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }
            [data-nexus-tooltip]:hover::after { opacity: 1; visibility: visible; }
        `;
        document.head.appendChild(style);
    },

    render() { this.updateUI(); },

    updateUI() {
        const container = this._mainContainer;
        const d = this._datosTemporales;
        const seleccionadas = window.categoriasRaw ? window.categoriasRaw.filter(c => this._categoriasSeleccionadas.includes(c.id)) : [];

        container.innerHTML = `
        <div class="h-full w-full bg-slate-50/50 overflow-y-auto custom-scrollbar p-6">
            <div class="max-w-[1400px] mx-auto grid grid-cols-12 gap-10">
                <div class="col-span-12 lg:col-span-7 bg-white rounded-[3rem] shadow-xl border border-slate-100 flex flex-col min-h-[800px]">
                    <div class="flex bg-slate-50/50 border-b">
                        ${this._renderTab(1, 'edit_square', 'Información')}
                        ${this._renderTab(2, 'account_tree', 'Categorización')}
                        ${this._renderTab(3, 'media_output', 'Multimedia')}
                    </div>

                    <div class="p-10 flex-1">
                        <div class="${this._pasoActual === 1 ? 'block' : 'hidden'} space-y-6">
                            <div class="space-y-2">
                                <label class="text-[10px] font-black uppercase text-slate-400 ml-4">Nombre del Producto</label>
                                <input type="text" value="${d.nombre}" oninput="window.productManager.sync(this, 'nombre')" class="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 font-semibold outline-none focus:border-blue-600 transition-colors">
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div class="space-y-2">
                                    <label class="text-[10px] font-black uppercase text-slate-400 ml-4">Precio (Bs)</label>
                                    <input type="number" value="${d.precio}" oninput="window.productManager.sync(this, 'precio')" class="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 font-semibold outline-none focus:border-blue-600 transition-colors">
                                </div>
                                <div class="space-y-2">
                                    <label class="text-[10px] font-black uppercase text-slate-400 ml-4">Stock</label>
                                    <input type="number" value="${d.stock}" oninput="window.productManager.sync(this, 'stock')" class="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 font-semibold outline-none focus:border-blue-600 transition-colors">
                                </div>
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] font-black uppercase text-slate-400 ml-4">Descripción</label>
                                <textarea oninput="window.productManager.sync(this, 'descripcion')" class="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 h-44 resize-none font-semibold outline-none focus:border-blue-600 transition-colors">${d.descripcion}</textarea>
                            </div>
                            <div class="grid grid-cols-2 gap-4 pt-4">
                                <label class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 cursor-pointer hover:border-blue-200 transition-all">
                                    <span class="text-[10px] font-black uppercase text-slate-500">Mostrar Precio Público</span>
                                    <input type="checkbox" ${d.price_visible ? 'checked' : ''} onchange="window.productManager.sync(this, 'price_visible', 'checkbox')" class="w-5 h-5 accent-blue-600">
                                </label>
                                <label class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 cursor-pointer hover:border-blue-200 transition-all">
                                    <span class="text-[10px] font-black uppercase text-slate-500">Botón WhatsApp</span>
                                    <input type="checkbox" ${d.ws_active ? 'checked' : ''} onchange="window.productManager.sync(this, 'ws_active', 'checkbox')" class="w-5 h-5 accent-[#25D366]">
                                </label>
                            </div>
                        </div>

                        <div class="${this._pasoActual === 2 ? 'block' : 'hidden'} space-y-6">
                            <div class="relative">
                                <span class="material-symbols-outlined absolute left-4 top-4 text-slate-400">search</span>
                                <input type="text" placeholder="Filtrar subcategorías..." oninput="window.productManager.handleSearch(this)" class="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-12 py-4 font-semibold outline-none focus:border-blue-600">
                            </div>
                            <div class="grid grid-cols-2 gap-6 h-[450px]">
                                <div id="nexus-resultados-busqueda" class="overflow-y-auto bg-slate-50 rounded-[2rem] p-5 custom-scrollbar border-2 border-dashed border-slate-200">
                                    <p class="text-center text-slate-400 text-[10px] font-bold mt-10">ESCRIBE PARA BUSCAR</p>
                                </div>
                                <div class="overflow-y-auto bg-blue-50/30 rounded-[2rem] p-5 custom-scrollbar border border-blue-100">
                                    ${seleccionadas.map(s => `
                                        <div class="flex justify-between items-center p-4 bg-white rounded-xl mb-2 shadow-sm border border-blue-100">
                                            <span class="text-[11px] font-black text-slate-700 uppercase">${s.nombre}</span>
                                            <button data-nexus-tooltip="Remover" onclick="window.productManager.toggleHija(${s.id})" class="text-red-400"><span class="material-symbols-outlined text-base">cancel</span></button>
                                        </div>`).join('')}
                                </div>
                            </div>
                        </div>

                        <div class="${this._pasoActual === 3 ? 'block' : 'hidden'} space-y-8">
                            <div class="relative group aspect-video bg-slate-50 rounded-[2.5rem] overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center transition-all hover:border-blue-400">
                                ${this._portadaArchivo.url ? `
                                    <img src="${this._portadaArchivo.url}" 
                                         class="w-full h-full object-cover cursor-pointer"
                                         onclick="window.productManager.verPreviewAmpliado('${this._portadaArchivo.url}', 'image')">
                                ` : '<span class="material-symbols-outlined text-6xl text-slate-200">add_photo_alternate</span>'}
                                
                                <div class="absolute inset-0 bg-slate-900/70 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-6">
                                    ${this._portadaArchivo.url ? `
                                        <button data-nexus-tooltip="Ver Portada" 
                                                onclick="window.productManager.verPreviewAmpliado('${this._portadaArchivo.url}', 'image')" 
                                                class="p-4 bg-white rounded-full text-slate-900 hover:text-blue-600 transition-all">
                                            <span class="material-symbols-outlined">visibility</span>
                                        </button>
                                    ` : ''}
                                    <button data-nexus-tooltip="Subir Archivo" onclick="window.productManager.cambiarPortada('local')" class="p-4 bg-white rounded-full text-slate-900 hover:text-blue-600 transition-all"><span class="material-symbols-outlined">upload_file</span></button>
                                    <button data-nexus-tooltip="Pegar Link" onclick="window.productManager.cambiarPortada('url')" class="p-4 bg-white rounded-full text-slate-900 hover:text-blue-600 transition-all"><span class="material-symbols-outlined">link</span></button>
                                </div>
                            </div>
                            
                            <div class="flex justify-between items-center px-2">
                                <h3 class="text-[11px] font-black text-slate-800 uppercase tracking-widest">Galería (Imágenes y Videos)</h3>
                                <button onclick="window.productManager.addGaleriaManual()" class="bg-slate-900 text-white px-8 py-3 rounded-full font-black text-[10px] uppercase shadow-lg hover:bg-blue-600 transition-all">Añadir Nuevo</button>
                            </div>
                            <div class="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                                ${this._renderGaleriaList()}
                            </div>
                        </div>
                    </div>

                    <div class="p-8 bg-slate-50 border-t flex justify-between items-center">
                        <button onclick="window.productManager._pasoActual-- ; window.productManager.updateUI()" class="font-black text-[10px] uppercase text-slate-400 ${this._pasoActual === 1 ? 'invisible' : ''}">Atrás</button>
                        <button onclick="window.productManager.navSiguiente()" class="px-14 py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase shadow-xl hover:bg-blue-700 hover:scale-105 transition-all">
                            ${this._pasoActual === 3 ? 'Guardar Cambios' : 'Siguiente Paso'}
                        </button>
                    </div>
                </div>

                <div class="col-span-12 lg:col-span-5">
                    <div class="sticky top-6 bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-100 transform rotate-1">
                        <div class="aspect-square bg-slate-100 relative">
                            ${this._portadaArchivo.url ? `<img src="${this._portadaArchivo.url}" class="w-full h-full object-cover">` : ''}
                            <div class="absolute top-8 right-8 bg-white/90 backdrop-blur px-5 py-2 rounded-2xl font-black text-blue-600 text-xs shadow-xl uppercase">STOCK: <span class="preview-stock">${d.stock}</span></div>
                        </div>
                        <div class="p-12 space-y-6">
                            <h2 class="preview-nombre text-3xl font-black text-slate-900 leading-tight">${d.nombre || 'Nombre del Producto'}</h2>
                            <p class="preview-desc text-slate-500 text-base leading-relaxed line-clamp-4">${d.descripcion || 'Sin descripción detallada...'}</p>
                            <div class="flex items-center justify-between pt-10 border-t border-slate-100">
                                <div class="preview-price-box transition-all" style="opacity: ${d.price_visible ? '1' : '0'}">
                                    <p class="text-[10px] font-black text-slate-400 uppercase">Inversión</p>
                                    <p class="text-4xl font-black text-slate-900 tracking-tighter"><span class="preview-precio">${d.precio || '0.00'}</span> <span class="text-base ml-1 uppercase">Bs</span></p>
                                </div>
                                <div class="preview-ws-btn bg-[#25D366] text-white p-4 rounded-2xl shadow-[0_10px_20px_rgba(37,211,102,0.3)] hover:scale-110 transition-all flex items-center justify-center cursor-pointer" style="display: ${d.ws_active ? 'flex' : 'none'}">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    },

    _renderTab(num, icon, label) {
        const active = this._pasoActual === num;
        return `<button onclick="window.productManager._pasoActual = ${num}; window.productManager.updateUI()" class="flex-1 py-7 flex flex-col items-center gap-2 border-b-4 transition-all ${active ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-400 hover:bg-slate-50'}">
            <span class="material-symbols-outlined text-2xl">${icon}</span>
            <span class="text-[10px] font-black uppercase tracking-widest">${label}</span>
        </button>`;
    },

    _renderGaleriaList() {
        if (this._galeriaArchivos.length === 0) return `<div class="p-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 font-bold text-[10px] uppercase tracking-widest">Sin multimedia adicional</div>`;
        
        return this._galeriaArchivos.map(item => `
            <div class="group flex items-center gap-5 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:border-blue-200 transition-all">
                <div class="flex flex-col items-center bg-slate-50 p-2 rounded-xl">
                    <span class="text-[7px] font-black text-slate-400 uppercase mb-1">ORDEN</span>
                    <input type="number" 
                           value="${item.orden}" 
                           onchange="window.productManager.setOrdenGaleria('${item.id}', this.value)" 
                           class="w-10 text-center bg-transparent font-black text-blue-600 text-sm outline-none border-none p-0">
                </div>
                <div data-nexus-tooltip="Previsualizar" class="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden relative cursor-pointer" onclick="window.productManager.verPreviewAmpliado('${item.url}', '${item.tipo}')">
                    ${item.tipo === 'video' ? `<img src="${item.thumb}" class="w-full h-full object-cover opacity-60"><div class="absolute inset-0 flex items-center justify-center"><span class="material-symbols-outlined text-white text-xl">play_circle</span></div>` : `<img src="${item.url}" class="w-full h-full object-cover">`}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-[11px] font-black text-slate-800 uppercase truncate">${item.nombre}</p>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="px-2 py-0.5 bg-slate-100 rounded text-[8px] font-black text-slate-400 uppercase">${item.tipo}</span>
                    </div>
                </div>
                <button data-nexus-tooltip="Eliminar" onclick="window.productManager._galeriaArchivos = window.productManager._galeriaArchivos.filter(i => i.id !== '${item.id}'); window.productManager.updateUI()" class="p-3 text-slate-300 hover:text-red-500 transition-all">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </div>`).join('');
    },

    navSiguiente() {
        if (this._pasoActual === 3) {
            console.log("--- INICIANDO ENVÍO FINAL ---");

            // 1. LIMPIEZA DE GALERÍA: Evita el error de "Doble JSON"
            // Enviamos datos planos. El backend decidirá si usar 'file' o 'url'.
            const galeriaLimpia = this._galeriaArchivos.map(i => {
                console.log(`[DEBUG] Procesando item galería (${i.tipo}):`, i.nombre);
                return { 
                    file: i.file,                // Objeto File si es carga local
                    url: i.file ? null : i.url,  // String URL si es link externo (YT, TikTok, etc)
                    tipo: i.tipo, 
                    orden: parseInt(i.orden) || 0,
                    nombre: i.nombre
                };
            });

            // 2. CONSTRUCCIÓN DEL OBJETO FINAL
            const dataFinal = { 
                ...this._datosTemporales, 
                // Forzamos conversión a 1/0 por si la DB no reconoce booleanos JS
                ws_active: this._datosTemporales.ws_active ? 1 : 0, 
                price_visible: this._datosTemporales.price_visible ? 1 : 0,
                precio: parseFloat(this._datosTemporales.precio) || 0,
                stock: parseInt(this._datosTemporales.stock) || 0,
                categoriasIds: this._categoriasSeleccionadas, 
                portada: this._portadaArchivo.data || this._portadaArchivo.url, 
                galeria: galeriaLimpia
            };

            console.log("[ENVÍO] Objeto final consolidado:", dataFinal);
            console.log("------------------------------");

            this._mainContainer.innerHTML = this._originalContent;
            this._resolve(dataFinal);
        } else {
            this._pasoActual++;
            this.updateUI();
        }
    },
};

window.productManager = productManager;