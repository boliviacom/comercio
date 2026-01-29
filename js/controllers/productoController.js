import { productoModel } from '../models/productoModel.js';
import { productoView } from '../views/productoView.js';
import { categoriasModel } from '../models/categoriasModel.js';
import { productoCategoriaModel } from '../models/productoCategoriaModel.js';
import { galeriaProductoModel } from '../models/galeriaProductoModel.js';
import { productManager } from '../modals/createProduct.js';
import { supabase } from '../config/supabaseClient.js';

export const productoController = {

    /**
     * Sube archivos a Supabase Bucket
     */
    async _uploadToSupabase(file, folder, nombreProducto = 'producto') {
        try {
            const slug = nombreProducto
                .toLowerCase()
                .trim()
                .replace(/ /g, '-')
                .replace(/[^\w-]+/g, '');

            const fileExt = file.name.split('.').pop();
            const fileName = `${slug}_${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
            const filePath = `${folder}/${fileName}`;

            const { data, error } = await supabase.storage
                .from('Almacenamiento')
                .upload(filePath, file);

            if (error) throw error;

            const { data: publicUrl } = supabase.storage
                .from('Almacenamiento')
                .getPublicUrl(filePath);

            return publicUrl.publicUrl;
        } catch (error) {
            console.error("Error en Storage:", error);
            throw new Error("Error al subir archivo al servidor.");
        }
    },

    /**
 * PROCESAMIENTO MULTIMEDIA INTELIGENTE
 * Decide si subir a Supabase o mantener la URL actual.
 */
    async _procesarGaleria(galeriaRaw, nombreProducto) {
        if (!galeriaRaw || !Array.isArray(galeriaRaw)) return [];

        const promesas = galeriaRaw.map(async (item, index) => {
            // 1. Si es un archivo nuevo (File) -> SUBIR
            if (item.file instanceof File) {
                const url = await this._uploadToSupabase(item.file, 'galeria', nombreProducto);
                const tipo = item.file.type.startsWith('video') ? 'video' : 'imagen';
                return { url, tipo, orden: item.orden ?? index };
            }

            // 2. Si ya es una URL existente (de Supabase o Externa) -> MANTENER
            if (typeof item.url === 'string' && item.url.startsWith('http')) {
                return { url: item.url, tipo: item.tipo, orden: item.orden ?? index };
            }

            return null;
        });

        const resultados = await Promise.all(promesas);
        return resultados.filter(res => res !== null);
    },

    async inicializar() {
        productoView.mostrarCargando?.('Sincronizando inventario...');
        try {
            await this.refrescarVista();
            Swal.close();
        } catch (error) {
            console.error(error);
            productoView.notificarError?.('No se pudo cargar el catálogo de productos.');
        }
    },

    async refrescarVista() {
        try {
            const [productos, categorias] = await Promise.all([
                productoModel.listarActivos(),
                categoriasModel.obtenerTodas()
            ]);

            this._todasLasCategorias = categorias;
            window.productosRaw = productos;
            window.productManager = productManager;
            productoView.render(productos, categorias);
        } catch (error) {
            console.error("Error en refrescarVista:", error);
            productoView.notificarError?.('Error al refrescar los datos.');
        }
    },

    async toggleEstado(id, campo, nuevoEstado) {
        productoView.mostrarCargando?.('Actualizando producto...');
        try {
            const resultado = await productoModel.actualizar(id, { [campo]: nuevoEstado });
            if (resultado.exito) {
                await this.refrescarVista();
                productoView.notificarExito?.('Estado actualizado correctamente.');
            } else { throw new Error(resultado.mensaje); }
        } catch (error) {
            productoView.notificarError?.(error.message || 'Error al cambiar el estado.');
            this.refrescarVista();
        }
    },

    /**
     * CREACIÓN DE PRODUCTO
     */
    async mostrarFormularioCrear() {
        try {
            const categorias = await categoriasModel.obtenerTodas();
            const datosForm = await productManager.start('content-area', categorias);

            if (datosForm) {
                productoView.mostrarCargando?.('Guardando producto...');

                // 1. Procesar Portada
                let portadaUrl = 'https://via.placeholder.com/400';
                if (datosForm.portada instanceof File) {
                    portadaUrl = await this._uploadToSupabase(datosForm.portada, 'portadas', datosForm.nombre);
                } else if (typeof datosForm.portada === 'string' && datosForm.portada) {
                    portadaUrl = datosForm.portada;
                }

                // 2. Crear Producto Base
                const resultado = await productoModel.crear({
                    ...datosForm,
                    portada: portadaUrl
                });

                if (resultado.exito) {
                    const nuevoId = resultado.data.id;

                    // 3. Procesar Multimedia de Galería (URLs limpias)
                    const itemsMultimedia = await this._procesarGaleria(datosForm.galeria, datosForm.nombre);

                    const promesas = [];
                    const listaCategorias = datosForm.categoriasIds || [];

                    if (listaCategorias.length > 0) {
                        promesas.push(productoCategoriaModel.vincularMultiple(nuevoId, listaCategorias));
                    }
                    if (itemsMultimedia.length > 0) {
                        promesas.push(galeriaProductoModel.createLote(nuevoId, itemsMultimedia));
                    }

                    await Promise.all(promesas);
                    await this.refrescarVista();
                    productoView.notificarExito?.('Producto registrado correctamente.');
                } else {
                    productoView.notificarError?.(resultado.mensaje);
                }
            }
        } catch (error) {
            console.error(error);
            productoView.notificarError?.('Error al procesar la creación.');
        }
    },

    /**
 * EDICIÓN DE PRODUCTO COMPLETA
 */
    async mostrarFormularioEditar(id) {
        try {
            const [producto, categorias, categoriasVinculadas, galeriaActual] = await Promise.all([
                productoModel.obtenerPorId(id),
                categoriasModel.obtenerTodas(),
                productoCategoriaModel.obtenerCategoriasPorProducto(id),
                galeriaProductoModel.getByProducto(id)
            ]);

            if (!producto) throw new Error('Producto no encontrado');

            // Mapeamos para que el modal reconozca los datos
            const productoParaEdicion = {
                id: producto.id,
                // Verifica si en tu DB es 'nombre' o 'name'
                nombre: producto.nombre || producto.name || '',
                precio: producto.precio || 0,
                stock: producto.stock || 0,
                descripcion: producto.descripcion || '',

                // Si en Supabase los campos booleanos se llaman distinto, cámbialos aquí:
                ws_active: producto.ws_active ?? true,
                price_visible: producto.price_visible ?? true,

                // Portada y Galería
                portada: producto.imagen_url || producto.portada,
                categoriasIds: categoriasVinculadas || [],
                galeria: galeriaActual || []
            };
            const datosEditados = await productManager.start('content-area', categorias, productoParaEdicion);

            if (datosEditados) {
                productoView.mostrarCargando?.('Actualizando producto...');

                // Manejo de Portada: ¿Es nueva o vieja?
                let portadaFinal = producto.imagen_url;
                if (datosEditados.portada instanceof File) {
                    portadaFinal = await this._uploadToSupabase(datosEditados.portada, 'portadas', datosEditados.nombre);
                }

                // Actualización base
                const res = await productoModel.actualizar(id, { ...datosEditados, portada: portadaFinal });

                if (res.exito) {
                    // Procesar Galería (Nuevos + Viejos con nuevo orden)
                    const nuevaGaleria = await this._procesarGaleria(datosEditados.galeria, datosEditados.nombre);

                    // Limpiamos galería vieja y guardamos la nueva configuración
                    await galeriaProductoModel.limpiarGaleria(id);

                    await Promise.all([
                        productoCategoriaModel.actualizarRelaciones(id, datosEditados.categoriasIds),
                        galeriaProductoModel.createLote(id, nuevaGaleria)
                    ]);

                    await this.refrescarVista();
                    productoView.notificarExito?.('Producto actualizado');
                }
            }
        } catch (error) {
            console.error(error);
            productoView.notificarError?.('Error al editar el producto');
        }
    },

    async eliminar(id) {
        try {
            const confirmar = await productoView.confirmarAccion?.('¿Eliminar producto?', 'Esta acción no se puede deshacer.');
            if (!confirmar) return;

            productoView.mostrarCargando?.('Eliminando...');
            const resultado = await productoModel.eliminar(id);

            if (resultado.exito) {
                await this.refrescarVista();
                productoView.notificarExito?.('El producto ha sido eliminado.');
            } else { throw new Error(resultado.mensaje); }
        } catch (error) {
            productoView.notificarError?.(error.message || 'Error al eliminar.');
        }
    }
};

window.productoController = productoController;