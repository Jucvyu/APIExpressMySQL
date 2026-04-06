const router = require("express").Router();
const user = require("../controllers/users.controller");
const verifyToken = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

router.get("/", verifyToken, roleMiddleware(["admin"]), user.getUsers);
router.get("/:id", verifyToken, user.getUser);
router.put("/:id", verifyToken, user.updateUser);
router.delete("/:id", verifyToken, roleMiddleware(["admin"]), user.deleteUser);

module.exports = router;