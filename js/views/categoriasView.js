export const categoriasView = {
    /**
     * Renderiza la estructura principal de la sección de categorías
     */
    render(datos, columnasVisibles) {
        const contenedor = document.getElementById('content-area');
        if (!contenedor) return;

        // Limpieza de área y scroll al inicio
        contenedor.innerHTML = '';
        contenedor.scrollTop = 0;

        const html = `
            <div class="p-8 animate-fade-in">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 class="text-2xl font-bold text-slate-800">Gestión de Categorías</h1>
                        <p class="text-slate-500 text-sm">Administra las clasificaciones de tus productos.</p>
                    </div>
                    
                    <div class="flex items-center gap-3">
                        <button id="btn-config-columnas" 
                            class="flex items-center gap-2 p-2.5 text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                            <span class="material-symbols-outlined text-[22px]">view_column</span>
                            <span class="text-sm font-medium text-slate-600">Columnas</span>
                        </button>
                        
                        <button id="btn-nueva-categoria" 
                            class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-100 font-medium text-sm">
                            <span class="material-symbols-outlined text-[20px]">add</span>
                            Nueva Categoría
                        </button>
                    </div>
                </div>

                <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-slate-50/50 border-b border-slate-200">
                                    <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">#</th>
                                    ${columnasVisibles.map(col => `
                                        <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                            ${col.replace(/_/g, ' ')}
                                        </th>
                                    `).join('')}
                                    <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                ${datos.length > 0 
                                    ? datos.map((cat, index) => this._crearFila(cat, columnasVisibles, index)).join('')
                                    : `<tr><td colspan="${columnasVisibles.length + 2}" class="px-6 py-10 text-center text-slate-400 italic text-sm">No se encontraron registros</td></tr>`
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        contenedor.innerHTML = html;
    },

    /**
     * Crea el HTML para una fila individual
     */
    _crearFila(categoria, columnasVisibles, index) {
        return `
            <tr class="hover:bg-slate-50/80 transition-colors group">
                <td class="px-6 py-4 text-sm text-slate-400 font-medium">${index + 1}</td>
                
                ${columnasVisibles.map(col => {
                    const valor = categoria[col];
                    return `<td class="px-6 py-4 text-sm text-slate-600">${this._formatearCelda(col, valor)}</td>`;
                }).join('')}

                <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="console.log('Editar ID: ${categoria.id}')" 
                            class="p-1.5 hover:bg-blue-50 hover:text-blue-600 text-slate-400 rounded-lg transition-colors">
                            <span class="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onclick="console.log('Eliminar ID: ${categoria.id}')" 
                            class="p-1.5 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded-lg transition-colors">
                            <span class="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    },

    /**
     * Formateador de celdas según tipo de dato
     */
    _formatearCelda(columna, valor) {
        if (valor === null || valor === undefined) return '<span class="text-slate-300">-</span>';

        if (columna === 'visible') {
            return valor 
                ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase">Público</span>'
                : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">Oculto</span>';
        }

        if (columna === 'id_padre') {
            return `<span class="text-[11px] font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">ID: ${valor}</span>`;
        }

        return valor;
    }
};