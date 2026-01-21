export const configuracionColumnasView = {

    /**
     * Paso 1: Muestra el selector de roles con validación obligatoria
     */
    async solicitarSeleccionRol(roles) {
        const opcionesRoles = {};
        roles.forEach(r => opcionesRoles[r] = `GRUPO: ${r.toUpperCase()}`);

        const svgIcon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E";

        const result = await Swal.fire({
            title: '<span class="text-slate-800 font-black uppercase text-sm">Paso 1: Grupo Base</span>',
            input: 'select',
            inputOptions: opcionesRoles,
            inputPlaceholder: '-- SELECCIONE UN ROL --',
            showCloseButton: true,
            showCancelButton: true,
            confirmButtonText: 'Siguiente',
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
            customClass: {
                popup: 'rounded-[32px] border-none shadow-xl',
                confirmButton: 'rounded-xl px-8 py-3 font-bold text-xs uppercase bg-blue-600',
                cancelButton: 'rounded-xl px-8 py-3 font-bold text-xs uppercase bg-slate-100 text-slate-500',
                input: 'rounded-2xl border-slate-200 text-sm font-semibold p-4',
                closeButton: 'hover:text-red-500 transition-colors focus:outline-none'
            },
            preConfirm: () => {
                const valor = Swal.getInput().value;
                if (!valor) {
                    Swal.showValidationMessage('Debe seleccionar un grupo para continuar');
                    return false;
                }
                return valor;
            },
            didOpen: () => {
                const select = Swal.getInput();
                select.style.appearance = 'none';
                select.style.backgroundImage = `url("${svgIcon}")`;
                select.style.backgroundRepeat = 'no-repeat';
                select.style.backgroundPosition = 'right 1.25rem center';
                select.style.backgroundSize = '1.2rem';
            }
        });

        // Retornamos el valor si confirmó, null si canceló/cerró
        return result.isConfirmed ? result.value : null;
    },

    /**
     * Paso 2: Solicita búsqueda de usuario por CI
     */
    async solicitarBusquedaUsuario(rolNombre) {
        const result = await Swal.fire({
            title: '<span class="text-slate-800 font-black uppercase text-sm">Paso 2: Especificar Usuario</span>',
            html: `
                <div class="text-left">
                    <p class="text-[11px] font-bold text-slate-400 uppercase mb-4 tracking-wider text-center">Configurando para: <span class="text-blue-600">${rolNombre}</span></p>
                    <div class="bg-slate-50 p-5 rounded-[24px] border border-slate-100">
                        <label class="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest ml-1">Documento de Identidad (CI)</label>
                        <input type="text" id="swal-input-ci" 
                            class="w-full p-4 rounded-2xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 text-lg font-bold shadow-sm outline-none transition-all" 
                            placeholder="Ej: 8443210">
                        <div class="flex gap-2 mt-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                            <span class="material-symbols-outlined text-blue-500 text-lg">info</span>
                            <p class="text-[10px] text-slate-500 leading-tight font-medium">
                                Deje vacío y presione siguiente si desea aplicar la configuración a <b>TODOS</b> los usuarios del grupo.
                            </p>
                        </div>
                    </div>
                </div>`,
            showCloseButton: true,
            showCancelButton: true,
            confirmButtonText: 'Siguiente',
            cancelButtonText: 'Volver',
            reverseButtons: true,
            preConfirm: () => document.getElementById('swal-input-ci').value.trim(),
            customClass: {
                popup: 'rounded-[32px] border-none shadow-xl',
                confirmButton: 'rounded-xl px-8 py-3 font-bold text-xs uppercase bg-blue-600',
                cancelButton: 'rounded-xl px-8 py-3 font-bold text-xs uppercase bg-slate-100 text-slate-500',
                closeButton: 'hover:text-red-500 transition-colors focus:outline-none'
            }
        });

        if (result.isConfirmed) return result.value;
        if (result.dismiss === Swal.DismissReason.cancel) return 'BACK'; // Retorno especial para ir atrás
        return null;
    },

    /**
     * Paso 3: Selector de Checkboxes
     */
    async solicitarConfiguracionColumnas(todas, actuales, destinoNombre) {
        const result = await Swal.fire({
            title: '<span class="text-slate-800 font-black uppercase text-sm">Paso 3: Visibilidad</span>',
            html: `
                <div class="text-left mb-4 px-1 flex items-center justify-center">
                    <div class="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span class="text-[10px] text-emerald-700 font-black uppercase tracking-wider">${destinoNombre}</span>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-3 text-left p-4 border border-slate-100 rounded-[24px] bg-slate-50/50 max-h-80 overflow-y-auto custom-scrollbar">
                    ${todas.map(col => `
                        <label class="flex items-center gap-3 p-3 bg-white border border-slate-100 hover:border-blue-200 rounded-2xl cursor-pointer transition-all shadow-sm group">
                            <input type="checkbox" value="${col}" 
                                ${actuales.includes(col) ? 'checked' : ''} 
                                class="col-check w-5 h-5 text-blue-600 rounded-lg border-slate-300 focus:ring-blue-500 transition-all">
                            <span class="text-[11px] font-bold text-slate-600 uppercase group-hover:text-blue-600">
                                ${col.replace(/_/g, ' ')}
                            </span>
                        </label>
                    `).join('')}
                </div>`,
            showCloseButton: true,
            showCancelButton: true,
            confirmButtonText: 'Revisar Guardado',
            cancelButtonText: 'Atrás',
            reverseButtons: true,
            preConfirm: () => {
                const checked = document.querySelectorAll('.col-check:checked');
                const seleccionados = Array.from(checked).map(cb => cb.value);
                if (seleccionados.length === 0) {
                    Swal.showValidationMessage('Debe seleccionar al menos una columna');
                    return false;
                }
                return seleccionados;
            },
            customClass: {
                popup: 'rounded-[32px] border-none shadow-2xl w-[600px]',
                confirmButton: 'rounded-xl px-8 py-3 font-bold text-xs uppercase bg-blue-600',
                cancelButton: 'rounded-xl px-8 py-3 font-bold text-xs uppercase bg-slate-100 text-slate-500',
                closeButton: 'hover:text-red-500 transition-colors focus:outline-none'
            }
        });

        if (result.isConfirmed) return result.value;
        if (result.dismiss === Swal.DismissReason.cancel) return 'BACK'; // Retorno especial para ir atrás
        return null;
    },

    /**
     * Confirmación Final 
     */
    async confirmarGuardadoFinal(nombre) {
        const result = await Swal.fire({
            title: '<span class="text-slate-800 font-black uppercase text-sm">¿Confirmar Cambios?</span>',
            text: `Se aplicará este diseño de columnas a: ${nombre.toUpperCase()}`,
            icon: 'question',
            showCloseButton: true,
            showCancelButton: true,
            confirmButtonText: 'Sí, aplicar ahora',
            cancelButtonText: 'Revisar de nuevo',
            confirmButtonColor: '#10b981',
            reverseButtons: true,
            customClass: {
                popup: 'rounded-[32px] border-none shadow-xl',
                confirmButton: 'rounded-xl px-8 py-3 font-bold text-xs uppercase',
                cancelButton: 'rounded-xl px-8 py-3 font-bold text-xs uppercase bg-slate-100 text-slate-500',
                closeButton: 'hover:text-red-500 transition-colors focus:outline-none'
            }
        });

        if (result.isConfirmed) return true;
        if (result.dismiss === Swal.DismissReason.cancel) return 'BACK'; // Permite volver al selector de checkboxes
        return false;
    },

    /**
     * Feedback de error con opción de volver al paso anterior
     */
    async notificarUsuarioNoEncontrado(ci, rol) {
        const result = await Swal.fire({
            icon: 'warning',
            title: '<span class="text-amber-600 font-black uppercase text-sm">Usuario no encontrado</span>',
            text: `No existe un usuario con CI "${ci}" en el grupo "${rol}".`,
            showCloseButton: true,
            showCancelButton: true,
            confirmButtonText: 'Configurar Rol Completo',
            cancelButtonText: 'Intentar de nuevo',
            reverseButtons: true,
            customClass: {
                popup: 'rounded-[32px]',
                confirmButton: 'rounded-xl px-8 py-3 font-bold text-xs uppercase bg-blue-600',
                cancelButton: 'rounded-xl px-8 py-3 font-bold text-xs uppercase bg-slate-100 text-slate-500'
            }
        });

        // Si confirma, el controlador aplicará al rol. Si cancela (Intentar de nuevo), volverá al paso 2.
        if (result.isConfirmed) return 'APPLY_ROLE';
        if (result.dismiss === Swal.DismissReason.cancel) return 'BACK';
        return null;
    },

    // --- Métodos de notificación sin cambios ---
    mostrarCargando(msg = 'Cargando...') {
        Swal.fire({
            title: '<span class="text-slate-800 font-black uppercase text-sm">Procesando</span>',
            text: msg,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
            customClass: { popup: 'rounded-[32px]' }
        });
    },

    notificarExito(msg) {
        Swal.fire({
            icon: 'success',
            title: '<span class="text-slate-800 font-black uppercase text-sm">¡Hecho!</span>',
            text: msg,
            timer: 2000,
            showConfirmButton: false,
            customClass: { popup: 'rounded-[32px]' }
        });
    },

    notificarError(msg) {
        Swal.fire({
            icon: 'error',
            title: '<span class="text-red-600 font-black uppercase text-sm">Error</span>',
            text: msg,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#2563eb',
            customClass: { popup: 'rounded-[32px]' }
        });
    }
};