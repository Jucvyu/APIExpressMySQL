const app = require("./app"); // Importamos la configuración de Express definida en el archivo app.js
require("dotenv").config();  // Carga las variables de entorno desde el archivo .env (PORT, DB_HOST, JWT_SECRET, etc.)

/**
 * Encendido del servidor
 * app.listen inicia el proceso para que el servidor escuche peticiones HTTP
 * process.env.PORT: Toma el puerto definido en el archivo .env (ej. 3000)
 */
app.listen(process.env.PORT, () => {
    // Una vez que el servidor se levanta con éxito, se ejecuta este callback
    console.log(`Server corriendo en el puerto ${process.env.PORT}`);
});