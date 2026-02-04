import { carruselState } from './carruselState.js';
import { RegisterCarrusel } from './registerCarrusel.js';

// Variable para controlar el tiempo de espera de la búsqueda (Debounce)
let searchTimer;

export const carruselActions = {
    /**
     * Valida y captura los datos del Paso 1 (Configuración)
     */
    validarPaso1() {
        const nombreInput = document.getElementById('cfg_nombre');
        const slugInput = document.getElementById('cfg_slug');
        const ordenInput = document.getElementById('cfg_orden_seccion');
        const descInput = document.getElementById('cfg_descripcion');

        const nombre = nombreInput ? nombreInput.value.trim() : '';
        const slug = slugInput ? slugInput.value : 'home-top';
        const orden = ordenInput ? parseInt(ordenInput.value) : 0;

        if (!nombre) {
            this._alertError("Ponle un nombre para identificarlo");
            return false;
        }

        carruselState.config.nombre = nombre;
        carruselState.config.ubicacion_slug = slug;
        carruselState.config.orden_seccion = isNaN(orden) ? 0 : orden;
        carruselState.config.descripcion = descInput ? descInput.value.trim() : '';

        return true;
    },

    /**
     * Búsqueda con Debounce para evitar consultas por cada carácter.
     * Actualizado para incluir el precio en los resultados.
     */
    buscarRelacionados(termino) {
        clearTimeout(searchTimer);
        const listaResultados = document.getElementById('search_results_list');

        if (!termino || termino.trim().length < 2) {
            if (listaResultados) {
                listaResultados.innerHTML = '';
                listaResultados.classList.add('hidden');
            }
            return;
        }

        searchTimer = setTimeout(async () => {
            try {
                const tipo = carruselState.config.tipo;
                const resultados = await window.carruselController.buscarItemsRelacionados(tipo, termino);

                if (listaResultados) {
                    if (resultados && resultados.length > 0) {
                        listaResultados.innerHTML = resultados.map(res => {
                            // Normalización de datos
                            const id = res.id;
                            const nombre = res.nombre || 'Sin nombre';
                            const imagen = res.imagen || 'https://placehold.co/100?text=No+Img';
                            const link = res.link || '';
                            const precio = res.precio || 0; // Capturamos el precio

                            // Escapamos comillas para evitar errores en el onclick
                            const nombreEscapado = nombre.replace(/'/g, "\\'").replace(/"/g, "&quot;");
                            const imagenEscapada = imagen.replace(/'/g, "\\'");
                            const linkEscapado = link.replace(/'/g, "\\'");

                            return `
                                <div onclick="carruselActions.seleccionarResultado('${id}', '${nombreEscapado}', '${imagenEscapada}', '${linkEscapado}', ${precio})" 
                                     class="flex items-center gap-3 p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 transition-colors group">
                                    <img src="${imagen}" class="w-10 h-10 object-cover rounded-lg shadow-sm" onerror="this.src='https://placehold.co/100?text=No+Img'">
                                    <div class="flex flex-col min-w-0 flex-1">
                                        <span class="text-xs font-black text-slate-700 uppercase truncate">${nombre}</span>
                                        <div class="flex items-center gap-2">
                                            ${precio > 0 ? `<span class="text-[10px] font-bold text-blue-600">$${precio.toLocaleString()}</span>` : ''}
                                            <span class="text-[9px] font-bold text-slate-400 uppercase">ID: ${id}</span>
                                        </div>
                                    </div>
                                    <i class="fa-solid fa-plus text-slate-300 group-hover:text-blue-500 text-xs transition-colors"></i>
                                </div>
                            `;
                        }).join('');
                        listaResultados.classList.remove('hidden');
                    } else {
                        listaResultados.innerHTML = `<div class="p-4 text-[10px] font-black text-slate-400 uppercase text-center">Sin resultados</div>`;
                        listaResultados.classList.remove('hidden');
                    }
                }
            } catch (error) {
                console.error("Error en búsqueda:", error);
                if (listaResultados) {
                    listaResultados.innerHTML = `<div class="p-4 text-[10px] text-red-400 text-center uppercase font-bold">Error de conexión</div>`;
                }
            }
        }, 400);
    },

    /**
     * Selecciona un ítem de la búsqueda y llena el formulario.
     * Actualizado para manejar el precio y mejorar la previsualización.
     */
    seleccionarResultado(id, nombre, imagen, link, precio) {
        const inputRelacion = document.getElementById('it_relacion_id');
        const inputTitulo = document.getElementById('it_titulo');
        const inputMedia = document.getElementById('it_media_url');
        const inputLink = document.getElementById('it_link');
        const previewBox = document.getElementById('preview_box');

        // Llenado de inputs
        if (inputRelacion) inputRelacion.value = id;
        if (inputTitulo) inputTitulo.value = nombre;
        if (inputMedia) inputMedia.value = imagen;
        if (inputLink) inputLink.value = link || '';

        // Si tienes un input de subtítulo, podrías poner el precio ahí automáticamente o dejarlo libre
        const inputSubtitulo = document.getElementById('it_subtitulo');
        if (inputSubtitulo && precio > 0 && !inputSubtitulo.value) {
            inputSubtitulo.value = `Precio: $${precio.toLocaleString()}`;
        }

        if (previewBox && imagen) {
            previewBox.innerHTML = `
                <div class="relative w-full h-full flex items-center justify-center bg-white rounded-xl overflow-hidden shadow-inner">
                    <img src="${imagen}" class="max-w-full max-h-full object-contain p-2 animate-fade-in">
                    ${precio > 0 ? `
                        <div class="absolute bottom-2 right-2 bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg border border-white/20">
                            $${precio.toLocaleString()}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        this.limpiarBuscadorRapido();
    },

    limpiarBuscadorRapido() {
        const buscador = document.getElementById('it_search');
        const listaResultados = document.getElementById('search_results_list');

        if (buscador) buscador.value = '';
        if (listaResultados) {
            listaResultados.innerHTML = '';
            listaResultados.classList.add('hidden');
        }
    },

    /**
     * Previsualización de archivos locales (Banners)
     */
    async previsualizarMediaLocal(input) {
        if (input.files && input.files[0]) {
            const file = input.files[0];
            const reader = new FileReader();

            reader.onload = (e) => {
                const previewBox = document.getElementById('preview_box');
                const mediaUrlInput = document.getElementById('it_media_url');

                if (mediaUrlInput) mediaUrlInput.value = e.target.result;

                if (previewBox) {
                    if (file.type.startsWith('video/')) {
                        previewBox.innerHTML = `<video src="${e.target.result}" class="w-full h-full object-cover" autoplay muted loop></video>`;
                    } else {
                        previewBox.innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover animate-fade-in">`;
                    }
                }
            };
            reader.readAsDataURL(file);
        }
    },

    async pedirUrlImagen() {
        const { value: url } = await Swal.fire({
            title: 'URL de Multimedia',
            input: 'url',
            inputLabel: 'Pega el link de la imagen o video',
            showCancelButton: true,
            confirmButtonColor: '#0f172a',
            customClass: { popup: 'rounded-[2rem]' }
        });

        if (url) {
            const mediaUrlInput = document.getElementById('it_media_url');
            if (mediaUrlInput) mediaUrlInput.value = url;

            const previewBox = document.getElementById('preview_box');
            if (previewBox) {
                previewBox.innerHTML = `<img src="${url}" class="w-full h-full object-cover animate-fade-in" onerror="this.src='https://placehold.co/600x400?text=Error+Link'">`;
            }
        }
    },

    /**
     * Captura el ítem del formulario según el tipo de carrusel
     */
    capturarItem() {
        const mediaUrl = document.getElementById('it_media_url')?.value;
        const titulo = document.getElementById('it_titulo')?.value.trim() || '';
        let subtitulo = document.getElementById('it_subtitulo')?.value.trim() || ''; // <--- Usamos let
        const link = document.getElementById('it_link')?.value.trim() || '';
        const relacionId = document.getElementById('it_relacion_id')?.value || null;

        if (!mediaUrl) {
            this._alertError("Falta la imagen o el elemento seleccionado");
            return null;
        }

        return {
            imagen_preview: mediaUrl,
            titulo: titulo,
            subtitulo: subtitulo, // <--- Este valor ahora se pasará correctamente al State
            link: link,
            producto_id: carruselState.config.tipo === 'productos' ? relacionId : null,
            categoria_id: carruselState.config.tipo === 'categorias' ? relacionId : null,
            tipo_contenido: carruselState.config.tipo
        };
    },
    /**
     * Orquestador final de guardado
     */
    async enviarAlServidor() {
        if (carruselState.items.length === 0) {
            this._alertError("El carrusel debe tener al menos un ítem");
            return;
        }

        const result = await Swal.fire({
            title: '¿Publicar Carrusel?',
            text: "Los cambios serán visibles inmediatamente en la web",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, publicar',
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#64748b',
            customClass: { popup: 'rounded-[2.5rem]' }
        });

        if (!result.isConfirmed) return;

        Swal.fire({
            title: 'Procesando...',
            didOpen: () => { Swal.showLoading(); },
            allowOutsideClick: false,
            customClass: { popup: 'rounded-[2rem]' }
        });

        try {
            const ctrl = window.carruselController;
            if (!ctrl) throw new Error("Controlador no inicializado");

            // 1. Guardar o actualizar la cabecera (Configuración)
            const resConfig = await ctrl.guardarConfiguracion(carruselState.config, carruselState._id);
            if (!resConfig.exito) throw new Error(resConfig.mensaje);

            const carruselId = resConfig.id;

            // 2. Si estamos editando, limpiamos los ítems anteriores
            if (carruselState._id) {
                await ctrl.limpiarItemsCarrusel(carruselId);
            }

            // 3. Vincular todos los ítems actuales en orden
            for (let [index, item] of carruselState.items.entries()) {
                await ctrl.vincularItemSinRefrescar({
                    carrusel_id: carruselId,
                    orden: index,
                    titulo_manual: item.titulo,
                    subtitulo_manual: item.subtitulo,
                    imagen_url_manual: item.imagen_preview,
                    link_destino_manual: item.link,
                    producto_id: item.producto_id,
                    categoria_id: item.categoria_id
                });
            }

            await Swal.fire({
                title: '¡Completado!',
                text: 'Carrusel actualizado con éxito',
                icon: 'success',
                confirmButtonColor: '#0f172a',
                customClass: { popup: 'rounded-[2rem]' }
            });

            RegisterCarrusel.cerrarYRefrescar();

        } catch (error) {
            console.error("Error al guardar:", error);
            this._alertError("Error: " + error.message);
        }
    },

    _alertError(msj) {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: msj,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    }
};