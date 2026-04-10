const router = require("express").Router(); // Instancia del enrutador de Express
const user = require("../controllers/users.controller"); // Controladores CRUD de usuarios
const verifyToken = require("../middleware/auth.middleware"); // Middleware para validar el JWT
const roleMiddleware = require("../middleware/role.middleware"); // Middleware para validar roles (admin, etc.)

/**
 * RUTA: Obtener todos los usuarios
 * GET /api/users/
 * Seguridad: 
 * 1. Debe tener un token válido (verifyToken).
 * 2. Debe ser estrictamente "admin" (roleMiddleware).
 */
router.get("/", verifyToken, roleMiddleware(["admin"]), user.getUsers);

/**
 * RUTA: Obtener un usuario por ID
 * GET /api/users/:id
 * Seguridad: Solo token válido. 
 * Nota: La lógica interna del controlador 'user.getUser' verificará si el ID solicitado 
 * coincide con el del usuario autenticado o si es admin.
 */
router.get("/:id", verifyToken, user.getUser);

/**
 * RUTA: Actualizar usuario
 * PUT /api/users/:id
 * Seguridad: Solo token válido. 
 * (Al igual que en 'getUser', el controlador se encarga de validar que no edites a otros).
 */
router.put("/:id", verifyToken, user.updateUser);

/**
 * RUTA: Eliminar usuario
 * DELETE /api/users/:id
 * Seguridad:
 * 1. Token válido.
 * 2. Solo el rol "admin" puede ejecutar esta acción según esta configuración de ruta.
 */
router.delete("/:id", verifyToken, roleMiddleware(["admin"]), user.deleteUser);

module.exports = router;