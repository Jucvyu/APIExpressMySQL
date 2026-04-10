// Importación de dependencias necesarias
const pool = require("../config/db"); // Conexión a la base de datos (usualmente MySQL o MariaDB)
const bcrypt = require("bcryptjs");   // Librería para encriptar y comparar contraseñas
const jwt = require("jsonwebtoken");  // Librería para generar JSON Web Tokens

/**
 * Lógica de Registro de Usuario
 */
exports.register = async (req, res) => {
    // Extraemos email y password del cuerpo de la petición (JSON)
    const { email, password } = req.body;

    try {
        // Encriptamos la contraseña usando un "salt" de 10 rondas
        // Nunca se deben guardar contraseñas en texto plano
        const hash = await bcrypt.hash(password, 10);

        // Insertamos el nuevo usuario en la base de datos
        // Se usan "prepared statements" (?) para evitar ataques de SQL Injection
        await pool.query(
            "INSERT INTO users (email, password) VALUES (?, ?)",
            [email, hash]
        );

        // Respuesta exitosa
        res.json({ message: "Usuario registrado con exito" });
    } catch (error) {
        // Log detallado de errores en el servidor para facilitar el debugging
        console.error("ERROR COMPLETO:", JSON.stringify(error, null, 2));
        console.error("SQL MESSAGE:", error.sqlMessage);
        console.error("CODE:", error.code);
        console.error("MESSAGE:", error.message);

        // Enviamos un error 500 (Server Error) al cliente con detalles del fallo
        res.status(500).json({
            error: error.message,
            code: error.code
        });
    }
}

/**
 * Lógica de Login de Usuario
 */
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Buscamos al usuario por su email
        const [rows] = await pool.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        // Si el array de resultados está vacío, el usuario no existe
        if (rows.length === 0)
            return res.status(400).json({ message: "Usuario no existe" });

        const user = rows[0];

        // Comparamos la contraseña recibida con el hash almacenado en la DB
        const valid = await bcrypt.compare(password, user.password);

        // Si no coinciden, devolvemos un error de credenciales
        if (!valid)
            return res.status(400).json({ message: "Contraseña incorrecta" });

        // Generamos un token JWT firmado que contiene datos básicos del usuario
        // Este token expira en 1 hora y usa una clave secreta del entorno (.env)
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        // Devolvemos el token al cliente (el cual deberá guardarlo para futuras peticiones)
        res.json({ token });
    } catch (error) {
        // Manejo de errores idéntico al de registro
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