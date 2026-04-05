const router = require("express").Router();
const auth = require("../controllers/auth.controller");
const verifyToken = require("../middleware/auth.middleware");

router.post("/users", auth.seeUser);
router.post("/register", auth.register);
router.post("/login", auth.login);

// Ruta protegida
router.get("/profile", verifyToken, (req, res) => {
    res.json({ message: "Acceso autorizado", user: req.user });
});

module.exports = router;