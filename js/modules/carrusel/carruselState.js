export const carruselState = {
    _id: null,
    _paso: 1,
    _editingItemIdx: null,
    _slideActivo: 0,
    
    config: {
        nombre: '',
        descripcion: '',
        tipo: 'banners', // 'banners', 'productos', 'categorias'
        ubicacion_slug: 'home-top',
        orden_seccion: 0,
        activo: true
    },
    
    items: [],

    /**
     * Inicializa o resetea el estado para un nuevo carrusel o edición.
     * Soporta tanto datos nuevos como datos provenientes de Supabase.
     */
    init(id = null, datosExistentes = null) {
        this._id = id;
        this._paso = 1;
        this._editingItemIdx = null;
        this._slideActivo = 0;

        if (datosExistentes) {
            // MAPEO ROBUSTO: Mapeamos los campos de la DB al estado interno
            this.config = {
                nombre: datosExistentes.nombre || '',
                descripcion: datosExistentes.descripcion || '',
                tipo: datosExistentes.tipo || 'banners',
                ubicacion_slug: datosExistentes.ubicacion_slug || 'home-top',
                orden_seccion: parseInt(datosExistentes.orden_seccion) || 0,
                activo: datosExistentes.activo !== undefined ? datosExistentes.activo : true
            };

            // Si vienen ítems de la base de datos, los mapeamos para que la UI los entienda
            if (datosExistentes.items && Array.isArray(datosExistentes.items)) {
                this.items = datosExistentes.items.map(item => ({
                    imagen_preview: item.imagen_url_manual || (item.producto?.imagen_url) || (item.categoria?.imagen) || '',
                    titulo: item.titulo_manual || (item.producto?.nombre) || (item.categoria?.nombre) || '',
                    subtitulo: item.subtitulo_manual || '',
                    link: item.link_destino_manual || '',
                    producto_id: item.producto_id || null,
                    categoria_id: item.categoria_id || null,
                    tipo_contenido: this.config.tipo
                }));
            } else {
                this.items = [];
            }
        } else {
            this.resetConfig();
        }
    },

    /**
     * Limpia el estado a sus valores por defecto
     */
    resetConfig() {
        this.config = { 
            nombre: '', 
            descripcion: '', 
            tipo: 'banners', 
            ubicacion_slug: 'home-top', 
            orden_seccion: 0, 
            activo: true 
        };
        this.items = [];
        this._id = null;
        this._paso = 1;
    },

    /**
     * Cambia el tipo de carrusel y limpia los items para evitar inconsistencias
     * @returns {boolean} true si hubo un cambio real de tipo
     */
    setTipo(nuevoTipo) {
        if (this.config.tipo !== nuevoTipo) {
            this.config.tipo = nuevoTipo;
            this.items = []; // Limpieza de seguridad: no mezclar banners con productos
            this._editingItemIdx = null;
            this._slideActivo = 0;
            return true; 
        }
        return false;
    },

    /**
     * Agrega un nuevo ítem o actualiza uno existente si se está editando
     */
    agregarOActualizarItem(dataItem) {
        if (this._editingItemIdx !== null) {
            // Estamos editando un ítem de la lista
            this.items[this._editingItemIdx] = dataItem;
            this._editingItemIdx = null;
        } else {
            // Estamos agregando un ítem nuevo
            this.items.push(dataItem);
            this._slideActivo = this.items.length - 1;
        }
    },

    /**
     * Cambia la posición de un ítem en el array
     */
    reordenarItems(idx, direccion) {
        const nuevaPos = idx + direccion;
        if (nuevaPos < 0 || nuevaPos >= this.items.length) return false;
        
        const temp = this.items[idx];
        this.items[idx] = this.items[nuevaPos];
        this.items[nuevaPos] = temp;
        this._slideActivo = nuevaPos;
        return true;
    }
};