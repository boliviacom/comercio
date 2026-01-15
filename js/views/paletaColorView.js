// js/views/paletaColorView.js

export const paletaColorView = {
    
    /**
     * Renderiza la cuadrícula de paletas en el contenedor principal
     */
    renderizarLista(paletas) {
        const contenedor = document.getElementById('paletasContainer');
        if (!contenedor) return;

        if (!paletas || paletas.length === 0) {
            contenedor.innerHTML = `
                <div class="col-span-full text-center py-12 bg-gray-50 dark:bg-[#111418] rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                    <span class="material-symbols-outlined text-gray-400 text-5xl mb-3">palette</span>
                    <p class="text-[#637588]">No hay paletas configuradas. Crea la primera para empezar.</p>
                </div>`;
            return;
        }

        contenedor.innerHTML = paletas.map(p => this.crearTarjetaPaleta(p)).join('');
    },

    /**
     * Genera el HTML de una tarjeta individual
     */
    crearTarjetaPaleta(paleta) {
        const isActive = paleta.es_activa;
        
        return `
            <div class="group relative bg-white dark:bg-[#1a222c] border ${isActive ? 'border-primary ring-2 ring-primary/20' : 'border-[#dbe0e6] dark:border-[#2a3441]'} rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h4 class="font-bold text-[#111418] dark:text-white flex items-center gap-2">
                            ${paleta.nombre}
                            ${isActive ? '<span class="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">ACTIVA</span>' : ''}
                        </h4>
                        <p class="text-[11px] text-[#637588] dark:text-[#9ca3af]">ID: ${paleta.id}</p>
                    </div>
                    
                    <button onclick="handleEliminarPaleta(${paleta.id})" class="opacity-0 group-hover:opacity-100 p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all">
                        <span class="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                </div>

                <div class="flex items-center gap-2 mb-6">
                    ${this.renderCircle(paleta.color_primary, 'Primary')}
                    ${this.renderCircle(paleta.color_secondary, 'Secondary')}
                    ${this.renderCircle(paleta.color_accent, 'Accent')}
                    ${this.renderCircle(paleta.color_bg, 'BG')}
                    ${this.renderCircle(paleta.color_surface, 'Surface')}
                    ${this.renderCircle(paleta.color_text, 'Text')}
                </div>

                ${!isActive ? `
                    <button onclick="handleActivarPaleta(${paleta.id})" 
                        class="w-full py-2.5 px-4 bg-[#f0f2f4] dark:bg-[#2a3441] hover:bg-primary hover:text-white dark:hover:bg-primary text-[#111418] dark:text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                        <span class="material-symbols-outlined text-[18px]">check_circle</span>
                        Aplicar Paleta
                    </button>
                ` : `
                    <div class="w-full py-2.5 px-4 border-2 border-primary/30 text-primary text-xs font-bold rounded-xl flex items-center justify-center gap-2 bg-primary/5">
                        <span class="material-symbols-outlined text-[18px]">verified</span>
                        En uso
                    </div>
                `}
            </div>
        `;
    },

    /**
     * Renderiza los círculos de colores con tooltip
     */
    renderCircle(hex, label) {
        const color = hex || '#e5e7eb';
        return `
            <div class="group/color relative">
                <div class="w-8 h-8 rounded-full border border-black/5 dark:border-white/10 shadow-sm transition-transform hover:scale-125" 
                     style="background-color: ${color}" 
                     title="${label}: ${color}">
                </div>
            </div>
        `;
    },

    /**
     * Inyecta el HTML del formulario y activa la lógica bidireccional
     */
    mostrarFormularioCreacion(html) {
        const modal = document.getElementById('modalNuevaPaleta');
        if (!modal) return;

        modal.innerHTML = html;
        modal.classList.remove('hidden');
        
        // Activamos la sincronización inmediata de los inputs
        this.activarSincronizacionColores();
    },

    /**
     * Lógica de Sincronización Bidireccional:
     * 1. Si mueves el selector de color -> Cambia el texto Hex.
     * 2. Si escribes un Hex -> Cambia el selector de color.
     */
    activarSincronizacionColores() {
        const form = document.getElementById('formNuevaPaleta');
        if (!form) return;

        const colorPickers = form.querySelectorAll('.color-picker');
        const hexInputs = form.querySelectorAll('.hex-input');

        // Sincronización: Selector Visual -> Input Texto
        colorPickers.forEach(picker => {
            picker.addEventListener('input', (e) => {
                const targetName = e.target.getAttribute('data-for');
                const textInput = form.querySelector(`input[name="${targetName}"]`);
                if (textInput) {
                    textInput.value = e.target.value.toUpperCase();
                }
            });
        });

        // Sincronización: Input Texto -> Selector Visual
        hexInputs.forEach(textInput => {
            textInput.addEventListener('input', (e) => {
                let valor = e.target.value;
                
                // Asegurar que comience con #
                if (valor.length > 0 && !valor.startsWith('#')) {
                    valor = '#' + valor;
                    e.target.value = valor;
                }

                // Validar formato Hexadecimal (3 o 6 caracteres)
                const esHexValido = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(valor);
                
                if (esHexValido) {
                    const picker = form.querySelector(`input[data-for="${e.target.name}"]`);
                    if (picker) {
                        picker.value = valor;
                    }
                }
            });
        });
    },

    /**
     * Oculta el modal y limpia su contenido
     */
    cerrarModal() {
        const modal = document.getElementById('modalNuevaPaleta');
        if (modal) {
            modal.classList.add('hidden');
            modal.innerHTML = '';
        }
    }
};