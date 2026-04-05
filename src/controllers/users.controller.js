const pool = require("../config/db");
const bcrypt = require("bcryptjs");

// Obtener todos
exports.getUsers = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT id, email FROM users");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener uno
exports.getUser = async (req, res) => {
    const { id } = req.params;

    try {
        if (req.user.role !== "admin" && req.user.id !== parseInt(id)) {
            return res.status(403).json({ message: "No autorizado" });
        }

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

// Actualizar
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { email, password } = req.body;

    try {
        if (req.user.role !== "admin" && req.user.id !== parseInt(id)) {
            return res.status(403).json({ message: "No autorizado" });
        }

        let hash;

        if (password) {
            hash = await bcrypt.hash(password, 10);
        }

        await pool.query(
            "UPDATE users SET email = ?, password = COALESCE(?, password) WHERE id = ?",
            [email, hash, id]
        );

        res.json({ message: "Usuario actualizado" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar
exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        if (req.user.id !== parseInt(id)) {
            return res.status(403).json({ message: "No autorizado" });
        }

        await pool.query("DELETE FROM users WHERE id = ?", [id]);

        res.json({ message: "Usuario eliminado" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};