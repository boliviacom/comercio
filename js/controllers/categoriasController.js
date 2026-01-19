import { categoriasModel } from '../models/categoriasModel.js';
import { configuracionColumnasController } from './configuracionColumnasController.js';
import { categoriasView } from '../views/categoriasView.js';

export const categoriasController = {
    // Definimos todas las columnas que existen en la tabla física de la DB
    COLUMNAS_TOTALES: ['id', 'nombre', 'visible', 'id_padre'],
    
    // Nombre identificador para la tabla de configuraciones
    TABLA_NOMBRE: 'categoria',

    /**
     * Inicializa la sección de categorías
     */
    async inicializar() {
        try {
            // 1. Obtener preferencias de columnas (desde el controlador de configuración)
            const columnasVisibles = await configuracionColumnasController.obtenerColumnasVisibles(
                this.TABLA_NOMBRE, 
                ['id', 'nombre', 'visible'] // Default si no hay nada guardado
            );

            // 2. Obtener datos de Supabase
            const categorias = await categoriasModel.obtenerTodas();

            // 3. Renderizar la interfaz
            categoriasView.render(categorias, columnasVisibles);

            // 4. Activar los eventos de los botones recién creados
            this._setupEventListeners();

        } catch (error) {
            console.error("Error al inicializar categoriasController:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error de carga',
                text: 'No se pudo sincronizar con la base de datos.'
            });
        }
    },

    /**
     * Configura los eventos de la vista de forma segura
     * @private
     */
    _setupEventListeners() {
        // Botón Configurar Columnas
        const btnConfig = document.getElementById('btn-config-columnas');
        if (btnConfig) {
            btnConfig.onclick = (e) => {
                e.preventDefault();
                this.abrirConfiguracionColumnas();
            };
        }

        // Botón Nueva Categoría
        const btnNuevo = document.getElementById('btn-nueva-categoria');
        if (btnNuevo) {
            btnNuevo.onclick = () => {
                Swal.fire('Próximamente', 'Aquí abriremos el formulario de creación', 'info');
            };
        }
    },

    /**
     * Abre el selector de columnas y recarga al terminar
     */
    async abrirConfiguracionColumnas() {
        await configuracionColumnasController.abrirSelectorColumnas(
            this.TABLA_NOMBRE,
            this.COLUMNAS_TOTALES,
            () => {
                // Callback: Refrescamos la vista completa con las nuevas columnas
                this.inicializar();
            }
        );
    },

    /**
     * Lógica para eliminar una categoría
     */
    async eliminarCategoria(id) {
        const confirmacion = await Swal.fire({
            title: '¿Eliminar categoría?',
            text: "Los productos asociados podrían quedar sin categoría.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (confirmacion.isConfirmed) {
            const resultado = await categoriasModel.eliminar(id);
            if (resultado.exito) {
                Swal.fire('Eliminado', 'Registro borrado con éxito', 'success');
                this.inicializar();
            } else {
                Swal.fire('Error', resultado.mensaje, 'error');
            }
        }
    }
};