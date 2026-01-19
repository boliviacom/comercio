export const configuracionColumnasView = {
    /**
     * Paso 2: Genera el buscador de CI
     */
    generarHTMLBuscadorUsuario(rolNombre) {
        return `
            <div class="text-left">
                <p class="text-sm text-slate-600 mb-4">Configurando para el rol: <strong class="text-blue-600 uppercase">${rolNombre}</strong></p>
                <div class="bg-blue-50 p-5 rounded-2xl border border-blue-100 mb-2">
                    <label class="block text-[10px] font-black text-blue-700 uppercase mb-2 tracking-widest">Buscador por Documento (CI)</label>
                    <input type="text" id="swal-input-ci" 
                        class="w-full p-3 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 text-lg font-bold shadow-sm" 
                        placeholder="Ej: 1234567...">
                    <p class="text-[11px] text-slate-500 mt-3 leading-relaxed">
                        <i class="fas fa-info-circle mr-1"></i> 
                        Si desea configurar las columnas para <b>TODOS</b> los usuarios con rol <b>${rolNombre}</b>, deje el campo vacío y presione Siguiente.
                    </p>
                </div>
            </div>
        `;
    },

    /**
     * Paso 3: Genera el selector de checkboxes
     */
    generarHTMLSelector(todas, actuales, destinoNombre) {
        return `
            <div class="text-left mb-4 px-1">
                <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span class="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Configurando: ${destinoNombre}</span>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-2 text-left p-4 border rounded-2xl bg-slate-50 max-h-72 overflow-y-auto custom-scrollbar">
                ${todas.map(col => `
                    <label class="flex items-center gap-3 p-3 bg-white border border-transparent hover:border-blue-200 rounded-xl cursor-pointer transition-all shadow-sm group">
                        <input type="checkbox" value="${col}" 
                            ${actuales.includes(col) ? 'checked' : ''} 
                            class="col-check w-5 h-5 text-blue-600 rounded-lg border-gray-300 focus:ring-blue-500">
                        <span class="text-sm font-bold text-slate-700 capitalize group-hover:text-blue-600">
                            ${col.replace(/_/g, ' ')}
                        </span>
                    </label>
                `).join('')}
            </div>
        `;
    }
};