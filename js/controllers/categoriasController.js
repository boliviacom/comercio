import { categoriasModel } from '../models/categoriasModel.js';
import { configuracionColumnasController } from './configuracionColumnasController.js';
import { categoriasView } from '../views/categoriasView.js';

export const categoriasController = {
    COLUMNAS_PADRES: ['id', 'nombre', 'visible'],
    COLUMNAS_HIJOS: ['id', 'nombre', 'categoria_padre', 'visible'],
    REF_PADRES: 'categorias_padre',
    REF_HIJOS: 'subcategorias',

    // --- PROPIEDADES DE ESTADO (Caché en memoria) ---
    _datosPadres: [],
    _datosHijos: [],
    _colsPadres: [],
    _colsHijos: [],

    /**
     * Inicialización completa: Carga datos de la BD y columnas de configuración.
     */
    async inicializar(pestanaPorDefecto = 'categorias') {
        try {
            Swal.showLoading();

            // 1. Cargar configuración de columnas
            this._colsPadres = await configuracionColumnasController.obtenerColumnasVisibles(this.REF_PADRES, ['nombre']);
            this._colsHijos = await configuracionColumnasController.obtenerColumnasVisibles(this.REF_HIJOS, ['nombre', 'categoria_padre']);

            // 2. Cargar datos desde el modelo
            const todas = await categoriasModel.obtenerTodas();
            this._datosPadres = todas.filter(c => !c.id_padre);
            this._datosHijos = todas.filter(c => c.id_padre);

            // 3. Renderizar por primera vez
            this.refrescarVista();

            // 4. Manejo de pestañas
            if (pestanaPorDefecto === 'subcategorias') {
                this.activarPestanaSubcategorias();
            }

            Swal.close();
        } catch (error) {
            console.error("Error al inicializar:", error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar los datos.' });
        }
    },

    /**
     * MÉTODO OPTIMIZADO: Refresca la interfaz sin recargar datos de la BD.
     * Esencial para que el buscador funcione con fluidez.
     */
    refrescarVista() {
        // Le pasamos los datos en memoria a la vista. 
        // La vista se encargará de filtrar por "this._estado.busqueda" internamente.
        categoriasView.render(
            this._datosPadres, 
            this._colsPadres, 
            this._datosHijos, 
            this._colsHijos
        );
        
        // Re-vinculamos los eventos que se pierden al sobreescribir el innerHTML
        this._setupEventListeners();
        this._setupTabLogic();
    },

    /**
     * ACCIÓN: VER
     */
    async verDetalle(id) {
        const registro = await categoriasModel.obtenerPorId(id);
        if (registro) {
            categoriasView.mostrarDetalle(registro);
        }
    },

    /**
     * ACCIÓN: ELIMINAR
     */
    async eliminarRegistro(id) {
        const res = await categoriasModel.eliminar(id);
        if (res.exito) {
            Swal.fire({ title: '¡Eliminado!', icon: 'success', timer: 1000, showConfirmButton: false });
            // Aquí sí reinicializamos para obtener la lista actualizada de la BD
            this.inicializar(); 
        } else {
            Swal.fire('Error', res.mensaje, 'error');
        }
    },

    /**
     * ACCIÓN: CREAR
     */
    async mostrarFormularioCreacion(tipo) {
        // Usamos los padres que ya tenemos en memoria
        const datos = await categoriasView.mostrarFormulario({
            titulo: tipo === 'padre' ? 'Nueva Categoría Principal' : 'Nueva Subcategoría',
            categoriasPadre: tipo === 'hijo' ? this._datosPadres : []
        });

        if (datos) {
            const res = await categoriasModel.crear(datos);
            if (res.exito) {
                this.inicializar();
                Swal.fire('Guardado', 'Registro creado con éxito', 'success');
            }
        }
    },

    /**
     * ACCIÓN: EDITAR
     */
    async editar(id) {
        const registro = await categoriasModel.obtenerPorId(id);
        const padresDisponibles = this._datosPadres.filter(c => c.id !== id);

        const nuevosDatos = await categoriasView.mostrarFormulario({
            titulo: 'Editar Registro',
            nombre: registro.nombre,
            id_padre: registro.id_padre,
            categoriasPadre: registro.id_padre ? padresDisponibles : []
        });

        if (nuevosDatos) {
            const res = await categoriasModel.actualizar(id, nuevosDatos);
            if (res.exito) {
                this.inicializar();
                Swal.fire('Actualizado', 'Los cambios se han guardado', 'success');
            }
        }
    },

    // --- LÓGICA DE INTERFAZ Y EVENTOS ---

    activarPestanaSubcategorias() {
        const btnSub = document.getElementById('tab-subcategorias');
        const btnCat = document.getElementById('tab-categorias');
        const secSub = document.getElementById('seccion-subcategorias');
        const secCat = document.getElementById('seccion-categorias');
        if (btnSub && secSub) {
            this._ejecutarCambioVisualPestana(btnSub, btnCat, secSub, secCat);
        }
    },

    _setupTabLogic() {
        const btnCat = document.getElementById('tab-categorias');
        const btnSub = document.getElementById('tab-subcategorias');
        const secCat = document.getElementById('seccion-categorias');
        const secSub = document.getElementById('seccion-subcategorias');
        
        if (!btnCat || !btnSub) return;

        btnCat.onclick = () => this._ejecutarCambioVisualPestana(btnCat, btnSub, secCat, secSub);
        btnSub.onclick = () => this._ejecutarCambioVisualPestana(btnSub, btnCat, secSub, secCat);
    },

    _ejecutarCambioVisualPestana(activeBtn, inactiveBtn, showSec, hideSec) {
        activeBtn.classList.add('bg-white', 'text-blue-600', 'shadow-sm', 'active');
        activeBtn.classList.remove('text-slate-500');
        inactiveBtn.classList.remove('bg-white', 'text-blue-600', 'shadow-sm', 'active');
        inactiveBtn.classList.add('text-slate-500');
        showSec.classList.remove('hidden');
        hideSec.classList.add('hidden');
    },

    _setupEventListeners() {
        // Usamos addEventListener para evitar conflictos si se llama varias veces
        const configCat = document.getElementById('btn-config-cat');
        const nuevaCat = document.getElementById('btn-nueva-cat');
        const configSub = document.getElementById('btn-config-sub');
        const nuevaSub = document.getElementById('btn-nueva-sub');

        if (configCat) configCat.onclick = () => this.abrirConfiguracionColumnas(this.REF_PADRES, this.COLUMNAS_PADRES);
        if (nuevaCat) nuevaCat.onclick = () => this.mostrarFormularioCreacion('padre');
        if (configSub) configSub.onclick = () => this.abrirConfiguracionColumnas(this.REF_HIJOS, this.COLUMNAS_HIJOS);
        if (nuevaSub) nuevaSub.onclick = () => this.mostrarFormularioCreacion('hijo');
    },

    async abrirConfiguracionColumnas(tablaRef, columnasTotales) {
        await configuracionColumnasController.abrirSelectorColumnas(tablaRef, columnasTotales, () => this.inicializar());
    }
};

window.categoriasController = categoriasController;