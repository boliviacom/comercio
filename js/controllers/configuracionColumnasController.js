import { configuracionColumnasModel } from '../models/configuracionColumnasModel.js';
import { usuariosModel } from '../models/usuariosModel.js';
import { configuracionColumnasView } from '../views/configuracionColumnasView.js';

export const configuracionColumnasController = {

    /**
     * Obtiene las columnas visibles para el usuario actual.
     * Es la función que te faltaba y que causa el error en categoriasController.
     */
    obtenerColumnasVisibles: async function (tablaNombre, columnasPorDefecto) {
        try {
            // Aquí debes obtener el usuario de tu sistema de sesión (ej. localStorage o Auth)
            const session = JSON.parse(localStorage.getItem('usuario_geek')); // Ajusta según tu app
            const usuarioId = session?.id || null;
            const rolId = session?.rol || null;

            const configuracion = await configuracionColumnasModel.obtenerConfiguracion(
                tablaNombre,
                usuarioId,
                rolId
            );

            return configuracion || columnasPorDefecto;
        } catch (error) {
            console.error("Error al obtener columnas visibles:", error);
            return columnasPorDefecto;
        }
    },

    /**
     * Flujo de configuración para el Owner
     */
    abrirSelectorColumnas: async function (tablaNombre, todasLasColumnas, callbackRecargar) {
        try {
            // --- PASO 1: SELECCIÓN DE ROL ---
            const { roles } = await usuariosModel.obtenerDestinosConfiguracion();
            const opcionesRoles = {};
            roles.forEach(r => opcionesRoles[r] = `GRUPO: ${r.toUpperCase()}`);

            const { value: rolSeleccionado } = await Swal.fire({
                title: 'Paso 1: Grupo Base',
                input: 'select',
                inputOptions: opcionesRoles,
                inputPlaceholder: 'Seleccione un rol...',
                showCancelButton: true,
                confirmButtonText: 'Siguiente <i class="fas fa-arrow-right ml-1"></i>',
                confirmButtonColor: '#3b82f6',
                cancelButtonText: 'Cancelar'
            });

            if (!rolSeleccionado) return;

            // --- PASO 2: BUSCADOR POR CI ---
            const { value: ciIngresado } = await Swal.fire({
                title: 'Paso 2: Especificar Usuario',
                html: configuracionColumnasView.generarHTMLBuscadorUsuario(rolSeleccionado),
                showCancelButton: true,
                confirmButtonText: 'Siguiente <i class="fas fa-arrow-right ml-1"></i>',
                preConfirm: () => document.getElementById('swal-input-ci').value.trim()
            });

            if (ciIngresado === undefined) return;

            let usuarioDestino = null;
            let nombreVisualDestino = `ROL: ${rolSeleccionado.toUpperCase()}`;

            if (ciIngresado !== "") {
                Swal.showLoading();
                const todosLosUsuarios = await usuariosModel.obtenerTodos();
                usuarioDestino = todosLosUsuarios.find(u => u.ci === ciIngresado && u.rol === rolSeleccionado);

                if (!usuarioDestino) {
                    const errorRes = await Swal.fire({
                        icon: 'warning',
                        title: 'Usuario no encontrado',
                        text: `No existe un usuario con CI "${ciIngresado}" que sea "${rolSeleccionado}".`,
                        showCancelButton: true,
                        confirmButtonText: 'Configurar Rol Completo',
                        cancelButtonText: 'Intentar de nuevo'
                    });
                    
                    // CORRECCIÓN: Llamamos al objeto directamente en lugar de usar 'this'
                    if (errorRes.isDismissed) return configuracionColumnasController.abrirSelectorColumnas(tablaNombre, todasLasColumnas, callbackRecargar);
                } else {
                    nombreVisualDestino = `${usuarioDestino.apellido_paterno} ${usuarioDestino.nombres} (${usuarioDestino.ci})`;
                }
            }

            // --- PASO 3: CONFIGURAR COLUMNAS ---
            const actuales = await configuracionColumnasModel.obtenerConfiguracion(
                tablaNombre, 
                usuarioDestino ? usuarioDestino.id : null, 
                !usuarioDestino ? rolSeleccionado : null
            ) || todasLasColumnas;

            const { value: seleccionadas } = await Swal.fire({
                title: 'Paso 3: Visibilidad',
                html: configuracionColumnasView.generarHTMLSelector(todasLasColumnas, actuales, nombreVisualDestino),
                showCancelButton: true,
                confirmButtonText: 'Revisar Guardado',
                confirmButtonColor: '#3b82f6',
                preConfirm: () => {
                    const checked = document.querySelectorAll('.col-check:checked');
                    return Array.from(checked).map(cb => cb.value);
                }
            });

            if (!seleccionadas) return;

            // --- PASO 4: CONFIRMACIÓN FINAL ---
            const confirmacion = await Swal.fire({
                title: '¿Seguro de guardar?',
                text: `Se aplicará este diseño de columnas a: ${nombreVisualDestino}.`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Sí, aplicar cambios',
                confirmButtonColor: '#10b981',
                cancelButtonText: 'Volver'
            });

            if (confirmacion.isConfirmed) {
                const res = await configuracionColumnasModel.guardarConfiguracion({
                    tabla_nombre: tablaNombre,
                    columnas_visibles: seleccionadas,
                    usuario_id: usuarioDestino ? usuarioDestino.id : null,
                    rol_id: !usuarioDestino ? rolSeleccionado : null
                });

                if (res.exito) {
                    Swal.fire('¡Éxito!', 'Permisos actualizados correctamente', 'success');
                    // Ejecuta el callback para refrescar la tabla en el controlador de origen
                    if (callbackRecargar) callbackRecargar(seleccionadas);
                } else {
                    Swal.fire('Error', res.mensaje, 'error');
                }
            }

        } catch (error) {
            console.error("Error en configuracionColumnasController:", error);
            Swal.fire('Error crítico', 'No se pudo cargar el flujo de configuración', 'error');
        }
    }
};