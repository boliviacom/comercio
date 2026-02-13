require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Servir archivos estáticos (Tu arquitectura actual de JS puro)
// IMPORTANTE: Mueve tus carpetas (js, views, images) y el index.html a una carpeta llamada 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Ruta de prueba para la API
app.get('/api/status', (req, res) => {
    res.json({ mensaje: "Backend conectado correctamente" });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
    console.log(`URL de Supabase configurada: ${process.env.SUPABASE_URL ? 'SÍ' : 'NO'}`);
});