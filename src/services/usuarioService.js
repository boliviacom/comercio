// src/services/usuarioService.js
const supabase = require('../config/supabase');
const usuarioModel = require('../models/usuarioModel');

const usuarioService = {
    /**
     * Lógica de Negocio: Iniciar sesión y obtener el perfil completo
     */
    async login(email, password) {
        // 1. Intentar login en Auth
        const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) throw authError;

        // 2. Si el login es exitoso, buscamos su perfil en la tabla de usuario
        const perfil = await usuarioModel.obtenerPorId(auth.user.id);

        return {
            user: auth.user,
            session: auth.session,
            perfil
        };
    },
    /**
         * Verifica un token de Supabase y recupera el perfil de la DB
         * ESTA ES LA FUNCIÓN QUE TU MIDDLEWARE ESTÁ BUSCANDO
         */
    async validarSesion(token) {
        try {
            // 1. Validar el token con Supabase Auth
            const { data: { user }, error } = await supabase.auth.getUser(token);

            if (error || !user) return null;

            // 2. Obtener el perfil extendido desde la tabla 'usuario'
            const perfil = await usuarioModel.obtenerPorId(user.id);

            // Retornamos el usuario de Auth + el perfil de la base de datos
            return { ...user, perfil };
        } catch (err) {
            return null;
        }
    },
    /**
     * Cierra la sesión en Supabase
     */
    async logout() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return true;
    },
    /**
     * Lógica de Negocio: Registro con Transacción Manual
     * Asegura que el usuario se cree en Auth Y en la tabla de base de datos.
     */
    async registrarNuevoUsuario(datos) {
        let authUserId = null;

        try {
            // 1. Crear el usuario en Supabase Auth
            const { data: auth, error: authErr } = await supabase.auth.signUp({
                email: datos.correo_electronico,
                password: datos.password,
            });

            if (authErr) throw authErr;
            if (!auth.user) throw new Error("No se pudo crear la cuenta de autenticación.");

            authUserId = auth.user.id; // Guardamos el ID para un posible rollback

            // 2. Crear el perfil en la tabla 'usuario' usando nuestro Modelo
            // Aquí pasamos el ID generado por Auth para vincularlos
            const perfil = await usuarioModel.crearPerfil({
                id: authUserId,
                nombres: datos.nombres,
                apellido_paterno: datos.apellido_paterno,
                apellido_materno: datos.apellido_materno,
                correo_electronico: datos.correo_electronico,
                celular: datos.celular,
                ci: datos.ci,
                rol: datos.rol || 'cliente',
                visible: true
            });

            return perfil;

        } catch (err) {
            // TRANSACCIÓN (Rollback manual):
            // Si algo falló después de crear el usuario en Auth (ej: fallo en la DB),
            // debemos eliminar el usuario de Auth para evitar un "usuario fantasma".
            if (authUserId) {
                // Se requiere el rol 'service_role' o permisos de admin para borrar
                await supabase.auth.admin.deleteUser(authUserId);
            }
            throw err; // Re-lanzamos el error para que el controlador lo maneje
        }
    },

    /**
     * Lógica de Negocio: Preparar datos para la vista de configuración
     */
    async obtenerEstructuraConfiguracion() {
        const usuarios = await usuarioModel.obtenerListadoConfiguracion();

        // Procesamos los datos (lógica que no debe estar en el modelo)
        const rolesUnicos = [...new Set(usuarios.map(u => u.rol))];
        const usuariosFormateados = usuarios.map(u => ({
            id: u.id,
            nombreCompleto: `${u.apellido_paterno} ${u.apellido_materno} ${u.nombres}`.trim()
        }));

        return {
            usuarios: usuariosFormateados,
            roles: rolesUnicos
        };
    }
};

module.exports = usuarioService;