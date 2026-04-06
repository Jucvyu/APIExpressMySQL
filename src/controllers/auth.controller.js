const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Registro de usuario
exports.register = async (req, res) => {
    const { email, password } = req.body;
    const role = "user";

    try {
        const hash = await bcrypt.hash(password, 10);

        await pool.query(
            "INSERT INTO users (email, password) VALUES (?, ?, ?)",
            [email, hash, role]
        );

        res.json({ message: "Usuario registrado con exito" });
    } catch (error) {
        console.error("ERROR COMPLETO:", JSON.stringify(error, null, 2));
        console.error("SQL MESSAGE:", error.sqlMessage);
        console.error("CODE:", error.code);
        console.error("MESSAGE:", error.message);

        res.status(500).json({
            error: error.message,
            code: error.code
        });
    }
}

// Login de usuario
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await pool.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (rows.length === 0)
            return res.status(400).json({ message: "Usuario no existe" });

        const user = rows[0];

        const valid = await bcrypt.compare(password, user.password);
        if (!valid)
            return res.status(400).json({ message: "Contraseña incorrecta" });

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({ token });
    } catch (error) {
        console.error("ERROR COMPLETO:", JSON.stringify(error, null, 2));
        console.error("SQL MESSAGE:", error.sqlMessage);
        console.error("CODE:", error.code);
        console.error("MESSAGE:", error.message);

        res.status(500).json({
            error: error.message,
            code: error.code
        });
    }
};