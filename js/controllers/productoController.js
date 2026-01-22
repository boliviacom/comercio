import { productoModel } from '../models/productoModel.js'; 
import { productoView } from '../views/productoView.js';
import { categoriasModel } from '../models/categoriasModel.js'; 
import { productoCategoriaModel } from '../models/productoCategoriaModel.js'; 
import { galeriaProductoModel } from '../models/galeriaProductoModel.js';
import { createProduct } from '../modals/createProduct.js'; 
import { supabase } from '../config/supabaseClient.js'; 

export const productoController = {

    /**
     * Sube archivos a Supabase Bucket con nombre basado en el producto
     * El bucket utilizado es "Almacenamiento"
     */
    async _uploadToSupabase(file, folder, nombreProducto = 'producto') {
        // Limpiar el nombre del producto para el archivo (Slug)
        const slug = nombreProducto
            .toLowerCase()
            .trim()
            .replace(/ /g, '-')
            .replace(/[^\w-]+/g, '');
        
        const fileExt = file.name.split('.').pop();
        // Estructura: carpeta/nombre-producto_timestamp.ext
        const fileName = `${slug}_${Date.now()}.${fileExt}`;
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
     * Re-dibuja la vista con los datos actuales.
     */
    async refrescarVista() {
        try {
            const [productos, categorias] = await Promise.all([
                productoModel.listarActivos(),
                categoriasModel.obtenerTodas() 
            ]);
            
            window.productosRaw = productos;
            productoView.render(productos, categorias);
        } catch (error) {
            console.error("Error en refrescarVista:", error);
            productoView.notificarError('Error al refrescar los datos.');
        }
    },

    /**
     * Cambio de estado INDIVIDUAL (Switch)
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
     * Cambio de estado MASIVO (Master Switches) - TODO EL UNIVERSO
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
     * Cambio de estado MASIVO FILTRADO
     */
    async toggleMasivoFiltrado(campo, nuevoEstado, listaIds) {
        if (!listaIds || listaIds.length === 0) return;

        productoView.mostrarCargando(`Actualizando ${listaIds.length} productos...`);
        try {
            const resultado = await productoModel.actualizarVarios(listaIds, { [campo]: nuevoEstado });
            
            if (resultado.exito) {
                await this.refrescarVista();
                productoView.notificarExito(`Actualizados ${listaIds.length} productos filtrados.`);
            } else {
                throw new Error(resultado.mensaje);
            }
        } catch (error) {
            console.error("Error en toggleMasivoFiltrado:", error);
            productoView.notificarError('Error al aplicar cambio masivo filtrado.');
            this.refrescarVista();
        }
    },

    /**
     * Visualizar detalle del producto (incluyendo galería).
     */
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
     * Lógica para abrir el formulario de CREACIÓN (Multitabla)
     */
    async mostrarFormularioCrear() {
        try {
            const categorias = await categoriasModel.obtenerTodas();
            const datosForm = await createProduct.render('Nuevo Producto', categorias);
            
            if (datosForm) {
                productoView.mostrarCargando('Subiendo archivos al Almacenamiento...');
                
                // 1. Subir Portada con nombre del producto
                let portadaUrl = 'https://via.placeholder.com/400';
                if (datosForm.archivoPortada) {
                    portadaUrl = await this._uploadToSupabase(datosForm.archivoPortada, 'portadas', datosForm.nombre);
                }

                // 2. Subir Galería con nombre del producto
                const galeriaUrls = [];
                if (datosForm.galeriaArchivos && datosForm.galeriaArchivos.length > 0) {
                    for (const file of datosForm.galeriaArchivos) {
                        if (file instanceof File) {
                            const url = await this._uploadToSupabase(file, 'galeria', datosForm.nombre);
                            galeriaUrls.push(url);
                        }
                    }
                }

                // 3. Guardar en tabla producto (PostgreSQL)
                const resultado = await productoModel.crear({
                    ...datosForm,
                    imagen_url: portadaUrl
                });
                
                if (resultado.exito) {
                    const nuevoId = resultado.data.id;
                    const promesas = [];

                    if (datosForm.categoriasIds && datosForm.categoriasIds.length > 0) {
                        promesas.push(productoCategoriaModel.vincularMultiple(nuevoId, datosForm.categoriasIds));
                    }

                    if (galeriaUrls.length > 0) {
                        promesas.push(galeriaProductoModel.createLote(nuevoId, galeriaUrls));
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
        }
    },

    /**
     * Lógica para abrir el formulario de EDICIÓN (Multitabla).
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

            const productoParaModal = {
                ...producto,
                categoriasIds: categoriasVinculadas,
                galeria: galeriaActual
            };

            const datosEditados = await createProduct.render('Editar Producto', categorias, productoParaModal);

            if (datosEditados) {
                productoView.mostrarCargando('Actualizando cambios y archivos...');

                // Manejo de Portada en edición
                let portadaUrl = producto.imagen_url;
                if (datosEditados.archivoPortada instanceof File) {
                    portadaUrl = await this._uploadToSupabase(datosEditados.archivoPortada, 'portadas', datosEditados.nombre);
                }

                const resultado = await productoModel.actualizar(id, {
                    ...datosEditados,
                    imagen_url: portadaUrl
                });

                if (resultado.exito) {
                    if (datosEditados.categoriasIds) {
                        await productoCategoriaModel.actualizarRelaciones(id, datosEditados.categoriasIds);
                    }

                    // Subir nuevos archivos de galería si existen
                    const nuevasUrlsGaleria = [];
                    if (datosEditados.galeriaArchivos) {
                        for (const item of datosEditados.galeriaArchivos) {
                            if (item instanceof File) {
                                const url = await this._uploadToSupabase(item, 'galeria', datosEditados.nombre);
                                nuevasUrlsGaleria.push(url);
                            }
                        }
                    }
                    
                    if (nuevasUrlsGaleria.length > 0) {
                        await galeriaProductoModel.createLote(id, nuevasUrlsGaleria);
                    }
                    
                    await this.refrescarVista();
                    productoView.notificarExito('Producto actualizado correctamente');
                } else {
                    throw new Error(resultado.mensaje);
                }
            }
        } catch (error) {
            console.error(error);
            productoView.notificarError(error.message || 'Error al intentar editar.');
        }
    },

    /**
     * Lógica de eliminación (Soft Delete)
     */
    async eliminar(id) {
        try {
            const confirmar = await productoView.confirmarAccion?.('¿Estás seguro?', 'Esta acción ocultará el producto del catálogo.');
            if (!confirmar) return;

            productoView.mostrarCargando('Eliminando...');
            const resultado = await productoModel.eliminar(id);
            if (resultado.exito) {
                await this.refrescarVista();
                productoView.notificarExito('El producto ha sido eliminado.');
            } else {
                throw new Error(resultado.mensaje);
            }
        } catch (error) {
            productoView.notificarError(error.message || 'Error al eliminar.');
        }
    }
};

window.productoController = productoController;