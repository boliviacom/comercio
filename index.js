require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// 1. IMPORTAR RUTAS Y MIDDLEWARES
const usuarioRoutes = require('./routes/usuarioRoutes');
const { esOwner } = require('./middlewares/authMiddleware'); // Importamos el protector

const app = express();

// Middlewares de configuración
app.use(cors());
app.use(express.json());

// 2. SERVIR ARCHIVOS ESTÁTICOS (CSS, JS del cliente, Imágenes)
// Importante: Aquí ya NO habrá archivos .html, solo sus activos.
app.use(express.static(path.join(__dirname, 'public')));

// 3. RUTAS DE VISTA (Para URLs limpias)
// Ruta para el Login (Raíz)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Ruta protegida para Administración (URL: /admin)
// Aplicamos 'esOwner' para que ni siquiera cargue el HTML si no es el dueño.
app.get('/admin', esOwner, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'administracion.html'));
});

// 4. CONECTAR RUTAS DE LA API
app.use('/api/usuarios', usuarioRoutes);

// Ruta de prueba para la API
app.get('/api/status', (req, res) => {
    res.json({ mensaje: "Backend conectado correctamente" });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(`🚀 Servidor corriendo en: http://localhost:${PORT}`);
    console.log(`📂 Vistas cargadas desde: /views`);
    console.log(`🛡️  Ruta /admin protegida por middleware`);
    console.log(`=============================================`);
});