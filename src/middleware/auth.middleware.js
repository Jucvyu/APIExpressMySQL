const jwt = require("jsonwebtoken"); // Importamos la librería para verificar tokens

/**
 * Middleware: Verifica si el token es válido y está presente
 * req: Petición
 * res: Respuesta
 * next: Función para pasar al siguiente controlador si todo está bien
 */
module.exports = (req, res, next) => {
    // Extraemos el token de los encabezados (headers) de la petición HTTP
    // Generalmente se envía bajo la clave 'authorization'
    const token = req.headers["authorization"];

    // Si no hay token, cortamos la comunicación aquí mismo
    if (!token) {
        return res.status(403).json({ message: "No se proporcionó un token" });
    }

    try {
        // Verificamos el token usando la clave secreta del servidor
        // Si el token expiró o fue manipulado, lanzará un error y entrará al catch
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // EXTRA CRUCIAL: Guardamos los datos decodificados (id, email, role)
        // dentro del objeto 'req'. Esto permite que los siguientes controladores
        // (como getUsers o updateUser) sepan quién está operando.
        req.user = decoded;

        // Si todo es correcto, llamamos a next() para seguir con la ejecución
        next();
    } catch (error) {
        // Si jwt.verify falla, devolvemos un error 401 (No autorizado)
        res.status(401).json({ message: "Token no valido" });
    }
}