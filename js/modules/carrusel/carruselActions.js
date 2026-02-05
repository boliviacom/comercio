import { carruselState } from './carruselState.js';
import { RegisterCarrusel } from './registerCarrusel.js';

// Variable para controlar el tiempo de espera de la búsqueda (Debounce)
let searchTimer;
let ICONOS_GLOBALES = [];

/**
 * Carga la lista completa de iconos desde el repositorio de FontAwesome
 */
async function cargarDiccionarioIconos() {
    try {
        // Usamos una lista de metadatos confiable de la versión 6 Free
        const response = await fetch('https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/metadata/icons.json');
        const data = await response.json();
        // Filtramos solo los iconos que tienen estilo "solid" (gratuitos)
        ICONOS_GLOBALES = Object.keys(data).filter(key => data[key].styles.includes('solid'));
        console.log(`Cargados ${ICONOS_GLOBALES.length} iconos de FontAwesome`);
    } catch (error) {
        console.error("Error cargando iconos:", error);
        // Fallback en caso de error
        ICONOS_GLOBALES = ['tag', 'shop', 'heart', 'star', 'user', 'house', 'gear'];
    }
}

// Ejecutar la carga al iniciar el script
cargarDiccionarioIconos();
/**
 * Abre el buscador visual de iconos
 */
async function abrirBuscadorIconos(nombreCategoria) {
    return new Promise((resolve) => {
        let translationTimer;
        const sugeridos = ['shop', 'cart-shopping', 'tag', 'star', 'heart', 'truck', 'credit-card', 'user', 'shirt', 'laptop'];

        Swal.fire({
            title: `<span class="text-xs uppercase font-black">Icono para: ${nombreCategoria}</span>`,
            html: `
                <div class="p-2">
                    <input type="text" id="icon_search_input" 
                           class="w-full p-3 rounded-xl border border-slate-200 mb-4 text-sm focus:outline-none focus:border-blue-500 shadow-sm" 
                           placeholder="Busca en español (ej: zapato, comida, casa)..." autofocus>
                    <div id="icon_grid" class="grid grid-cols-4 gap-3 max-h-[350px] overflow-y-auto p-2 scrollbar-thin">
                        ${generarGridHTML(sugeridos)}
                    </div>
                </div>
            `,
            showConfirmButton: false,
            showCancelButton: true,
            cancelButtonText: 'Cancelar',
            customClass: { popup: 'rounded-[2rem]' },
            didOpen: () => {
                const input = document.getElementById('icon_search_input');
                const grid = document.getElementById('icon_grid');

                input.addEventListener('input', (e) => {
                    const termOriginal = e.target.value.toLowerCase().trim();
                    clearTimeout(translationTimer);

                    if (termOriginal.length < 3) {
                        if (termOriginal.length === 0) grid.innerHTML = generarGridHTML(sugeridos);
                        return;
                    }

                    // Debounce de 600ms para no saturar la API de traducción
                    translationTimer = setTimeout(async () => {
                        grid.innerHTML = `
                            <div class="col-span-4 text-center py-10">
                                <i class="fa-solid fa-circle-notch fa-spin text-2xl text-blue-500"></i>
                                <p class="text-[10px] mt-2 font-bold uppercase text-slate-400">Traduciendo y buscando...</p>
                            </div>`;

                        // Traducimos (Ej: "fresa" -> "strawberry")
                        const termIngles = await traducirBusqueda(termOriginal);

                        // Filtramos en la lista global
                        const filtrados = ICONOS_GLOBALES
                            .filter(icon => icon.includes(termIngles) || icon.includes(termOriginal))
                            .slice(0, 40);

                        grid.innerHTML = generarGridHTML(filtrados);
                    }, 600);
                });
            }
        });

        window.seleccionarIconoFinal = (clase) => {
            Swal.close();
            resolve(clase);
        };
    });
}

