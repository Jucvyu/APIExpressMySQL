const router = require("express").Router();
const user = require("../controllers/user.controller");
const verifyToken = require("../middleware/auth.middleware");

router.get("/", verifyToken, user.getUsers);
router.get("/:id", verifyToken, user.getUser);
router.put("/:id", verifyToken, user.updateUser);
router.delete("/:id", verifyToken, user.deleteUser);

module.exports = router;