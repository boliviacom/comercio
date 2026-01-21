import { productoModel } from '../models/productoModel.js'; 
import { productoView } from '../views/productoView.js';
// Importamos el modelo de categorías para obtener la lista maestra
import { categoriasModel } from '../models/categoriasModel.js'; 

export const productoController = {

    /**
     * Orquestador inicial
     */
    async inicializar() {
        productoView.mostrarCargando('Sincronizando inventario...');
        try {
            await this.refrescarVista();
            Swal.close();
        } catch (error) {
            console.error(error);
            productoView.notificarError('No se pudo cargar el catálogo de productos.');
        }
    },

    /**
     * Re-dibuja la vista con los datos actuales
     * ACTUALIZACIÓN: Ahora también obtiene y envía las categorías globales
     */
    async refrescarVista() {
        try {
            // Obtenemos promesas en paralelo para mayor velocidad
            const [productos, categorias] = await Promise.all([
                productoModel.listarActivos(),
                categoriasModel.obtenerTodas() // Obtenemos TODAS las categorías de la DB
            ]);
            
            // Pasamos ambos arreglos a la vista
            productoView.render(productos, categorias);
        } catch (error) {
            console.error("Error en refrescarVista:", error);
            productoView.notificarError('Error al refrescar los datos.');
        }
    },

    /**
     * Cambio de estado INDIVIDUAL (Switch de cada fila)
     */
    async toggleEstado(id, campo, nuevoEstado) {
        productoView.mostrarCargando('Actualizando producto...');
        try {
            const datosActualizar = { [campo]: nuevoEstado };
            const resultado = await productoModel.actualizar(id, datosActualizar);
            
            if (resultado.exito) {
                await this.refrescarVista();
                productoView.notificarExito('Estado actualizado correctamente.');
            } else {
                throw new Error(resultado.mensaje);
            }
        } catch (error) {
            productoView.notificarError(error.message || 'Error al cambiar el estado.');
            this.refrescarVista();
        }
    },

    /**
     * Cambio de estado MASIVO (Switches superiores)
     */
    async toggleMasivo(campo, nuevoEstado) {
        productoView.mostrarCargando('Aplicando cambios masivos...');
        try {
            const resultado = await productoModel.actualizarMasivo(campo, nuevoEstado);
            
            if (resultado.exito) {
                await this.refrescarVista();
                productoView.notificarExito(`Se han actualizado todos los productos.`);
            } else {
                throw new Error(resultado.mensaje);
            }
        } catch (error) {
            productoView.notificarError(error.message || 'Error en la actualización masiva.');
            this.refrescarVista();
        }
    },

    /**
     * Visualizar detalle
     */
    async verDetalle(id) {
        try {
            const producto = await productoModel.obtenerPorId(id);
            if (!producto) throw new Error();
            productoView.mostrarDetalle(producto);
        } catch (error) {
            productoView.notificarError('No se encontró la información del producto.');
        }
    },

    /**
     * Lógica de creación/edición
     */
    async mostrarFormularioCrear() {
        // También pasamos las categorías al formulario si es necesario
        const datosForm = await productoView.mostrarModalFormulario?.('Nuevo Producto');
        if (datosForm) {
            productoView.mostrarCargando('Guardando...');
            const resultado = await productoModel.crear(datosForm);
            if (resultado.exito) {
                await this.refrescarVista();
                productoView.notificarExito('Producto registrado correctamente');
            } else {
                productoView.notificarError(resultado.mensaje);
            }
        }
    },

    /**
     * Lógica de eliminación
     */
    async eliminar(id) {
        productoView.mostrarCargando('Eliminando...');
        const resultado = await productoModel.eliminar(id);
        if (resultado.exito) {
            await this.refrescarVista();
            productoView.notificarExito('El producto ha sido eliminado.');
        } else {
            productoView.notificarError(resultado.mensaje);
        }
    }
};

// Exposición global
window.productoController = productoController;