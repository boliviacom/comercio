// js/views/configuracionFrontendView.js

export const configuracionFrontendView = {
    // 1. Configuración visual (Iconos y colores por categoría)
    mappingCategorias: {
        'colores': { icon: 'palette', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' },
        'tipografia': { icon: 'match_case', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
        'estilos': { icon: 'border_style', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
        'general': { icon: 'settings', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
        'sistema': { icon: 'terminal', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
        'seguridad': { icon: 'shield_lock', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
        'default': { icon: 'tune', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' }
    },

    /**
     * RENDERIZADO PRINCIPAL
     * Limpia el contenedor y construye las secciones por categoría
     */
    renderizarLista(ajustes) {
        const contenedor = document.getElementById('settingsContainer');
        if (!contenedor) return;

        contenedor.innerHTML = ''; 

        // Obtener categorías únicas
        const categorias = [...new Set(ajustes.map(a => a.categoria))];

        categorias.forEach(cat => {
            // Normalizar nombre de categoría para el icono
            const nombreNormalizado = cat ? cat.toLowerCase().trim()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "") : 'general';
            
            const configVisual = this.mappingCategorias[nombreNormalizado] || this.mappingCategorias['default'];

            // Filtrar ajustes de esta categoría y crear sus filas
            const filasHtml = ajustes
                .filter(a => a.categoria === cat)
                .map(a => this.crearFilaConfiguracion(a))
                .join('');

            // Crear el elemento de sección
            const seccion = document.createElement('section');
            seccion.className = "mb-10 animate-in fade-in duration-500"; 
            seccion.innerHTML = `
                <h3 class="text-lg font-semibold text-[#111418] dark:text-white mb-4 flex items-center gap-2 capitalize">
                    <span class="p-1.5 rounded-lg ${configVisual.color}">
                        <span class="material-symbols-outlined text-[20px] block">${configVisual.icon}</span>
                    </span>
                    ${cat}
                </h3>
                <div class="bg-white dark:bg-[#1a222c] border border-[#dbe0e6] dark:border-[#2a3441] rounded-2xl shadow-sm overflow-hidden divide-y divide-[#f0f2f4] dark:divide-[#2a3441]">
                    ${filasHtml}
                </div>
            `;
            contenedor.appendChild(seccion);
        });
    },

    /**
     * TEMPLATE DE FILA
     * Crea el HTML de un solo ajuste
     */
    crearFilaConfiguracion(ajuste) {
        const esColor = /^#[0-9A-F]{6}$/i.test(ajuste.valor_actual);
        
        return `
            <div class="p-5 flex flex-col md:flex-row gap-4 md:items-center justify-between hover:bg-gray-50/50 dark:hover:bg-[#242f3d]/50 transition-colors">
                <div class="md:w-5/12">
                    <label class="block text-sm font-bold text-[#111418] dark:text-white mb-0.5">${ajuste.clave}</label>
                    <p class="text-xs text-[#637588] dark:text-[#9ca3af] leading-relaxed">Configuración para el parámetro ${ajuste.clave.toLowerCase()}.</p>
                </div>
                <div class="md:w-7/12 flex items-center gap-3">
                    <div class="flex items-center gap-2 w-full">
                        ${esColor ? `
                            <div class="relative w-9 h-9 rounded-full overflow-hidden border border-[#dbe0e6] dark:border-[#374151] shadow-inner shrink-0">
                                <input type="color" value="${ajuste.valor_actual}" 
                                    onchange="actualizarClave('${ajuste.clave}', this.value)"
                                    class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] h-[160%] cursor-pointer border-0 p-0">
                            </div>` : ''}
                        <input type="text" value="${ajuste.valor_actual}" 
                            id="input-${ajuste.clave}"
                            class="w-full bg-[#f6f7f8] dark:bg-[#111418] border border-transparent focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 text-sm text-[#111418] dark:text-white font-medium transition-all"
                            onchange="actualizarClave('${ajuste.clave}', this.value)">
                    </div>
                    <button onclick="restaurarClave('${ajuste.clave}')" 
                        class="text-[#637588] hover:text-primary dark:text-[#9ca3af] dark:hover:text-primary transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a3441]" 
                        title="Restaurar Defecto">
                        <span class="material-symbols-outlined text-[20px]">history</span>
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * ACTUALIZACIÓN DE UI SIMPLE
     */
    setTotalAjustes(total) {
        const el = document.getElementById('count-current');
        if (el) el.innerText = total;
    },

    sincronizarInputs(clave, valor) {
        const inputTexto = document.getElementById(`input-${clave}`);
        if (inputTexto) inputTexto.value = valor;
    }
};