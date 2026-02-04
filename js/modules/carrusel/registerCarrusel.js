import { carruselState } from './carruselState.js';
import { carruselTemplates } from './carruselTemplates.js';
import { carruselActions } from './carruselActions.js';

export const RegisterCarrusel = {
    _container: null,
    _originalContent: null,
    _isEdit: false,

    /**
     * Punto de entrada principal
     */
    async init(containerId, data = null) {
        this._container = document.getElementById(containerId);
        this._originalContent = this._container.innerHTML;
        this._isEdit = !!data;

        // Inicializamos el estado con los datos o vacío
        carruselState.init(data?.id || null, data);

        // --- ACTUALIZACIÓN CRÍTICA ---
        // Exponemos las acciones al objeto global window para que el HTML las reconozca
        window.carruselActions = carruselActions;
        window.RegisterCarrusel = this;

        this.updateUI();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    /**
     * Refresca la pantalla basándose en el estado actual
     */
    updateUI() {
        this._container.innerHTML = carruselTemplates.renderMain(
            this._isEdit,
            carruselState._paso,
            carruselState.config,
            carruselState.items
        );
    },

    // --- NAVEGACIÓN ---

    cambiarPaso(n) {
        carruselState._paso = n;
        this.updateUI();
    },

    irAPaso2() {
        if (carruselActions.validarPaso1()) {
            this.cambiarPaso(2);
        }
    },

    // --- ACCIONES DE CONFIGURACIÓN ---

    cambiarTipo(tipo) {
        const cambio = carruselState.setTipo(tipo);
        if (cambio) {
            this.updateUI();
        }
    },

    // --- ACCIONES DE BUSQUEDA (NUEVO) ---

    /**
     * Conecta el input del template con la lógica de búsqueda de Actions
     */
    buscarEnCatalogo(termino) {
        carruselActions.buscarRelacionados(termino);
    },

    // --- ACCIONES DE ITEMS ---

    previsualizarMediaLocal(input) {
        carruselActions.previsualizarMediaLocal(input);
    },

    pedirUrlImagen() {
        carruselActions.pedirUrlImagen();
    },

    agregarItemALista() {
        const nuevoItem = carruselActions.capturarItem();
        if (nuevoItem) {
            carruselState.agregarOActualizarItem(nuevoItem);
            
            // Si el tipo no es banner, limpiamos el buscador tras añadir
            if (carruselState.config.tipo !== 'banners') {
                carruselActions.limpiarBuscadorRapido();
            }
            
            this.updateUI();
        }
    },

    cargarItemParaEditar(idx) {
        const item = carruselState.items[idx];
        carruselState._editingItemIdx = idx;

        const formContainer = document.getElementById('form_item_container');
        if (formContainer) {
            formContainer.innerHTML = carruselTemplates.renderFormItem(carruselState.config.tipo, item);
        }
    },

    cancelarEdicionItem() {
        carruselState._editingItemIdx = null;
        this.updateUI();
    },

    quitarItem(idx) {
        carruselState.items.splice(idx, 1);
        this.updateUI();
    },

    reordenar(idx, direccion) {
        if (carruselState.reordenarItems(idx, direccion)) {
            this.updateUI();
        }
    },

    cambiarSlide(dir) {
        const total = carruselState.items.length;
        if (total === 0) return;
        
        carruselState._slideActivo = (carruselState._slideActivo + dir + total) % total;

        const previewContainer = document.getElementById('live_preview_container');
        if (previewContainer) {
            previewContainer.innerHTML = carruselTemplates.renderLivePreview(
                carruselState.items, 
                carruselState._slideActivo, 
                carruselState.config.tipo
            );
        }
    },

    async actualizarOrdenAutomatico(nuevoSlug) {
        carruselState.config.ubicacion_slug = nuevoSlug;
        // Asumimos que carruselController está disponible globalmente
        const proximoOrden = await window.carruselController.obtenerSiguienteOrden(nuevoSlug);
        
        carruselState.config.orden_seccion = proximoOrden;
        const inputOrden = document.getElementById('cfg_orden_seccion');
        if (inputOrden) inputOrden.value = proximoOrden;
    },

    // --- CIERRE Y GUARDADO ---

    finalizarGuardado() {
        carruselActions.enviarAlServidor();
    },

    cancelarEdicion() {
        if (carruselState.items.length > 0) {
            Swal.fire({
                title: '¿Salir del editor?',
                text: "Se perderán los cambios que no hayas guardado.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#0f172a',
                confirmButtonText: 'Sí, salir',
                cancelButtonText: 'Seguir aquí'
            }).then((result) => {
                if (result.isConfirmed) this.cerrarYRefrescar();
            });
        } else {
            this.cerrarYRefrescar();
        }
    },

    cerrarYRefrescar() {
        this._container.innerHTML = this._originalContent;
        if (window.CarruselList) window.CarruselList.init();
    }
};

// --- IMPORTANTE: Exposición global inmediata ---
window.RegisterCarrusel = RegisterCarrusel;