import { supabase } from '../config/supabaseClient.js';
import { carruselModel } from '../models/carruselModel.js';
import { carruselController_View } from '../views/carruselView.js';
import { RegisterCarrusel } from '../modules/carrusel/registerCarrusel.js';
import { productoModel } from '../models/productoModel.js';
import { categoriasModel } from '../models/categoriasModel.js';

/**
 * Carrusel Controller - Nexus Admin Suite
 */
export const carruselController = {

    // ==========================================
    // NAVEGACIÓN Y FLUJO
    // ==========================================

    async inicializar() {
        await carruselController_View.render();
    },

    async abrirEditor(id = null) {
        let datosCargar = null;
        if (id) {
            const lista = await this.cargarCarruseles();
            const config = lista.find(c => c.id == id);
            const items = await this.cargarContenidoCarrusel(id);

            // ... dentro de abrirEditor(id = null)
            datosCargar = {
                id: id,
                config: config,
                items: items.map(it => ({
                    ...it,
                    imagen_preview: it.preview_img,
                    titulo: it.titulo_manual,
                    // CAMBIO AQUÍ: El estado del editor usa 'subtitulo'
                    subtitulo: it.subtitulo_manual || ""
                }))
            };
        }
        await RegisterCarrusel.init('content-area', datosCargar);
    },

    // ==========================================
    // GESTIÓN DE CONFIGURACIÓN Y ORDEN
    // ==========================================

    async obtenerSiguienteOrden(slug) {
        try {
            const proximoOrden = await carruselModel.obtenerSiguienteOrden(slug);
            return proximoOrden;
        } catch (error) {
            console.error("Error al obtener siguiente orden:", error);
            return 0;
        }
    },

    async cargarCarruseles() {
        try {
            return await carruselModel.listar();
        } catch (error) {
            console.error("Error al obtener carruseles:", error);
            return [];
        }
    },

    async guardarConfiguracion(datos, id = null) {
        try {
            if (id) {
                const res = await carruselModel.actualizar(id, datos);
                if (!res.exito) throw new Error(res.mensaje);
                return { exito: true, id: id };
            } else {
                const res = await carruselModel.crear(datos);
                if (res.exito && res.data) {
                    return { exito: true, id: res.data.id };
                } else {
                    throw new Error(res.mensaje || "Error al crear registro");
                }
            }
        } catch (error) {
            console.error("Error en guardarConfiguracion:", error.message);
            return { exito: false, mensaje: error.message };
        }
    },

    async borrarCarruselCompleto(id) {
        const carruseles = await this.cargarCarruseles();
        const registro = carruseles.find(c => c.id == id);
        if (!registro) return;

        const confirmado = await carruselController_View.confirmarEliminacion(registro.nombre);
        if (confirmado) {
            const res = await carruselModel.eliminar(id);
            if (res.exito) {
                carruselController_View.notificarExito("Carrusel eliminado");
                this.inicializar();
            }
        }
    },

    // ==========================================
    // GESTIÓN DE ÍTEMS Y BÚSQUEDA
    // ==========================================

    /**
     * Búsqueda de ítems relacionados.
     * CORRECCIÓN: Se usa el Model directamente para evitar errores de scope de Supabase.
     */
    async buscarItemsRelacionados(tipo, termino) {
        try {
            if (!termino || termino.length < 2) return [];

            if (tipo === 'productos') {
                // LLAMADA AL MODELO (Él ya tiene la lógica de supabase y el slug)
                const productos = await productoModel.buscarPorNombre(termino);

                return productos.map(p => ({
                    id: p.id,
                    nombre: p.nombre,
                    imagen: p.imagen,
                    precio: p.precio,
                    // Aseguramos el link basado en el slug que viene del model
                    link: p.producto_slug ? `/producto/${p.producto_slug}` : `/producto/${p.id}`
                }));
            }

            if (tipo === 'categorias') {
                const categorias = await categoriasModel.buscarPorNombre(termino);
                return categorias.map(c => ({
                    id: c.id,
                    nombre: c.nombre,
                    imagen: c.imagen,
                    link: `/categoria/${c.id}`
                }));
            }
        } catch (error) {
            console.error("Error en carruselController.buscarItemsRelacionados:", error);
            return [];
        }
        return [];
    },

    async cargarContenidoCarrusel(carruselId) {
        try {
            const items = await carruselModel.obtenerItems(carruselId);
            return items.map(item => {
                // Lógica para determinar el subtítulo (precio si es producto)
                let subtitulo = item.subtitulo_manual;

                // Si es un producto y no tiene subtítulo manual, intentamos sacar el precio del objeto producto
                if (item.producto_id && !subtitulo && item.producto?.precio) {
                    subtitulo = `$ ${item.producto.precio}`;
                }

                return {
                    id: item.id,
                    tipo_label: item.producto_id ? 'Producto' : (item.categoria_id ? 'Categoría' : 'Banner'),
                    nombre_label: item.producto?.nombre || item.categoria?.nombre || item.titulo_manual || 'Sin Título',
                    preview_img: item.producto?.imagen_url || item.categoria?.imagen || item.imagen_url_manual,
                    link_destino_manual: item.link_destino_manual,
                    producto_id: item.producto_id,
                    categoria_id: item.categoria_id,
                    titulo_manual: item.titulo_manual || item.producto?.nombre,
                    subtitulo_manual: subtitulo, // <--- IMPORTANTE
                    orden: item.orden
                };
            });
        } catch (error) {
            console.error("Error cargando ítems:", error);
            return [];
        }
    },
    async limpiarItemsCarrusel(id) {
        if (!id) return { exito: false, mensaje: "ID requerido" };
        return await carruselModel.limpiarItemsCarrusel(id);
    },

    async vincularItemSinRefrescar(dataItem) {
        return await carruselModel.agregarItem(dataItem);
    }
};

// Exponer globalmente para que las acciones del DOM puedan invocarlo
window.carruselController = carruselController;