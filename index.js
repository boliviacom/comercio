require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser'); // 1. Importar cookie-parser

// IMPORTAR RUTAS Y MIDDLEWARES
const usuarioRoutes = require('./routes/usuarioRoutes');
const { esOwner } = require('./middlewares/authMiddleware');

const app = express();

// MIDDLEWARES DE CONFIGURACIÓN
app.use(cors());
app.use(express.json());
app.use(cookieParser()); // 2. Activar el uso de cookies en Express

// 3. RUTAS DE VISTA (Prioridad alta)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Ruta protegida con cookies
// El middleware 'esOwner' ahora buscará el token en las cookies
app.get('/dashboard', esOwner, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'administracion.html'));
});

// 4. RUTAS DE API
app.use('/api/usuarios', usuarioRoutes);

// 5. ARCHIVOS ESTÁTICOS
// Se colocan al final para que no interfieran con las rutas limpias
app.use(express.static(path.join(__dirname, 'public')));

// Ruta de prueba
app.get('/api/status', (req, res) => {
    res.json({ mensaje: "Backend y Cookies configurados correctamente" });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(`🚀 Servidor: http://localhost:${PORT}`);
    console.log(`🍪 Cookie-parser activado`);
    console.log(`🛡️  Ruta /admin protegida por Middleware + Cookies`);
    console.log(`=============================================`);
});