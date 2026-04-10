/**
 * Middleware para autorizar roles específicos
 * @param {Array} roles - Un arreglo de roles permitidos (ej. ['admin', 'user'])
 */
module.exports = (roles) => (req, res, next) => {

    // El objeto 'req.user' fue inyectado previamente por el middleware de autenticación (JWT)
    // Aquí verificamos si el rol del usuario actual NO está incluido en la lista de roles permitidos
    if (!roles.includes(req.user.role)) {

        // Si el rol no tiene permiso, devolvemos un error 403 (Forbidden/Prohibido)
        // Esto detiene la ejecución y no llega al controlador final
        return res.status(403).json({ message: "Acceso denegado" });
    }

    // Si el rol es válido, permitimos que la petición continúe
    next();
};