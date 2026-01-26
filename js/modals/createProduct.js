/**
 * Nexus Admin Suite V6.7 - Multimedia Social Integration
 * Soporte para YouTube, Vimeo, Facebook, Instagram, TikTok y Archivos Locales
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
        
        this._datosTemporales = { ...this._datosTemporales, ...dPrevios };
        this._categoriasSeleccionadas = dPrevios.categoriasIds || [];
        this._galeriaArchivos = dPrevios.galeria || [];
        
        if (dPrevios.portada) {
            this._portadaArchivo = typeof dPrevios.portada === 'string' 
                ? { tipo: 'url', url: dPrevios.portada, data: null }
                : { tipo: 'local', data: dPrevios.portada, url: URL.createObjectURL(dPrevios.portada) };
        }

        this.render();
        return new Promise((resolve) => { this._resolve = resolve; });
    },

    // --- LÓGICA DE DETECCIÓN DE VIDEO INTEGRADA ---
    obtenerInfoVideo(url) {
        if (!url) return { tipo: 'desconocido', thumb: '' };
        const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
        const ytMatch = url.match(ytRegex);
        if (ytMatch) return { tipo: 'youtube', id: ytMatch[1], thumb: `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg` };
        
        const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/i;
        const vimeoMatch = url.match(vimeoRegex);
        if (vimeoMatch) return { tipo: 'vimeo', id: vimeoMatch[1], thumb: `https://vumbnail.com/${vimeoMatch[1]}.jpg` };
        
        if (url.includes('facebook.com')) return { tipo: 'facebook', url: url, thumb: 'https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg' };
        if (url.includes('instagram.com')) return { tipo: 'instagram', url: url, thumb: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg' };
        if (url.includes('tiktok.com')) return { tipo: 'tiktok', url: url, thumb: 'https://upload.wikimedia.org/wikipedia/en/a/a9/TikTok_logo.svg' };
        
        const esArchivo = url.match(/\.(mp4|webm|ogg|mov)$/i);
        return { tipo: 'local', thumb: url, esArchivo: !!esArchivo };
    },

    // --- RENDERIZADO DE RECURSOS (IFRAMES) ---
    verPreviewAmpliado(url, tipo = 'image') {
        if (!url) return;
        let content = '';
        
        if (tipo === 'video') {
            const info = this.obtenerInfoVideo(url);
            const encodedUrl = encodeURIComponent(url);

            if (info.esArchivo) {
                content = `<video src="${url}" controls class="w-full rounded-2xl shadow-2xl" autoplay></video>`;
            } else {
                let iframeSrc = '';
                if (info.tipo === 'youtube') iframeSrc = `https://www.youtube.com/embed/${info.id}?autoplay=1`;
                else if (info.tipo === 'vimeo') iframeSrc = `https://player.vimeo.com/video/${info.id}?autoplay=1`;
                else if (info.tipo === 'facebook') iframeSrc = `https://www.facebook.com/plugins/video.php?href=${encodedUrl}&show_text=0&t=0&autoplay=1`;
                else if (info.tipo === 'instagram') iframeSrc = `${url.endsWith('/') ? url : url + '/'}embed`;
                else if (info.tipo === 'tiktok') {
                    const videoId = url.split('/video/')[1]?.split('?')[0];
                    iframeSrc = `https://www.tiktok.com/embed/v2/${videoId}`;
                }
                content = `<iframe src="${iframeSrc}" class="w-full aspect-video rounded-2xl" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
            }
        } else {
            content = `<img src="${url}" class="w-full rounded-2xl shadow-2xl">`;
        }

        Swal.fire({ html: content, showConfirmButton: false, background: 'transparent', width: '850px', backdrop: 'rgba(15, 23, 42, 0.95)' });
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
            const { value: file } = await Swal.fire({ title: 'Cargar Imagen Local', input: 'file', inputAttributes: { 'accept': 'image/*' } });
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
        const filtradas = window.categoriasRaw.filter(c => 
            c.id_padre && c.nombre.toLowerCase().includes(this._searchTerm)
        ).slice(0, 10);

        lista.innerHTML = filtradas.map(h => `
            <div onclick="window.productManager.toggleHija(${h.id})" class="p-3 bg-white rounded-xl border-2 cursor-pointer hover:border-blue-600 mb-2 flex justify-between items-center group transition-all">
                <p class="text-[11px] font-black text-slate-700 uppercase">${h.nombre}</p>
                <span class="material-symbols-outlined text-slate-300 group-hover:text-blue-600 text-sm">add_circle</span>
            </div>
        `).join('');
    },

    toggleHija(id) {
        this._categoriasSeleccionadas = this._categoriasSeleccionadas.includes(id)
            ? this._categoriasSeleccionadas.filter(i => i !== id)
            : [...this._categoriasSeleccionadas, id];
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
                            <option value="image">Imagen</option>
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
            const { value: f } = await Swal.fire({ title: 'Subir Archivo', input: 'file' });
            if (f) { file = f; url = URL.createObjectURL(f); }
        } else {
            const { value: u } = await Swal.fire({ title: 'Pegar URL', input: 'url' });
            if (u) url = u;
        }

        if (url) {
            const info = this.obtenerInfoVideo(url);
            this._galeriaArchivos.push({
                id: Date.now().toString(),
                tipo, url, file,
                thumb: info.thumb || url,
                nombre: metodo === 'url' ? info.tipo.toUpperCase() : file.name,
                orden: this._galeriaArchivos.length + 1
            });
            this.updateUI();
        }
    },

    setOrdenGaleria(id, valor) {
        const numClean = valor.replace(/[^0-9]/g, '');
        const item = this._galeriaArchivos.find(i => i.id === id);
        if (item) item.orden = parseInt(numClean) || 0;
        this._galeriaArchivos.sort((a, b) => a.orden - b.orden);
    },

    render() { this.updateUI(); },

    updateUI() {
        const container = this._mainContainer;
        const d = this._datosTemporales;
        const seleccionadas = window.categoriasRaw.filter(c => this._categoriasSeleccionadas.includes(c.id));

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
                                <div id="nexus-resultados-busqueda" class="overflow-y-auto bg-slate-50 rounded-[2rem] p-5 custom-scrollbar border-2 border-dashed border-slate-200"></div>
                                <div class="overflow-y-auto bg-blue-50/30 rounded-[2rem] p-5 custom-scrollbar border border-blue-100">
                                    ${seleccionadas.map(s => `
                                        <div class="flex justify-between items-center p-4 bg-white rounded-xl mb-2 shadow-sm border border-blue-100">
                                            <span class="text-[11px] font-black text-slate-700 uppercase">${s.nombre}</span>
                                            <button onclick="window.productManager.toggleHija(${s.id})" class="text-red-400"><span class="material-symbols-outlined text-base">cancel</span></button>
                                        </div>`).join('')}
                                </div>
                            </div>
                        </div>

                        <div class="${this._pasoActual === 3 ? 'block' : 'hidden'} space-y-8">
                            <div class="relative group aspect-video bg-slate-50 rounded-[2.5rem] overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center transition-all hover:border-blue-400">
                                ${this._portadaArchivo.url ? `<img src="${this._portadaArchivo.url}" class="w-full h-full object-cover">` : '<span class="material-symbols-outlined text-6xl text-slate-200">add_photo_alternate</span>'}
                                <div class="absolute inset-0 bg-slate-900/70 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-6">
                                    <button onclick="window.productManager.cambiarPortada('local')" class="p-4 bg-white rounded-full text-slate-900 hover:text-blue-600 transition-all"><span class="material-symbols-outlined">upload_file</span></button>
                                    <button onclick="window.productManager.cambiarPortada('url')" class="p-4 bg-white rounded-full text-slate-900 hover:text-blue-600 transition-all"><span class="material-symbols-outlined">link</span></button>
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
                            <div class="absolute top-8 right-8 bg-white/90 backdrop-blur px-5 py-2 rounded-2xl font-black text-blue-600 text-xs shadow-xl">STOCK: <span class="preview-stock">${d.stock}</span></div>
                        </div>
                        <div class="p-12 space-y-6">
                            <h2 class="preview-nombre text-3xl font-black text-slate-900 leading-tight">${d.nombre || 'Nombre'}</h2>
                            <p class="preview-desc text-slate-500 text-base leading-relaxed line-clamp-4">${d.descripcion || 'Sin descripción...'}</p>
                            <div class="flex items-center justify-between pt-10 border-t border-slate-100">
                                <div class="preview-price-box transition-all" style="opacity: ${d.price_visible ? '1' : '0'}">
                                    <p class="text-[10px] font-black text-slate-400 uppercase">Inversión</p>
                                    <p class="text-4xl font-black text-slate-900 tracking-tighter"><span class="preview-precio">${d.precio || '0.00'}</span> <span class="text-base ml-1">Bs</span></p>
                                </div>
                                <button class="preview-ws-btn bg-[#25D366] text-white p-5 rounded-2xl font-black shadow-lg" style="display: ${d.ws_active ? 'flex' : 'none'}">
                                    <span class="material-symbols-outlined">chat</span>
                                </button>
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
        if (this._galeriaArchivos.length === 0) return `<div class="p-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 font-bold text-[10px] uppercase tracking-widest">Sin multimedia</div>`;
        
        return this._galeriaArchivos.map(item => `
            <div class="group flex items-center gap-5 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:border-blue-200 transition-all">
                <div class="flex flex-col items-center bg-slate-50 p-2 rounded-xl">
                    <span class="text-[7px] font-black text-slate-400 uppercase mb-1">ORDEN</span>
                    <input type="text" value="${item.orden}" oninput="window.productManager.setOrdenGaleria('${item.id}', this.value)" class="w-10 text-center bg-transparent font-black text-blue-600 text-sm outline-none border-none p-0">
                </div>
                <div class="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden relative cursor-pointer" onclick="window.productManager.verPreviewAmpliado('${item.url}', '${item.tipo}')">
                    ${item.tipo === 'video' ? `<img src="${item.thumb}" class="w-full h-full object-cover opacity-60"><div class="absolute inset-0 flex items-center justify-center"><span class="material-symbols-outlined text-white text-xl">play_circle</span></div>` : `<img src="${item.url}" class="w-full h-full object-cover">`}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-[11px] font-black text-slate-800 uppercase truncate">${item.nombre}</p>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="px-2 py-0.5 bg-slate-100 rounded text-[8px] font-black text-slate-400 uppercase">${item.tipo}</span>
                    </div>
                </div>
                <button onclick="window.productManager._galeriaArchivos = window.productManager._galeriaArchivos.filter(i => i.id !== '${item.id}'); window.productManager.updateUI()" class="p-3 text-slate-300 hover:text-red-500 transition-all">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </div>`).join('');
    },

    navSiguiente() {
        if (this._pasoActual === 3) {
            const dataFinal = { ...this._datosTemporales, categoriasIds: this._categoriasSeleccionadas, portada: this._portadaArchivo.data || this._portadaArchivo.url, galeria: this._galeriaArchivos };
            this._mainContainer.innerHTML = this._originalContent;
            this._resolve(dataFinal);
        } else {
            this._pasoActual++;
            this.updateUI();
        }
    }
};

window.productManager = productManager;