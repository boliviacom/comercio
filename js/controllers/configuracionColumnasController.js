import { configuracionColumnasModel } from '../models/configuracionColumnasModel.js';
import { usuariosModel } from '../models/usuariosModel.js';
import { configuracionColumnasView } from '../views/configuracionColumnasView.js';

export const configuracionColumnasController = {

    /**
     * Obtiene las columnas visibles consultando el modelo.
     */
    obtenerColumnasVisibles: async function (tablaNombre, columnasPorDefecto) {
        try {
            const session = JSON.parse(localStorage.getItem('usuario_geek'));
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
     * Maneja el flujo lógico de la configuración con soporte para navegación atrás
     */
    abrirSelectorColumnas: async function (tablaNombre, todasLasColumnas, callbackRecargar) {
        let paso = 1;
        let rolSeleccionado = null;
        let ciIngresado = "";
        let usuarioDestino = null;
        let nombreVisualDestino = "";
        let seleccionadas = null;

        try {
            const { roles } = await usuariosModel.obtenerDestinosConfiguracion();

            while (paso > 0 && paso <= 4) {
                // --- PASO 1: SELECCIÓN DE ROL ---
                if (paso === 1) {
                    rolSeleccionado = await configuracionColumnasView.solicitarSeleccionRol(roles);
                    if (!rolSeleccionado) return; // Cerrar flujo
                    paso = 2;
                }

                // --- PASO 2: ESPECIFICAR USUARIO ---
                if (paso === 2) {
                    ciIngresado = await configuracionColumnasView.solicitarBusquedaUsuario(rolSeleccionado);
                    
                    if (ciIngresado === 'BACK') { paso = 1; continue; }
                    if (ciIngresado === null) return;

                    usuarioDestino = null;
                    nombreVisualDestino = `ROL: ${rolSeleccionado.toUpperCase()}`;

                    if (ciIngresado !== "") {
                        configuracionColumnasView.mostrarCargando();
                        const todosLosUsuarios = await usuariosModel.obtenerTodos();
                        usuarioDestino = todosLosUsuarios.find(u => u.ci === ciIngresado && u.rol === rolSeleccionado);
                        Swal.close();

                        if (!usuarioDestino) {
                            const respuestaError = await configuracionColumnasView.notificarUsuarioNoEncontrado(ciIngresado, rolSeleccionado);
                            // respuestaError es true si el usuario decide "Intentar de nuevo" (cancelar el aviso de error)
                            if (respuestaError) { 
                                paso = 2; continue; 
                            } else {
                                // El usuario eligió "Configurar Rol Completo"
                                ciIngresado = "";
                                usuarioDestino = null;
                            }
                        } else {
                            nombreVisualDestino = `${usuarioDestino.apellido_paterno} ${usuarioDestino.nombres} (${usuarioDestino.ci})`;
                        }
                    }
                    paso = 3;
                }

                // --- PASO 3: CONFIGURAR COLUMNAS ---
                if (paso === 3) {
                    const actuales = await configuracionColumnasModel.obtenerConfiguracion(
                        tablaNombre, 
                        usuarioDestino ? usuarioDestino.id : null, 
                        !usuarioDestino ? rolSeleccionado : null
                    ) || todasLasColumnas;

                    seleccionadas = await configuracionColumnasView.solicitarConfiguracionColumnas(
                        todasLasColumnas, 
                        actuales, 
                        nombreVisualDestino
                    );

                    if (seleccionadas === 'BACK') { paso = 2; continue; }
                    if (!seleccionadas) return;
                    paso = 4;
                }

                // --- PASO 4: CONFIRMACIÓN FINAL ---
                if (paso === 4) {
                    const estaConfirmado = await configuracionColumnasView.confirmarGuardadoFinal(nombreVisualDestino);

                    if (estaConfirmado === 'BACK') { paso = 3; continue; }
                    if (!estaConfirmado) return;

                    // Proceso de guardado real
                    configuracionColumnasView.mostrarCargando('Guardando configuración...');
                    
                    const res = await configuracionColumnasModel.guardarConfiguracion({
                        tabla_nombre: tablaNombre,
                        columnas_visibles: seleccionadas,
                        usuario_id: usuarioDestino ? usuarioDestino.id : null,
                        rol_id: !usuarioDestino ? rolSeleccionado : null
                    });

                    if (res.exito) {
                        configuracionColumnasView.notificarExito('Permisos actualizados correctamente');
                        if (callbackRecargar) callbackRecargar(seleccionadas);
                        break; // Finaliza el bucle con éxito
                    } else {
                        configuracionColumnasView.notificarError(res.mensaje);
                        return;
                    }
                }
            }

        } catch (error) {
            console.error("Error en configuracionColumnasController:", error);
            configuracionColumnasView.notificarError('No se pudo cargar el flujo de configuración');
        }
    }
};