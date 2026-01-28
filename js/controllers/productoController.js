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
     * PROCESAMIENTO MULTIMEDIA CORREGIDO
     * Extrae strings limpios y detecta tipos correctamente.
     */
    // productoController.js

    async _procesarGaleria(galeriaRaw, nombreProducto) {
        if (!galeriaRaw || !Array.isArray(galeriaRaw)) return [];

        const promesasMultimedia = galeriaRaw.map(async (item, index) => {
            let urlFinal = item.url;
            let tipoFinal = item.tipo; // Tomamos el tipo inicial detectado por el modal

            // 1. Caso: El item tiene un archivo físico (File)
            if (item.file instanceof File) {
                urlFinal = await this._uploadToSupabase(item.file, 'galeria', nombreProducto);
                // Re-confirmamos tipo basado en el archivo real subido
                tipoFinal = item.file.type.startsWith('video') ? 'video' : 'imagen';
            }
            // 2. Caso: Es un link de red social o URL externa
            else if (typeof urlFinal === 'string') {
                const info = productManager.obtenerInfoVideo(urlFinal);
                // Si el detector dice que es video (YT, TikTok, etc), marcamos como video
                if (info.tipo !== 'imagen' && info.tipo !== 'desconocido') {
                    tipoFinal = 'video';
                } else {
                    tipoFinal = 'imagen';
                }
            }

            return {
                url: urlFinal,
                tipo: tipoFinal,
                orden: item.orden !== undefined ? parseInt(item.orden) : index
            };
        });

        const resultados = await Promise.all(promesasMultimedia);
        // Retornamos solo los que tienen URL válida
        return resultados.filter(res => res.url && res.url !== '');
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
     * EDICIÓN DE PRODUCTO
     */
    async mostrarFormularioEditar(id) {
        try {
            const [producto, categorias, categoriasVinculadas, galeriaActual] = await Promise.all([
                productoModel.obtenerPorId(id),
                categoriasModel.obtenerTodas(),
                productoCategoriaModel.obtenerCategoriasPorProducto(id),
                galeriaProductoModel.getByProducto(id)
            ]);

            if (!producto) throw new Error('No se pudo obtener el producto.');

            const productoParaEdicion = {
                ...producto,
                portada: producto.imagen_url,
                categoriasIds: categoriasVinculadas,
                galeria: galeriaActual
            };

            const datosEditados = await productManager.start('content-area', categorias, productoParaEdicion);

            if (datosEditados) {
                productoView.mostrarCargando?.('Actualizando producto...');

                // 1. Procesar Portada
                let portadaUrl = producto.imagen_url;
                if (datosEditados.portada instanceof File) {
                    portadaUrl = await this._uploadToSupabase(datosEditados.portada, 'portadas', datosEditados.nombre);
                } else if (typeof datosEditados.portada === 'string') {
                    portadaUrl = datosEditados.portada;
                }

                // 2. Actualizar Producto Base
                const resultado = await productoModel.actualizar(id, {
                    ...datosEditados,
                    portada: portadaUrl
                });

                if (resultado.exito) {
                    // 3. Galería: Procesar y Limpiar
                    const itemsMultimedia = await this._procesarGaleria(datosEditados.galeria, datosEditados.nombre);

                    // Importante: Primero limpiar, luego insertar (Secuencial para evitar conflictos)
                    await galeriaProductoModel.limpiarGaleria(id);

                    const promesas = [];
                    const listaCats = datosEditados.categoriasIds || [];

                    if (listaCats.length > 0) {
                        promesas.push(productoCategoriaModel.actualizarRelaciones(id, listaCats));
                    }
                    if (itemsMultimedia.length > 0) {
                        promesas.push(galeriaProductoModel.createLote(id, itemsMultimedia));
                    }

                    await Promise.all(promesas);
                    await this.refrescarVista();
                    productoView.notificarExito?.('Producto actualizado correctamente');
                } else {
                    throw new Error(resultado.mensaje);
                }
            }
        } catch (error) {
            console.error(error);
            productoView.notificarError?.('Error al intentar editar.');
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