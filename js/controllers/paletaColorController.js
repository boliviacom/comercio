// js/controllers/paletaColorController.js
import { paletaColorModel } from '../models/paletaColorModel.js';
import { paletaColorView } from '../views/paletaColorView.js';

export const paletaColorController = {

    async inicializar() {
        const paletas = await paletaColorModel.obtenerTodas();
        if (paletas) {
            paletaColorView.renderizarLista(paletas);
            const activa = paletas.find(p => p.es_activa);
            if (activa) this.aplicarPaletaAlSistema(activa);
        }
    },

    async abrirFormularioCreacion() {
        try {
            // El controlador solo gestiona la obtención del recurso (HTML)
            const response = await fetch('../paleta_colores/create.html'); 
            if (!response.ok) throw new Error("No se pudo cargar create.html");
            const html = await response.text();

            // La vista se encarga de mostrarlo e inicializar la interactividad visual
            paletaColorView.mostrarFormularioCreacion(html);

            // El controlador vincula la lógica de negocio (el envío de datos)
            const form = document.getElementById('formNuevaPaleta');
            if (form) {
                form.addEventListener('submit', (e) => this.handleCrearPaleta(e));
            }
        } catch (error) {
            console.error("Error al abrir formulario:", error);
        }
    },

    async handleCrearPaleta(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const datosPaleta = Object.fromEntries(formData.entries());
        datosPaleta.es_activa = false;

        const res = await paletaColorModel.crearPaleta(datosPaleta);
        if (res.exito) {
            paletaColorView.cerrarModal();
            this.inicializar();
        } else {
            alert("Error al guardar en base de datos");
        }
    },

    cerrarModal() {
        paletaColorView.cerrarModal();
    },

    async seleccionarPaleta(id) {
        const res = await paletaColorModel.activarPaleta(id);
        if (res.exito) {
            this.aplicarPaletaAlSistema(res.paletaActiva);
            this.inicializar();
        }
    },

    async borrarPaleta(id) {
        if (confirm('¿Deseas eliminar esta paleta permanentemente?')) {
            const res = await paletaColorModel.eliminarPaleta(id);
            if (res.exito) this.inicializar();
        }
    },

    aplicarPaletaAlSistema(paleta) {
        if (window.tailwind) {
            tailwind.config.theme.extend.colors = {
                ...tailwind.config.theme.extend.colors,
                "primary": paleta.color_primary,
                "secondary": paleta.color_secondary,
                "accent": paleta.color_accent,
                "background-light": paleta.color_bg,
                "surface": paleta.color_surface,
                "text-primary": paleta.color_text
            };
        }
    }
};

// Globales
window.abrirModalPaleta = () => paletaColorController.abrirFormularioCreacion();
window.cerrarModalPaleta = () => paletaColorController.cerrarModal();
window.handleActivarPaleta = (id) => paletaColorController.seleccionarPaleta(id);
window.handleEliminarPaleta = (id) => paletaColorController.borrarPaleta(id);