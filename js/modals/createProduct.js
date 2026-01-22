/**
 * Modal Create Product - Nexus Admin Suite V4.1
 * Solución al problema del foco en inputs y porcentaje real.
 */
export const createProduct = {
    _galeriaArchivos: [], 
    _portadaArchivo: null,
    _pasoActual: 1,
    _categoriaPadreSeleccionada: null,
    _categoriasSeleccionadas: [],
    _datosTemporales: {},

    /**
     * Calcula el porcentaje basándose en los datos actuales
     */
    _obtenerPorcentaje() {
        const d = this._datosTemporales;
        const campos = [
            !!d.nombre,
            !!d.descripcion,
            !!d.precio && d.precio > 0,
            !!d.stock,
            this._categoriasSeleccionadas.length > 0,
            !!this._portadaArchivo,
            this._galeriaArchivos.length > 0
        ];
        return Math.round((campos.filter(Boolean).length / campos.length) * 100);
    },

    /**
     * Sincroniza datos y actualiza la UI sin perder el foco
     */
    sync(el, campo) {
        // Guardar el valor
        this._datosTemporales[campo] = el.value;
        
        // Actualizar solo los elementos de progreso del DOM
        const porcentaje = this._obtenerPorcentaje();
        const barra = document.getElementById('progreso-barra');
        const texto = document.getElementById('progreso-texto');
        
        if (barra) barra.style.width = `${porcentaje}%`;
        if (texto) texto.innerText = `${porcentaje}%`;
    },

    _generarTemplate(categorias) {
        const d = this._datosTemporales;
        const porcentaje = this._obtenerPorcentaje();
        const padres = categorias.filter(c => !c.id_padre);
        const hijas = this._categoriaPadreSeleccionada 
            ? categorias.filter(c => c.id_padre === this._categoriaPadreSeleccionada)
            : [];

        return `
        <div class="relative flex flex-col h-[70vh] text-slate-700 font-sans overflow-hidden text-left">
            
            <button onclick="Swal.close()" class="absolute top-0 right-0 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full hover:bg-red-500 hover:text-white transition-all z-50">
                <span class="material-symbols-outlined text-sm">close</span>
            </button>

            <div class="mb-6 pr-10">
                <h2 class="text-xl font-bold text-slate-800 text-left">Registrar Nuevo Producto</h2>
                <p class="text-xs text-slate-500 text-left">Completa la información necesaria.</p>
                
                <div class="mt-4 flex items-center gap-4">
                    <div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div id="progreso-barra" class="h-full bg-blue-600 transition-all duration-500" style="width: ${porcentaje}%"></div>
                    </div>
                    <span id="progreso-texto" class="text-xs font-bold text-blue-600">${porcentaje}%</span>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                
                <div class="${this._pasoActual === 1 ? 'space-y-4' : 'hidden'}">
                    <div class="bg-slate-50 p-6 rounded-2xl space-y-4">
                        <div class="text-left">
                            <label class="text-xs font-bold text-slate-600 block mb-1">Nombre del producto</label>
                            <input type="text" id="p-nombre" value="${d.nombre || ''}" oninput="window.createProduct.sync(this, 'nombre')"
                                placeholder="Ej: Camiseta de Algodón" class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20">
                        </div>
                        <div class="text-left">
                            <label class="text-xs font-bold text-slate-600 block mb-1">Descripción o detalles</label>
                            <textarea id="p-descripcion" rows="3" oninput="window.createProduct.sync(this, 'descripcion')"
                                placeholder="Escribe aquí las características..." class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20">${d.descripcion || ''}</textarea>
                        </div>
                        <div class="grid grid-cols-2 gap-4 text-left">
                            <div>
                                <label class="text-xs font-bold text-slate-600 block mb-1">Precio (Bs.)</label>
                                <input type="number" step="0.01" id="p-precio" value="${d.precio || ''}" oninput="window.createProduct.sync(this, 'precio')"
                                    placeholder="0.00" class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20">
                            </div>
                            <div>
                                <label class="text-xs font-bold text-slate-600 block mb-1">Stock (Unidades)</label>
                                <input type="number" step="1" id="p-stock" value="${d.stock || 0}" oninput="window.createProduct.sync(this, 'stock')"
                                    class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="${this._pasoActual === 2 ? 'block' : 'hidden'}">
                    <div class="grid grid-cols-2 gap-4 h-[350px]">
                        <div class="border border-slate-200 rounded-2xl p-4 overflow-y-auto text-left">
                            <p class="text-[10px] font-bold text-slate-400 uppercase mb-3">1. Sección</p>
                            <div class="space-y-1">
                                ${padres.map(p => `
                                    <button onclick="window.createProduct.seleccionarPadre(${p.id})" 
                                        class="w-full text-left px-4 py-2 rounded-lg text-xs font-bold transition-all ${this._categoriaPadreSeleccionada === p.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'}">
                                        ${p.nombre}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                        <div class="border border-slate-200 rounded-2xl p-4 overflow-y-auto text-left">
                            <p class="text-[10px] font-bold text-slate-400 uppercase mb-3">2. Subcategorías</p>
                            <div class="space-y-1">
                                ${hijas.length ? hijas.map(h => `
                                    <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                                        <input type="checkbox" onchange="window.createProduct.toggleHija(${h.id})" 
                                            ${this._categoriasSeleccionadas.includes(h.id) ? 'checked' : ''} class="w-4 h-4 rounded text-blue-600">
                                        <span class="text-xs">${h.nombre}</span>
                                    </label>
                                `).join('') : '<p class="text-xs text-slate-400 text-center mt-10">Selecciona una sección</p>'}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="${this._pasoActual === 3 ? 'space-y-6' : 'hidden'}">
                    <div class="grid grid-cols-2 gap-6 text-left">
                        <div>
                            <label class="text-xs font-bold text-slate-600 block mb-2">Foto de portada</label>
                            <div class="relative aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden flex items-center justify-center">
                                <input type="file" id="p-archivo-portada" accept="image/*" class="hidden" onchange="window.createProduct.handlePortada(this)">
                                <label for="p-archivo-portada" class="absolute inset-0 cursor-pointer flex flex-col items-center justify-center">
                                    ${this._portadaArchivo ? `<img src="${URL.createObjectURL(this._portadaArchivo)}" class="w-full h-full object-cover">` : '<span class="material-symbols-outlined text-slate-300 text-3xl">add_a_photo</span>'}
                                </label>
                            </div>
                        </div>
                        <div class="space-y-4">
                            <label class="text-xs font-bold text-slate-600 block">Galería adicional</label>
                            <div class="flex gap-2">
                                <label class="bg-blue-600 text-white text-[10px] font-bold px-4 py-2 rounded-xl cursor-pointer">
                                    <input type="file" multiple class="hidden" onchange="window.createProduct.handleGaleria(this)">
                                    SUBIR
                                </label>
                                <input type="text" id="p-enlace-url" placeholder="O pega un enlace..." 
                                    onkeyup="if(event.key==='Enter') window.createProduct.addEnlace()"
                                    class="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/20">
                            </div>
                            <div class="space-y-2 max-h-[150px] overflow-y-auto">
                                ${this._renderListaGaleria()}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
        `;
    },

    // Actualización completa (solo para cambios de fase o de selección de listas)
    actualizarUICompleta() {
        const popup = Swal.getPopup();
        if (popup) {
            const html = this._generarTemplate(window.categoriasRaw || []);
            Swal.update({ html });
        }
    },

    seleccionarPadre(id) {
        this._categoriaPadreSeleccionada = id;
        this.actualizarUICompleta();
    },

    toggleHija(id) {
        if (this._categoriasSeleccionadas.includes(id)) {
            this._categoriasSeleccionadas = this._categoriasSeleccionadas.filter(cid => cid !== id);
        } else {
            this._categoriasSeleccionadas.push(id);
        }
        this.actualizarUICompleta();
    },

    handlePortada(input) {
        if (input.files[0]) {
            this._portadaArchivo = input.files[0];
            this.actualizarUICompleta();
        }
    },

    handleGaleria(input) {
        Array.from(input.files).forEach(file => {
            this._galeriaArchivos.push({
                file: file,
                url: URL.createObjectURL(file),
                nombre: file.name,
                size: (file.size / 1024 / 1024).toFixed(2) + 'MB'
            });
        });
        this.actualizarUICompleta();
    },

    addEnlace() {
        const input = document.getElementById('p-enlace-url');
        if (input?.value) {
            this._galeriaArchivos.push({ file: null, url: input.value, nombre: 'Enlace externo', size: 'URL' });
            input.value = '';
            this.actualizarUICompleta();
        }
    },

    _renderListaGaleria() {
        return this._galeriaArchivos.map((item, index) => `
            <div class="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span class="text-[10px] font-bold text-slate-700 truncate w-3/4">${item.nombre}</span>
                <button onclick="window.createProduct.removeFile(${index})" class="text-red-400 hover:text-red-600"><span class="material-symbols-outlined text-xs">delete</span></button>
            </div>
        `).join('');
    },

    removeFile(index) {
        this._galeriaArchivos.splice(index, 1);
        this.actualizarUICompleta();
    },

    async render(titulo, categorias, dPrevios = {}) {
        window.createProduct = this;
        window.categoriasRaw = categorias; // Guardar para re-renderizado
        this._pasoActual = 1;
        this._datosTemporales = { ...dPrevios };
        this._categoriasSeleccionadas = dPrevios.categoriasIds || [];
        this._galeriaArchivos = [];
        this._portadaArchivo = null;

        let resFinal = null;
        while (this._pasoActual <= 3 && this._pasoActual > 0) {
            const esFin = this._pasoActual === 3;
            const esInicio = this._pasoActual === 1;

            const result = await Swal.fire({
                html: this._generarTemplate(categorias),
                width: '850px',
                showConfirmButton: true,
                showDenyButton: !esInicio,
                showCancelButton: esInicio,
                confirmButtonText: esFin ? 'GUARDAR PRODUCTO' : 'SIGUIENTE',
                denyButtonText: 'VOLVER',
                cancelButtonText: 'CANCELAR',
                confirmButtonColor: '#2563eb',
                denyButtonColor: '#64748b',
                cancelButtonColor: '#94a3b8',
                reverseButtons: true,
                allowOutsideClick: false,
                customClass: { popup: 'rounded-[30px] p-8', confirmButton: 'rounded-xl px-6 py-3 font-bold text-xs', denyButton: 'rounded-xl px-6 py-3 font-bold text-xs', cancelButton: 'rounded-xl px-6 py-3 font-bold text-xs' },
                preConfirm: () => {
                    const data = {
                        ...this._datosTemporales,
                        categoriasIds: this._categoriasSeleccionadas,
                        archivoPortada: this._portadaArchivo,
                        galeriaArchivos: this._galeriaArchivos.map(i => i.file || i.url)
                    };
                    if (this._pasoActual === 1 && (!data.nombre || !data.precio)) {
                        Swal.showValidationMessage('Escribe Nombre y Precio'); return false;
                    }
                    return data;
                }
            });

            if (result.isConfirmed) {
                resFinal = result.value;
                if (esFin) return resFinal;
                this._pasoActual++;
            } else if (result.isDenied) {
                this._pasoActual--;
            } else return null;
        }
    }
};