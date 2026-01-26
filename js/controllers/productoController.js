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
        const slug = nombreProducto
            .toLowerCase()
            .trim()
            .replace(/ /g, '-')
            .replace(/[^\w-]+/g, '');
        
        const fileExt = file.name.split('.').pop();
        // Añadimos un random para evitar colisiones en subidas masivas
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
    },

    /**
     * PROCESAMIENTO MULTIMEDIA
     * Detecta si es archivo o link, y si es imagen o video.
     */
    async _procesarGaleria(galeriaRaw, nombreProducto) {
        if (!galeriaRaw || !Array.isArray(galeriaRaw)) return [];

        const promesasMultimedia = galeriaRaw.map(async (item) => {
            // 1. Si es un archivo local (File)
            const archivo = item instanceof File ? item : item.file;
            if (archivo instanceof File) {
                const tipo = archivo.type.startsWith('video') ? 'video' : 'imagen';
                const url = await this._uploadToSupabase(archivo, 'galeria', nombreProducto);
                return { url, tipo };
            }

            // 2. Si es un link externo (URL string) o un objeto con URL
            const urlLink = typeof item === 'string' ? item : (item.url || null);
            if (urlLink && typeof urlLink === 'string') {
                const esVideo = /\.(mp4|webm|ogg|mov)$/i.test(urlLink) || 
                                urlLink.includes('youtube.com') || 
                                urlLink.includes('youtu.be') || 
                                urlLink.includes('vimeo.com');
                return { url: urlLink, tipo: esVideo ? 'video' : 'imagen' };
            }
            return null;
        });

        const resultados = await Promise.all(promesasMultimedia);
        return resultados.filter(res => res !== null);
    },

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
            productoView.notificarError('Error al refrescar los datos.');
        }
    },

    async toggleEstado(id, campo, nuevoEstado) {
        productoView.mostrarCargando('Actualizando producto...');
        try {
            const datosActualizar = { [campo]: nuevoEstado };
            const resultado = await productoModel.actualizar(id, datosActualizar);
            if (resultado.exito) {
                await this.refrescarVista();
                productoView.notificarExito('Estado actualizado correctamente.');
            } else { throw new Error(resultado.mensaje); }
        } catch (error) {
            productoView.notificarError(error.message || 'Error al cambiar el estado.');
            this.refrescarVista();
        }
    },

    async toggleMasivo(campo, nuevoEstado) {
        productoView.mostrarCargando('Aplicando cambios masivos...');
        try {
            const resultado = await productoModel.actualizarMasivo(campo, nuevoEstado);
            if (resultado.exito) {
                await this.refrescarVista();
                productoView.notificarExito(`Se han actualizado todos los productos.`);
            } else { throw new Error(resultado.mensaje); }
        } catch (error) {
            productoView.notificarError(error.message || 'Error en la actualización masiva.');
            this.refrescarVista();
        }
    },

    async toggleMasivoFiltrado(campo, nuevoEstado, listaIds) {
        if (!listaIds || listaIds.length === 0) return;
        productoView.mostrarCargando(`Actualizando ${listaIds.length} productos...`);
        try {
            const resultado = await productoModel.actualizarVarios(listaIds, { [campo]: nuevoEstado });
            if (resultado.exito) {
                await this.refrescarVista();
                productoView.notificarExito(`Actualizados ${listaIds.length} productos filtrados.`);
            } else { throw new Error(resultado.mensaje); }
        } catch (error) {
            productoView.notificarError('Error al aplicar cambio masivo filtrado.');
            this.refrescarVista();
        }
    },

    async verDetalle(id) {
        try {
            const [producto, galeria] = await Promise.all([
                productoModel.obtenerPorId(id),
                galeriaProductoModel.getByProducto(id)
            ]);
            if (!producto) throw new Error();
            const productoCompleto = { ...producto, galeria };
            productoView.mostrarDetalle?.(productoCompleto);
        } catch (error) {
            productoView.notificarError('No se encontró la información del producto.');
        }
    },

    /**
     * CREACIÓN
     */
    async mostrarFormularioCrear() {
        try {
            const categorias = await categoriasModel.obtenerTodas();
            const datosForm = await productManager.start('content-area', categorias);
            
            if (datosForm) {
                productoView.mostrarCargando('Guardando producto...');
                
                let portadaUrl = 'https://via.placeholder.com/400';
                if (datosForm.portada instanceof File) {
                    portadaUrl = await this._uploadToSupabase(datosForm.portada, 'portadas', datosForm.nombre);
                }

                const resultado = await productoModel.crear({
                    ...datosForm,
                    imagen_url: portadaUrl
                });
                
                if (resultado.exito) {
                    const nuevoId = resultado.data.id;
                    const promesas = [];

                    if (datosForm.categorias?.length > 0) {
                        promesas.push(productoCategoriaModel.vincularMultiple(nuevoId, datosForm.categorias));
                    }

                    // PROCESAMIENTO MULTIMEDIA CORREGIDO
                    const itemsMultimedia = await this._procesarGaleria(datosForm.galeria, datosForm.nombre);
                    if (itemsMultimedia.length > 0) {
                        promesas.push(galeriaProductoModel.createLote(nuevoId, itemsMultimedia));
                    }

                    await Promise.all(promesas);
                    await this.refrescarVista();
                    productoView.notificarExito('Producto registrado correctamente.');
                } else {
                    productoView.notificarError(resultado.mensaje);
                }
            }
        } catch (error) {
            console.error(error);
            productoView.notificarError('Error al procesar la creación.');
            this.refrescarVista();
        }
    },

    /**
     * EDICIÓN
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
                categoriasIds: categoriasVinculadas,
                galeria: galeriaActual
            };

            const datosEditados = await productManager.start('content-area', categorias, productoParaEdicion);

            if (datosEditados) {
                productoView.mostrarCargando('Actualizando producto...');

                let portadaUrl = producto.imagen_url;
                if (datosEditados.portada instanceof File) {
                    portadaUrl = await this._uploadToSupabase(datosEditados.portada, 'portadas', datosEditados.nombre);
                }

                const resultado = await productoModel.actualizar(id, {
                    ...datosEditados,
                    imagen_url: portadaUrl
                });

                if (resultado.exito) {
                    const promesas = [];
                    if (datosEditados.categorias) {
                        promesas.push(productoCategoriaModel.actualizarRelaciones(id, datosEditados.categorias));
                    }

                    // PROCESAMIENTO MULTIMEDIA CORREGIDO
                    const itemsMultimedia = await this._procesarGaleria(datosEditados.galeria, datosEditados.nombre);
                    if (itemsMultimedia.length > 0) {
                        promesas.push(galeriaProductoModel.createLote(id, itemsMultimedia));
                    }
                    
                    await Promise.all(promesas);
                    await this.refrescarVista();
                    productoView.notificarExito('Producto actualizado correctamente');
                } else {
                    throw new Error(resultado.mensaje);
                }
            }
        } catch (error) {
            console.error(error);
            productoView.notificarError('Error al intentar editar.');
            this.refrescarVista();
        }
    },

    async eliminar(id) {
        try {
            const confirmar = await productoView.confirmarAccion?.('¿Eliminar producto?', 'Esta acción no se puede deshacer.');
            if (!confirmar) return;
            productoView.mostrarCargando('Eliminando...');
            const resultado = await productoModel.eliminar(id);
            if (resultado.exito) {
                await this.refrescarVista();
                productoView.notificarExito('El producto ha sido eliminado.');
            } else { throw new Error(resultado.mensaje); }
        } catch (error) {
            productoView.notificarError(error.message || 'Error al eliminar.');
        }
    }
};

window.productoController = productoController;