// Carga el cliente MySQL con soporte para Promises (async/await)
const mysql = require("mysql2/promise");

// Carga las variables de entorno desde el archivo .env
require("dotenv").config();

// Crea un pool de conexiones a la base de datos.
// Un pool reutiliza conexiones existentes en lugar de abrir
// una nueva por cada consulta, mejorando el rendimiento.
const pool = mysql.createPool({
    host: process.env.DB_HOST,         // Dirección del servidor MySQL
    user: process.env.DB_USER,         // Usuario de la base de datos
    password: process.env.DB_PASSWORD, // Contraseña (leída desde .env, nunca hardcodeada)
    database: process.env.DB_NAME,     // Nombre de la base de datos a usar
    port: 3307                         // Puerto no estándar (MySQL usa 3306 por defecto)
});

// Exporta el pool para usarlo en cualquier módulo que necesite
// ejecutar consultas sin gestionar conexiones manualmente.
module.exports = pool;