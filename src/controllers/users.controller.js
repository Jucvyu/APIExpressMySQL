const pool = require("../config/db"); // Conexión a la base de datos
const bcrypt = require("bcryptjs");   // Para encriptar contraseñas si se actualizan

/**
 * Obtener todos los usuarios
 * Nota: Normalmente esta ruta debería estar protegida solo para administradores.
 */
exports.getUsers = async (req, res) => {
    try {
        // Ejecuta la consulta para traer todos los registros de la tabla
        const [rows] = await pool.query("SELECT * FROM users");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Obtener un usuario específico por ID
 */
exports.getUser = async (req, res) => {
    const { id } = req.params; // ID que viene en la URL /users/:id

    try {
        // LÓGICA DE AUTORIZACIÓN:
        // Solo permite continuar si el usuario es 'admin' O si el usuario está intentando ver su propio perfil
        if (req.user.role !== "admin" && req.user.id !== parseInt(id)) {
            return res.status(403).json({ message: "No autorizado" });
        }

        // Seleccionamos solo campos necesarios (buena práctica no traer el password aquí)
        const [rows] = await pool.query(
            "SELECT id, email FROM users WHERE id = ?",
            [id]
        );

        if (rows.length === 0)
            return res.status(404).json({ message: "Usuario no existe" });

        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Actualizar datos de usuario
 */
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { email, password } = req.body;

    try {
        // Verificación de identidad/permisos (Admin o dueño de la cuenta)
        if (req.user.role !== "admin" && req.user.id !== parseInt(id)) {
            return res.status(403).json({ message: "No autorizado" });
        }

        let hash;
        // Si el usuario envió una nueva contraseña, la encriptamos
        if (password) {
            hash = await bcrypt.hash(password, 10);
        }

        // COALESCE(?, password) es un truco de SQL: 
        // Si 'hash' es NULL (porque no se envió password), mantiene el valor actual de la DB
        await pool.query(
            "UPDATE users SET email = ?, password = COALESCE(?, password) WHERE id = ?",
            [email, hash, id]
        );

        res.json({ message: "Usuario actualizado" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Eliminar un usuario
 */
exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        // Solo el admin o el propio usuario pueden eliminar la cuenta
        if (req.user.role !== "admin" && req.user.id !== parseInt(id)) {
            return res.status(403).json({ message: "No autorizado" });
        }

        await pool.query("DELETE FROM users WHERE id = ?", [id]);

        res.json({ message: "Usuario eliminado" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};