function generarGridHTML(lista) {
    if (lista.length === 0) {
        return `<div class="col-span-4 text-center py-10 text-slate-400 text-[10px] font-bold">SIN RESULTADOS</div>`;
    }

    return lista.map(icon => {
        // FontAwesome usa el prefijo "fa-" en el nombre del icono
        const nombreIcono = icon.startsWith('fa-') ? icon : `fa-${icon}`;
        const claseCompleta = `fa-solid ${nombreIcono}`;

        return `
            <div onclick="window.seleccionarIconoFinal('${claseCompleta}')" 
                 class="flex flex-col items-center justify-center p-4 border border-slate-50 rounded-2xl hover:bg-blue-600 hover:text-white cursor-pointer transition-all group aspect-square">
                <i class="${claseCompleta} text-2xl mb-1 group-hover:scale-125 transition-transform"></i>
                <span class="text-[7px] uppercase font-black opacity-40 group-hover:opacity-100 truncate w-full text-center">
                    ${icon.replace('fa-', '')}
                </span>
            </div>
        `;
    }).join('');
}
/**
 * Traduce el término de búsqueda al inglés para que coincida con la API de FontAwesome
 */
async function traducirBusqueda(texto) {
    if (!texto) return '';
    try {
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(texto)}&langpair=es|en`);
        const data = await res.json();
        return data.responseData.translatedText.toLowerCase();
    } catch (e) {
        console.error("Error traduciendo:", e);
        return texto; // Si falla, devolvemos el texto original
    }
}

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
     * Búsqueda con Debounce corregida para manejar Iconos (Categorías) e Imágenes (Productos).
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
                            const precio = res.precio || 0;

                            // Escapamos strings para el onclick
                            const nombreEscapado = nombre.replace(/'/g, "\\'").replace(/"/g, "&quot;");
                            const imagenEscapada = imagen.replace(/'/g, "\\'");
                            const linkEscapado = link.replace(/'/g, "\\'");

                            // Determinamos si es una categoría para mostrar icono en vez de imagen rota
                            const esCategoria = tipo === 'categorias' || imagen.startsWith('fa-');

                            return `
                                <div onclick="carruselActions.seleccionarResultado('${id}', '${nombreEscapado}', '${imagenEscapada}', '${linkEscapado}', ${precio})" 
                                     class="flex items-center gap-3 p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 transition-colors group">
                                    
                                    <div class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
                                        ${esCategoria ?
                                    `<i class="fa-solid fa-layer-group text-blue-500 text-lg"></i>` :
                                    `<img src="${imagen}" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/100?text=No+Img'">`
                                }
                                    </div>

                                    <div class="flex flex-col min-w-0 flex-1">
                                        <span class="text-xs font-black text-slate-700 uppercase truncate">${nombre}</span>
                                        <div class="flex items-center gap-2">
                                            ${precio > 0
                                    ? `<span class="text-[10px] font-bold text-blue-600">Bs. ${precio.toLocaleString()}</span>`
                                    : `<span class="text-[9px] text-slate-400 font-bold uppercase">${tipo === 'categorias' ? 'Click para asignar icono' : ''}</span>`
                                }
                                        </div>
                                    </div>

                                    <div class="w-8 h-8 flex items-center justify-center rounded-full group-hover:bg-blue-100 transition-colors">
                                        <i class="fa-solid fa-plus text-slate-300 group-hover:text-blue-600 text-xs"></i>
                                    </div>
                                </div>
                            `;
                        }).join('');
                        listaResultados.classList.remove('hidden');
                    } else {
                        listaResultados.innerHTML = `
                            <div class="p-6 text-center">
                                <i class="fa-solid fa-magnifying-glass text-slate-200 text-2xl mb-2"></i>
                                <p class="text-[10px] font-black text-slate-400 uppercase">Sin resultados para "${termino}"</p>
                            </div>`;
                        listaResultados.classList.remove('hidden');
                    }
                }
            } catch (error) {
                console.error("Error en búsqueda:", error);
                if (listaResultados) {
                    listaResultados.innerHTML = `
                        <div class="p-4 text-center">
                            <span class="text-[10px] text-red-400 uppercase font-bold italic">Error de conexión con el servidor</span>
                        </div>`;
                }
            }
        }, 400);
    },

    /**
     * Selecciona un ítem de la búsqueda y llena el formulario.
     * Actualizado para manejar el precio y mejorar la previsualización.
     */
    async seleccionarResultado(id, nombre, imagen, link, precio) {
        console.log("1. [Seleccionar] Datos recibidos:", { id, nombre, precio });

        // --- NUEVA LÓGICA DE ICONOS ---
        let valorMediaFinal = imagen;
        const tipoActual = carruselState.config.tipo;

        if (tipoActual === 'categorias') {
            const iconoElegido = await abrirBuscadorIconos(nombre);
            if (!iconoElegido) return; // Si cancela, no hacemos nada
            valorMediaFinal = iconoElegido;
        }
        // ------------------------------

        const inputRelacion = document.getElementById('it_relacion_id');
        const inputTitulo = document.getElementById('it_titulo');
        const inputMedia = document.getElementById('it_media_url');
        const inputLink = document.getElementById('it_link');
        const inputSubtitulo = document.getElementById('it_subtitulo');
        const previewBox = document.getElementById('preview_box');

        // 1. Llenado de inputs básicos
        if (inputRelacion) inputRelacion.value = id;
        if (inputTitulo) inputTitulo.value = nombre;
        if (inputMedia) inputMedia.value = valorMediaFinal; // Aquí se guarda "fa-solid..." o "https://..."
        if (inputLink) inputLink.value = link || '';

        // 2. Llenado del precio (Subtítulo)
        if (inputSubtitulo) {
            const precioFormateado = (precio && precio > 0)
                ? `Bs. ${precio.toLocaleString()}`
                : (tipoActual === 'categorias' ? "" : "Consultar precio");

            inputSubtitulo.value = precioFormateado;
        }

        // 3. Previsualización inteligente en el cuadro de edición
        if (previewBox) {
            if (valorMediaFinal.startsWith('fa-')) {
                // Render para ICONO
                previewBox.innerHTML = `
                <div class="flex items-center justify-center w-full h-full bg-slate-50 rounded-xl shadow-inner">
                    <i class="${valorMediaFinal} text-6xl text-blue-600 animate-pop"></i>
                </div>
            `;
            } else {
                // Render para IMAGEN (Producto/Banner)
                const badgePrecio = (precio && precio > 0)
                    ? `<div class="absolute bottom-2 right-2 bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg border border-white/20">
                    BS. ${precio.toLocaleString()}
                   </div>`
                    : '';

                previewBox.innerHTML = `
                <div class="relative w-full h-full flex items-center justify-center bg-white rounded-xl overflow-hidden shadow-inner">
                    <img src="${valorMediaFinal}" class="max-w-full max-h-full object-contain p-2 animate-fade-in" onerror="this.src='https://placehold.co/400?text=Error+Imagen'">
                    ${badgePrecio}
                </div>
            `;
            }
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
    // En carruselActions.js -> modificar capturarItem
    /**
  * Captura los datos del formulario de ítems y los prepara para el State y la DB.
  * Resuelve el problema de guardado de iconos en imagen_url_manual.
  */
    capturarItem() {
        console.log("--- INICIO CAPTURA DE ÍTEM ACTUALIZADO ---");

        // 1. Referencias al DOM
        const elMedia = document.getElementById('it_media_url');
        const elTitulo = document.getElementById('it_titulo');
        const elSubtitulo = document.getElementById('it_subtitulo');
        const elLink = document.getElementById('it_link');
        const elRelacion = document.getElementById('it_relacion_id');

        // 2. Extracción de valores
        // mediaUrl puede ser una URL (https://...) o un icono (fa-solid...)
        const mediaUrl = elMedia?.value || '';
        const titulo = elTitulo?.value.trim() || '';
        const subtitulo = elSubtitulo?.value.trim() || '';
        const link = elLink?.value.trim() || '';
        const relacionId = elRelacion?.value || null;

        const tipoActual = carruselState.config.tipo;

        // Validación básica: Banners necesitan imagen obligatoria
        if (!mediaUrl && tipoActual === 'banners') {
            Swal.fire("Error", "Los banners deben tener una imagen o contenido visual", "warning");
            return null;
        }

        // 3. Construcción del Objeto compatible con TU Base de Datos
        const itemFinal = {
            // --- PARA EL FRONTEND (Uso en templates y previews) ---
            imagen_preview: mediaUrl,
            titulo: titulo,
            subtitulo: subtitulo,
            link: link,
            relacion_id: relacionId,
            tipo_contenido: tipoActual,

            // --- PARA TU BASE DE DATOS (Mapeo a columnas reales) ---
            titulo_manual: titulo,
            subtitulo_manual: subtitulo,
            link_destino_manual: link,

            /**
             * LÓGICA DE GUARDADO CRÍTICA:
             * Si el usuario eligió un icono (fa-...) lo guardamos en 'icono_manual'
             * si eligió una URL, lo guardamos en 'imagen_url_manual'.
             * Según tu requerimiento, nos aseguramos de que 'imagen_url_manual' no quede vacío si es icono.
             */
            imagen_url_manual: mediaUrl.startsWith('fa-') ? null : mediaUrl,
            icono_manual: mediaUrl.startsWith('fa-') ? mediaUrl : null,

            // IDs específicos para las relaciones de Supabase
            producto_id: tipoActual === 'productos' ? (relacionId ? parseInt(relacionId) : null) : null,
            categoria_id: tipoActual === 'categorias' ? (relacionId ? parseInt(relacionId) : null) : null,
        };

        // Cascada de respaldo: Si en tu DB prefieres que los iconos TAMBIÉN se guarden en imagen_url_manual
        // descomenta la siguiente línea:
        // if (mediaUrl.startsWith('fa-')) itemFinal.imagen_url_manual = mediaUrl;

        // 4. Preservación de ID para Edición
        // Si estamos editando un ítem que ya existe en la DB, debemos mantener su ID
        if (carruselState._editingItemIdx !== null) {
            const listaItems = Array.isArray(carruselState.items) ? carruselState.items : (carruselState.items.items || []);
            const itemOriginal = listaItems[carruselState._editingItemIdx];

            if (itemOriginal && itemOriginal.id) {
                itemFinal.id = itemOriginal.id;
            }
        }

        console.log("3. [Objeto Final] Sincronizado para enviar:", itemFinal);
        return itemFinal;
    },
    /**
     * Carga los datos de un ítem del state al formulario para editarlos.
     * Maneja de forma especial si es categoría para permitir cambiar el icono.
     */
    async cambiarIconoEdicion() {
        const elTitulo = document.getElementById('it_titulo');
        const elMedia = document.getElementById('it_media_url');
        const nombreActual = elTitulo ? elTitulo.value : 'Categoría';

        // Abrimos tu buscador existente
        const nuevoIcono = await abrirBuscadorIconos(nombreActual);

        if (nuevoIcono) {
            // Actualizamos el input oculto/visible de la URL/Icono
            if (elMedia) elMedia.value = nuevoIcono;

            // Actualizamos la previsualización cuadrada
            this._actualizarPreviewLocal(nuevoIcono);

            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Icono actualizado',
                showConfirmButton: false,
                timer: 2000
            });
        }
    },
    async editarItem(index) {
        // 1. Obtener el item del estado
        const item = carruselState.items[index];
        if (!item) return;

        // 2. Mapeo de elementos del DOM
        const elMedia = document.getElementById('it_media_url');
        const elTitulo = document.getElementById('it_titulo');
        const elSubtitulo = document.getElementById('it_subtitulo');
        const elLink = document.getElementById('it_link');
        const elRelacion = document.getElementById('it_relacion_id');

        // 3. Llenar el formulario con los datos actuales del item
        // Esto asegura que si es categoría, el input de media tenga el "fa-solid..."
        if (elMedia) elMedia.value = item.imagen_preview || '';
        if (elTitulo) elTitulo.value = item.titulo || '';
        if (elSubtitulo) elSubtitulo.value = item.subtitulo || '';
        if (elLink) elLink.value = item.link || '';

        // El ID de relación es vital para Productos y Categorías
        if (elRelacion) {
            elRelacion.value = item.producto_id || item.categoria_id || '';
        }

        // 4. Actualizar Previsualización inmediatamente
        // Así el usuario ve el icono o imagen que ya estaba guardada
        this._actualizarPreviewLocal(item.imagen_preview);

        // 5. Gestión del flujo de edición:
        // Eliminamos de la lista temporal para que al dar click en "+" se re-inserte con cambios.
        carruselState.items.splice(index, 1);
        this.renderItems();

        // 6. Feedback visual
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'info',
            title: 'Modo edición: Actualiza los campos y pulsa (+)',
            showConfirmButton: false,
            timer: 3000
        });
    },
    // Método auxiliar para no repetir código de preview
    _actualizarPreviewLocal(media) {
        const previewBox = document.getElementById('preview_box');
        if (!previewBox) return;

        // 1. Limpiar clases previas de layout para evitar conflictos visuales
        previewBox.classList.remove('bg-slate-50', 'bg-blue-50');

        // 2. Si media es nulo o vacío, mostrar placeholder neutro
        if (!media || media.trim() === '') {
            previewBox.innerHTML = `
            <div class="flex flex-col items-center justify-center text-slate-300">
                <span class="material-symbols-outlined text-5xl">image</span>
                <span class="text-xs mt-2 uppercase font-semibold">Sin Contenido</span>
            </div>`;
            previewBox.classList.add('bg-slate-50');
            return;
        }

        // 3. Lógica de renderizado según el tipo de contenido
        // Detectamos si es FontAwesome (clases que contienen 'fa-')
        const esFontAwesome = media.includes('fa-');

        if (esFontAwesome) {
            // Renderizado de Icono
            // Añadimos una transición suave y un color que resalte
            previewBox.innerHTML = `
            <div class="flex items-center justify-center w-full h-full animate-fade-in">
                <i class="${media} text-6xl text-blue-600 drop-shadow-sm"></i>
            </div>`;
            previewBox.classList.add('bg-blue-50');
        }
        else {
            // Renderizado de Imagen
            // Agregamos object-cover para que no se deforme y un fallback por si la URL falla
            previewBox.innerHTML = `
            <img src="${media}" 
                 class="w-full h-full object-cover animate-fade-in rounded-lg" 
                 onerror="this.onerror=null; this.src='https://placehold.co/400x400?text=Imagen+No+Valida';">`;
        }
    },
    /**
     * Renderiza la lista de items agregados (la columna derecha)
     * Asegúrate de llamar a este método cada vez que agregues o quites items.
     */
    renderItems() {
        const contenedor = document.getElementById('items_agregados_list');
        if (!contenedor) return;

        if (carruselState.items.length === 0) {
            contenedor.innerHTML = `<div class="text-center p-8 text-slate-400">No hay elementos</div>`;
            return;
        }

        contenedor.innerHTML = carruselState.items.map((item, index) => `
            <div class="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl mb-2 shadow-sm group">
                <div class="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                    ${item.imagen_preview.startsWith('fa-')
                ? `<i class="${item.imagen_preview} text-blue-500"></i>`
                : `<img src="${item.imagen_preview}" class="w-full h-full object-cover">`
            }
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-[10px] font-black text-slate-700 uppercase truncate">${item.titulo}</p>
                    <p class="text-[9px] text-slate-400 truncate">${item.subtitulo || 'Sin subtítulo'}</p>
                </div>
                <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="carruselActions.editarItem(${index})" class="p-2 text-blue-500 hover:bg-blue-50 rounded-lg">
                        <i class="fa-solid fa-pen-to-square text-xs"></i>
                    </button>
                    <button onclick="carruselActions.eliminarItem(${index})" class="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                        <i class="fa-solid fa-trash text-xs"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },

    eliminarItem(index) {
        carruselState.items.splice(index, 1);
        this.renderItems();
    },

    seleccionarIcono(nombreIcono) {
        console.log("Icono seleccionado:", nombreIcono);
        const inputMedia = document.getElementById('it_media_url');

        if (inputMedia) {
            inputMedia.value = nombreIcono;

            // Actualizamos el preview visual inmediatamente
            this._actualizarPreviewLocal(nombreIcono);

            // Opcional: Si usas SweetAlert2 para el selector, puedes cerrarlo aquí
            if (window.Swal && Swal.isVisible()) {
                // Solo cerrar si es un modal de selección
                // Swal.close(); 
            }
        } else {
            console.error("No se encontró el input #it_media_url para asignar el icono");
        }
    },
    /**
     * Orquestador final de guardado
     */
    async enviarAlServidor() {
        const state = window.carruselState;
        const listaItems = Array.isArray(state.items) ? state.items : (state.items.items || []);

        if (!state || listaItems.length === 0) {
            carruselActions._alertError("No hay ítems para guardar");
            return;
        }

        const result = await Swal.fire({
            title: '¿Guardar Cambios?',
            text: "Los cambios se aplicarán inmediatamente en la web",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, guardar',
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#64748b',
            customClass: { popup: 'rounded-[2rem]' }
        });

        if (!result.isConfirmed) return;

        // --- DEPURACIÓN: REVISAR ESTADO ANTES DE ENVIAR ---
        console.group("🔍 DEPURACIÓN PRE-ENVÍO");
        console.log("Estado actual de ítems:", listaItems);
        console.table(listaItems.map((it, idx) => ({
            index: idx,
            titulo: it.titulo_manual || it.titulo,
            preview: it.imagen_preview,
            es_icono: it.imagen_preview?.startsWith('fa-'),
            col_icono: it.icono_manual,
            col_imagen: it.imagen_url_manual
        })));
        console.groupEnd();

        Swal.fire({
            title: 'Procesando...',
            html: 'Guardando configuración e ítems...',
            didOpen: () => { Swal.showLoading(); },
            allowOutsideClick: false,
            customClass: { popup: 'rounded-[2rem]' }
        });

        try {
            const ctrl = window.carruselController;
            if (!ctrl) throw new Error("Controlador no disponible");

            const resConfig = await ctrl.guardarConfiguracion(state.config, state._id);
            if (!resConfig.exito) throw new Error("Error al guardar configuración: " + resConfig.mensaje);

            const carruselId = resConfig.id;

            console.log("🚀 Iniciando vinculación de ítems para Carrusel ID:", carruselId);
            await ctrl.limpiarItemsCarrusel(carruselId);

            for (const [index, item] of listaItems.entries()) {

                // Construcción del payload con logs individuales
                const esIcono = item.imagen_preview?.startsWith('fa-') || item.icono_manual;

                const payload = {
                    carrusel_id: carruselId,
                    orden: index,
                    titulo_manual: item.titulo_manual || item.titulo,
                    subtitulo_manual: item.subtitulo_manual || item.subtitulo,
                    // Si el item.icono_manual viene vacío, lo rescatamos del preview aquí mismo
                    imagen_url_manual: item.imagen_url_manual || (item.imagen_preview?.startsWith('fa-') ? null : item.imagen_preview),
                    icono_manual: item.icono_manual || (item.imagen_preview?.startsWith('fa-') ? item.imagen_preview : null),
                    link_destino_manual: item.link_destino_manual || item.link,
                    producto_id: item.producto_id,
                    categoria_id: item.categoria_id,
                    activo: true
                };

                console.log(`📤 Enviando Ítem [${index}]:`, {
                    Icono: payload.icono_manual,
                    Imagen: payload.imagen_url_manual
                });

                await ctrl.vincularItemSinRefrescar(payload);
            }

            await Swal.fire({
                icon: 'success',
                title: '¡Publicado!',
                text: 'El carrusel se ha actualizado correctamente',
                showConfirmButton: false,
                timer: 2000,
                customClass: { popup: 'rounded-[2rem]' }
            });

            if (window.RegisterCarrusel) {
                RegisterCarrusel.cerrarYRefrescar();
            }

        } catch (error) {
            console.error("❌ Error crítico en envío:", error);
            carruselActions._alertError("Error al guardar: " + error.message);
        }
    }
};