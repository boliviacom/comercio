import { configuracionFrontendModel } from '../models/configuracionFrontendModel.js';
import { configuracionFrontendView } from '../views/configuracionFrontendView.js';

export const configuracionFrontendController = {
    
    /**
     * 1. Carga inicial para el INDEX
     * Obtiene los datos, filtra los colores y manda a renderizar.
     */
    async inicializarIndex() {
        let ajustes = await configuracionFrontendModel.obtenerTodas();
        
        if (ajustes) {
            /**
             * FILTRO: Excluimos cualquier clave que empiece con "color_"
             * porque ahora se gestionan mediante el gestor de paletas dedicado.
             */
            ajustes = ajustes.filter(a => !a.clave.startsWith('color_'));
            
            // Enviamos los datos filtrados a la VISTA para generar el HTML
            configuracionFrontendView.renderizarLista(ajustes);
            
            // Actualizamos los contadores visuales
            this.actualizarContadores(ajustes.length);
        }
    },

    /**
     * 2. Actualiza los contadores numéricos en la interfaz
     */
    actualizarContadores(total) {
        configuracionFrontendView.setTotalAjustes(total);
    }
};

/**
 * =========================================================================
 * FUNCIONES GLOBALES (Window)
 * Estas funciones permiten que los eventos inline del HTML (onchange, onclick) 
 * se comuniquen con la lógica del controlador y el modelo.
 * =========================================================================
 */

/**
 * Actualiza un valor específico en la base de datos
 */
window.actualizarClave = async (clave, valor) => {
    const res = await configuracionFrontendModel.actualizarConfiguracion(clave, valor);
    
    if (res.exito) {
        console.log(`%c ✓ ${clave} actualizado correctamente`, 'color: #10b981; font-weight: bold');
        
        // Sincronizamos cualquier elemento visual necesario a través de la vista
        configuracionFrontendView.sincronizarInputs(clave, valor);
    } else {
        console.error(`Error al actualizar ${clave}:`, res.error);
    }
};

/**
 * Restaura un parámetro a su valor original de fábrica
 */
window.restaurarClave = async (clave) => {
    if (confirm(`¿Estás seguro de que deseas restaurar "${clave}" a su valor por defecto?`)) {
        const res = await configuracionFrontendModel.restaurarPorDefecto(clave);
        
        if (res.exito) {
            // En restauraciones, recargamos la página para asegurar que el estado
            // visual coincida perfectamente con el valor por defecto de la DB.
            location.reload(); 
        }
    }
};