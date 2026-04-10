const express = require("express"); // El framework para construir el servidor
const cors = require("cors");       // Permite que aplicaciones externas (como un frontend en React) se conecten
const path = require("path");       // Utilidad para manejar rutas de carpetas de forma segura

const app = express(); // Inicializamos la aplicación

// --- MIDDLEWARES GLOBALES ---

app.use(cors()); // Habilita el intercambio de recursos de origen cruzado (CORS)
app.use(express.json()); // Permite que el servidor entienda y procese JSON en el cuerpo (body) de las peticiones

// Configura una carpeta "public" para servir archivos estáticos (HTML, CSS, imágenes)
// Esto es útil si tienes el frontend básico en la misma carpeta que el backend
app.use(express.static(path.join(__dirname, "..", "public")));

// --- RUTA DE BIENVENIDA / DOCUMENTACIÓN ---

app.get("/api", (req, res) => {
    // Un simple endpoint para verificar que el servidor está vivo y mostrar las rutas disponibles
    res.json({
        message: "API MySQL operativa",
        docs: {
            register: "POST /api/auth/register",
            login: "POST /api/auth/login",
            profile: "GET /api/auth/profile",
            users: "GET /api/users"
        }
    });
});

// --- DEFINICIÓN DE RUTAS (ENDPOINTS) ---

// Conectamos las rutas de autenticación
// Todas las rutas dentro de 'auth.routes' empezarán con '/api/auth'
app.use("/api/auth", require("./routes/auth.routes"));

// Conectamos las rutas de gestión de usuarios
// Todas las rutas dentro de 'users.routes' empezarán con '/api/users'
app.use("/api/users", require("./routes/users.routes"));

// Exportamos la configuración de 'app' para que el archivo 'index.js' (o server.js) la encienda
module.exports = app;