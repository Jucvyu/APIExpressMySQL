const router = require("express").Router(); // Creamos una instancia del enrutador de Express
const auth = require("../controllers/auth.controller"); // Importamos los controladores (register, login)
const verifyToken = require("../middleware/auth.middleware"); // Importamos el "portero" (el middleware del JWT)

/**
 * RUTA: Registro
 * POST /api/auth/register
 */
router.post("/register", auth.register);

/**
 * RUTA: Login
 * POST /api/auth/login
 */
router.post("/login", auth.login);

/**
 * RUTA: Perfil (Ruta protegida)
 * GET /api/auth/profile
 * * Aquí ocurre la "magia" del middleware:
 * 1. Primero se ejecuta 'verifyToken'.
 * 2. Si el token es válido, verifyToken inyecta el usuario en 'req.user' y llama a next().
 * 3. Luego se ejecuta la función anónima (req, res) que responde con los datos.
 */
router.get("/profile", verifyToken, (req, res) => {
    // Si llegamos aquí, es porque el token fue válido
    res.json({
        message: "Acceso autorizado",
        user: req.user // Devolvemos la información que el token contenía (id, email, role)
    });
});

module.exports = router; // Exportamos el router para usarlo en el archivo principal (app.js o index.js)