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
            // Aseguramos que el orden sea un número, si no viene, usamos el index del array
            const ordenFinal = (item.orden !== undefined && item.orden !== "")
                ? parseInt(item.orden)
                : index;

            // 1. Archivo Nuevo
            if (item.file instanceof File) {
                const url = await this._uploadToSupabase(item.file, 'galeria', nombreProducto);
                const tipo = item.file.type.startsWith('video') ? 'video' : 'imagen';
                return { url, tipo, orden: ordenFinal, nombre: item.nombre };
            }

            // 2. URL Existente (Mantenemos los datos actuales pero actualizamos el orden)
            if (typeof item.url === 'string' && item.url.startsWith('http')) {
                return {
                    url: item.url,
                    tipo: item.tipo || 'imagen',
                    orden: ordenFinal,
                    nombre: item.nombre || 'Archivo guardado'
                };
            }

            return null;
        });

        const resultados = await Promise.all(promesas);
        // Ordenamos el array antes de enviarlo a la base de datos
        return resultados.filter(res => res !== null).sort((a, b) => a.orden - b.orden);
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
 * Actualización masiva para productos filtrados
 */
    async toggleMasivoFiltrado(campo, nuevoEstado, ids) {
        if (!ids || ids.length === 0) return;

        productoView.mostrarCargando?.(`Actualizando ${ids.length} productos...`);
        try {
            // Ejecutamos todas las actualizaciones en paralelo para mayor velocidad
            const promesas = ids.map(id =>
                productoModel.actualizar(id, { [campo]: nuevoEstado })
            );

            const resultados = await Promise.all(promesas);
            const errores = resultados.filter(r => !r.exito);

            if (errores.length === 0) {
                await this.refrescarVista();
                productoView.notificarExito?.(`Se actualizaron ${ids.length} productos.`);
            } else {
                throw new Error(`Hubo problemas con ${errores.length} productos.`);
            }
        } catch (error) {
            console.error("Error masivo:", error);
            productoView.notificarError?.('No se pudo completar la actualización masiva.');
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

            if (!producto) {
                console.error("LOG ERROR: Producto no encontrado en DB");
                throw new Error('Producto no encontrado');
            }

            const productoParaEdicion = {
                id: producto.id,
                nombre: producto.producto_nombre || producto.nombre || '',
                precio: producto.precio || 0,
                stock: producto.stock || 0,
                descripcion: producto.descripcion || '',
                ws_active: producto.habilitar_whatsapp === true,
                price_visible: producto.mostrar_precio === true,
                portada: producto.imagen_url || '',
                categoriasIds: categoriasVinculadas || [],
                galeria: galeriaActual || []
            };

            // Abrir modal y esperar datos editados
            const datosEditados = await productManager.start('content-area', categorias, productoParaEdicion);


            if (datosEditados) {
                productoView.mostrarCargando?.('Actualizando producto...');

                // --- 1. MANEJO DE PORTADA (CORREGIDO) ---
                let portadaFinal = producto.imagen_url;

                // Verificamos si la portada es un archivo nuevo (objeto con propiedad .data que es File)
                // O si es directamente un File
                const archivoPortada = datosEditados.portada?.data || datosEditados.portada;

                if (archivoPortada instanceof File) {
                    portadaFinal = await this._uploadToSupabase(archivoPortada, 'portadas', datosEditados.nombre);
                } else if (typeof datosEditados.portada === 'string') {
                    // Si es un string, es una URL vinculada
                    portadaFinal = datosEditados.portada;
                }

                // --- 2. PREPARAR PAYLOAD (CORREGIDO PARA EL MODELO) ---
                const updatePayload = {
                    nombre: datosEditados.nombre.trim(), // El modelo espera 'nombre'
                    precio: parseFloat(datosEditados.precio),
                    stock: parseInt(datosEditados.stock),
                    descripcion: datosEditados.descripcion.trim(),
                    ws_active: datosEditados.ws_active,
                    price_visible: datosEditados.price_visible,
                    portada: portadaFinal // El modelo mapeará esto a imagen_url
                };

                const res = await productoModel.actualizar(id, updatePayload);

                if (res.exito) {
                    // 3. Procesar Galería
                    const nuevaGaleria = await this._procesarGaleria(datosEditados.galeria, datosEditados.nombre);

                    // 4. Sincronización de relaciones
                    await Promise.all([
                        productoCategoriaModel.actualizarRelaciones(id, datosEditados.categoriasIds),
                        galeriaProductoModel.limpiarGaleria(id)
                    ]);

                    // Guardar el nuevo lote de la galería
                    if (nuevaGaleria.length > 0) {
                        await galeriaProductoModel.createLote(id, nuevaGaleria);
                    }
                    await this.refrescarVista();
                    productoView.notificarExito?.('¡Producto actualizado con éxito!');
                } else {
                    throw new Error(res.mensaje || 'Error al actualizar tabla principal');
                }
            }
        } catch (error) {
            console.error("LOG FINAL ERROR EN EDICIÓN:", error);
            productoView.notificarError?.('No se pudieron guardar los cambios: ' + error.message);
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